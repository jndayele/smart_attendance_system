"""
Admin Course Management Router.

Full CRUD, deactivate, assign-lecturer, clone, students, attendance-history.
"""
from typing import Optional
from uuid import UUID
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_

from app.database import get_db
from app.dependencies import require_admin
from app.models.course import Course
from app.models.programme import Programme
from app.models.lecturer import Lecturer
from app.models.student import Student, StudentCourse
from app.models.session import Session
from app.models.attendance import AttendanceRecord
from app.models.user import User
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse, CourseListResponse, CourseCloneRequest
from app.services.notification_service import NotificationService

router = APIRouter(dependencies=[Depends(require_admin)])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def get_course_or_404(course_id: str, db: AsyncSession) -> Course:
    try:
        c_uuid = UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid course ID")
    res = await db.execute(select(Course).where(Course.id == c_uuid))
    course = res.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


async def build_course_response(course: Course, db: AsyncSession) -> CourseResponse:
    prog = await db.get(Programme, course.programme_id) if course.programme_id else None
    lec = await db.get(Lecturer, course.lecturer_id) if course.lecturer_id else None
    stu_cnt = await db.execute(
        select(func.count(StudentCourse.id))
        .where(StudentCourse.course_id == course.id, StudentCourse.is_active == True)
    )
    sess_cnt = await db.execute(
        select(func.count(Session.id)).where(Session.course_id == course.id)
    )
    return CourseResponse(
        id=course.id,
        title=course.title,
        code=course.code,
        programme_id=course.programme_id,
        programme_name=prog.name if prog else "Unknown",
        programme_code=prog.code if prog else "Unknown",
        semester_id=course.semester_id,
        level=course.level,
        semester_number=course.semester_number,
        credit_hours=course.credit_hours,
        threshold_pct=course.threshold_pct,
        is_active=course.is_active,
        lecturer_id=course.lecturer_id,
        lecturer_name=lec.name if lec else None,
        enrolled_student_count=stu_cnt.scalar() or 0,
        session_count=sess_cnt.scalar() or 0,
        created_at=course.created_at,
        updated_at=course.updated_at,
    )


# ---------------------------------------------------------------------------
# LIST
# ---------------------------------------------------------------------------

@router.get("/", response_model=CourseListResponse)
async def list_courses(
    search: str = None,
    programme_id: str = None,
    level: int = None,
    semester_id: str = None,
    semester_number: int = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Course, Programme.name, Programme.code, Lecturer.name)
        .outerjoin(Programme, Course.programme_id == Programme.id)
        .outerjoin(Lecturer, Course.lecturer_id == Lecturer.id)
    )
    
    if search:
        query = query.filter(
            Course.title.ilike(f"%{search}%") | Course.code.ilike(f"%{search}%")
        )
    if programme_id:
        query = query.filter(Course.programme_id == programme_id)
    if level:
        query = query.filter(Course.level == level)
    if semester_id:
        query = query.filter(Course.semester_id == semester_id)
    if semester_number is not None:
        query = query.filter(Course.semester_number == semester_number)
        
    total_res = await db.execute(select(func.count(Course.id)))
    total = total_res.scalar() or 0

    res = await db.execute(query.offset((page - 1) * limit).limit(limit))
    rows = res.all()
    
    responses = []
    for c, p_name, p_code, l_name in rows:
        stu_cnt = await db.execute(
            select(func.count(StudentCourse.id))
            .filter(StudentCourse.course_id == c.id, StudentCourse.is_active == True)
        )
        sess_cnt = await db.execute(select(func.count(Session.id)).filter(Session.course_id == c.id))
        
        responses.append(CourseResponse(
            id=c.id,
            title=c.title,
            code=c.code,
            programme_id=c.programme_id,
            programme_name=p_name or "Unknown",
            programme_code=p_code or "Unknown",
            semester_id=c.semester_id,
            level=c.level,
            semester_number=c.semester_number,
            credit_hours=c.credit_hours,
            threshold_pct=c.threshold_pct,
            is_active=c.is_active,
            lecturer_id=c.lecturer_id,
            lecturer_name=l_name,
            enrolled_student_count=stu_cnt.scalar() or 0,
            session_count=sess_cnt.scalar() or 0,
            created_at=c.created_at,
            updated_at=c.updated_at,
        ))
        
    return CourseListResponse(courses=responses, total=total)


# ---------------------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------------------

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_course(
    data: CourseCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    code_check = await db.execute(select(Course).filter(func.lower(Course.code) == data.code.lower()))
    if code_check.scalars().first():
        raise HTTPException(status_code=409, detail="Course code already exists")
    
    if data.threshold_pct is None:
        from app.models.institution import Institution
        from app.config import get_settings
        settings = get_settings()
        inst_res = await db.execute(select(Institution).limit(1))
        inst = inst_res.scalars().first()
        data.threshold_pct = inst.settings_data.get("attendance_default_threshold", settings.ATTENDANCE_DEFAULT_THRESHOLD) if inst and inst.settings_data else settings.ATTENDANCE_DEFAULT_THRESHOLD

    new_course = Course(**data.model_dump())
    db.add(new_course)
    await db.commit()
    await db.refresh(new_course)
    
    # Auto-enroll matching students
    stu_res = await db.execute(
        select(Student).filter(
            Student.programme_id == new_course.programme_id,
            Student.level == new_course.level,
            Student.is_suspended == False
        )
    )
    students = stu_res.scalars().all()
    
    for s in students:
        existing = await db.execute(
            select(StudentCourse).where(
                StudentCourse.student_id == s.id,
                StudentCourse.course_id == new_course.id
            )
        )
        if not existing.scalars().first():
            sc = StudentCourse(student_id=s.id, course_id=new_course.id)
            db.add(sc)
    
    await db.commit()
    
    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="course_created",
        entity_type="course",
        entity_id=new_course.id,
        details={"students_auto_enrolled": len(students)},
        ip_address=request.client.host if request.client else None,
        db=db
    )
    
    response = await build_course_response(new_course, db)
    return {**response.model_dump(), "students_enrolled": len(students)}


# ---------------------------------------------------------------------------
# GET ONE
# ---------------------------------------------------------------------------

@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: str, db: AsyncSession = Depends(get_db)):
    course = await get_course_or_404(course_id, db)
    return await build_course_response(course, db)


# ---------------------------------------------------------------------------
# UPDATE
# ---------------------------------------------------------------------------

@router.patch("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    data: CourseUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    course = await get_course_or_404(course_id, db)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(course, k, v)
    course.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(course)
    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="course_updated",
        entity_type="course",
        entity_id=course.id,
        details=data.model_dump(exclude_unset=True),
        ip_address=request.client.host if request.client else None,
        db=db
    )
    return await build_course_response(course, db)


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------

@router.delete("/{course_id}")
async def delete_course(
    course_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    course = await get_course_or_404(course_id, db)
    
    sess_res = await db.execute(select(func.count(Session.id)).filter(Session.course_id == course.id))
    if sess_res.scalar() > 0:
        raise HTTPException(status_code=409, detail="Course has sessions; cannot delete")
        
    await db.delete(course)
    await db.commit()
    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="course_deleted",
        entity_type="course",
        entity_id=course.id,
        details={"title": course.title, "code": course.code},
        ip_address=request.client.host if request.client else None,
        db=db
    )
    return {"message": "Course deleted"}


# ---------------------------------------------------------------------------
# DEACTIVATE (FIX-P1-5)
# ---------------------------------------------------------------------------

@router.patch("/{course_id}/deactivate", response_model=CourseResponse)
async def deactivate_course(
    course_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    course = await get_course_or_404(course_id, db)
    course.is_active = False
    course.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(course)
    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="course_deactivated",
        entity_type="course",
        entity_id=course.id,
        details={"title": course.title, "code": course.code},
        ip_address=request.client.host if request.client else None,
        db=db
    )
    return await build_course_response(course, db)


# ---------------------------------------------------------------------------
# ASSIGN LECTURER (FIX-P1-5)
# ---------------------------------------------------------------------------

@router.patch("/{course_id}/assign-lecturer", response_model=CourseResponse)
async def assign_lecturer(
    course_id: str,
    payload: dict,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    course = await get_course_or_404(course_id, db)
    lecturer_id = payload.get("lecturer_id")
    if not lecturer_id:
        raise HTTPException(400, "lecturer_id is required")
    lec_res = await db.execute(select(Lecturer).where(Lecturer.id == UUID(lecturer_id)))
    lec = lec_res.scalars().first()
    if not lec:
        raise HTTPException(404, "Lecturer not found")
    if lec.is_suspended:
        raise HTTPException(400, "Cannot assign a suspended lecturer")
    course.lecturer_id = lec.id
    course.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(course)
    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="lecturer_assigned_to_course",
        entity_type="course",
        entity_id=course.id,
        details={"course_code": course.code, "lecturer_name": lec.name},
        ip_address=request.client.host if request.client else None,
        db=db
    )
    return await build_course_response(course, db)


# ---------------------------------------------------------------------------
# CLONE (FIX-P1-5)
# ---------------------------------------------------------------------------

@router.post("/{course_id}/clone")
async def clone_course(
    course_id: str,
    data: CourseCloneRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    original = await get_course_or_404(course_id, db)
    new_code = f"{original.code}_S{data.new_semester_number}"

    # Check code uniqueness
    existing = await db.execute(select(Course).where(Course.code == new_code))
    if existing.scalars().first():
        new_code = f"{new_code}_{datetime.utcnow().year}"

    new_course = Course(
        programme_id=original.programme_id,
        semester_id=data.new_semester_id,
        lecturer_id=original.lecturer_id,
        title=original.title,
        code=new_code,
        level=original.level,
        semester_number=data.new_semester_number,
        credit_hours=original.credit_hours,
        threshold_pct=original.threshold_pct,
        is_active=True,
    )
    db.add(new_course)
    await db.flush()

    # Auto-enroll students
    students_res = await db.execute(
        select(Student).where(
            Student.programme_id == new_course.programme_id,
            Student.level == new_course.level,
            Student.is_suspended == False,
        )
    )
    students = students_res.scalars().all()

    enrolled_count = 0
    try:
        for student in students:
            sc = StudentCourse(
                student_id=student.id,
                course_id=new_course.id,
                enrolled_at=datetime.utcnow(),
                is_active=True,
            )
            db.add(sc)
            enrolled_count += 1
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(500, f"Clone failed during enrollment: {str(e)}")

    await db.refresh(new_course)
    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="course_cloned",
        entity_type="course",
        entity_id=new_course.id,
        details={
            "original_code": original.code,
            "new_code": new_code,
            "students_enrolled": enrolled_count,
        },
        ip_address=request.client.host if request.client else None,
        db=db
    )
    response = await build_course_response(new_course, db)
    return {**response.model_dump(), "students_enrolled": enrolled_count}


# ---------------------------------------------------------------------------
# COURSE STUDENTS (FIX-P1-5)
# ---------------------------------------------------------------------------

@router.get("/{course_id}/students")
async def get_course_students(
    course_id: str,
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    course = await get_course_or_404(course_id, db)

    query = (
        select(Student)
        .join(StudentCourse, StudentCourse.student_id == Student.id)
        .join(User, User.id == Student.user_id)
        .where(
            StudentCourse.course_id == course.id,
            StudentCourse.is_active == True,
        )
    )
    if search:
        query = query.where(
            or_(
                Student.name.ilike(f"%{search}%"),
                Student.student_id.ilike(f"%{search}%"),
            )
        )

    total_res = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = total_res.scalar() or 0

    res = await db.execute(query.offset((page - 1) * limit).limit(limit))
    students = res.scalars().all()

    result = []
    for stu in students:
        present_res = await db.execute(
            select(func.count(AttendanceRecord.id))
            .join(Session, Session.id == AttendanceRecord.session_id)
            .where(
                AttendanceRecord.student_id == stu.id,
                Session.course_id == course.id,
                Session.is_locked == True,
                AttendanceRecord.status == "present",
            )
        )
        present = present_res.scalar() or 0

        total_sess_res = await db.execute(
            select(func.count(Session.id))
            .where(Session.course_id == course.id, Session.is_locked == True)
        )
        total_sess = total_sess_res.scalar() or 0

        pct = (present / total_sess * 100) if total_sess > 0 else 0.0

        if pct >= course.threshold_pct:
            stu_status = "good"
        elif pct >= course.threshold_pct - 5:
            stu_status = "at_risk"
        else:
            stu_status = "defaulter"

        if status_filter and stu_status != status_filter:
            continue

        result.append({
            "student_id": str(stu.id),
            "name": stu.name,
            "student_number": stu.student_id,
            "sessions_present": present,
            "sessions_total": total_sess,
            "attendance_pct": round(pct, 2),
            "status": stu_status,
        })

    return {"students": result, "total": total, "page": page}


# ---------------------------------------------------------------------------
# ATTENDANCE HISTORY (FIX-P1-5)
# ---------------------------------------------------------------------------

@router.get("/{course_id}/attendance-history")
async def get_course_history(
    course_id: str,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    course = await get_course_or_404(course_id, db)

    query = select(Session).where(Session.course_id == course.id)
    if date_from:
        query = query.where(Session.session_date >= date_from)
    if date_to:
        query = query.where(Session.session_date <= date_to)
    query = query.order_by(Session.session_date.desc())

    total_res = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = total_res.scalar() or 0

    res = await db.execute(query.offset((page - 1) * limit).limit(limit))
    sessions = res.scalars().all()

    total_enrolled_res = await db.execute(
        select(func.count(StudentCourse.id))
        .where(StudentCourse.course_id == course.id, StudentCourse.is_active == True)
    )
    enrolled = total_enrolled_res.scalar() or 0

    result = []
    for session in sessions:
        present_res = await db.execute(
            select(func.count(AttendanceRecord.id))
            .where(
                AttendanceRecord.session_id == session.id,
                AttendanceRecord.status == "present",
            )
        )
        present = present_res.scalar() or 0

        absent_res = await db.execute(
            select(func.count(AttendanceRecord.id))
            .where(
                AttendanceRecord.session_id == session.id,
                AttendanceRecord.status == "absent",
            )
        )
        absent = absent_res.scalar() or 0

        pct = (present / enrolled * 100) if enrolled > 0 else 0.0

        result.append({
            "session_id": str(session.id),
            "label": session.label,
            "session_date": session.session_date,
            "started_at": session.started_at,
            "ended_at": session.ended_at,
            "is_locked": session.is_locked,
            "present_count": present,
            "absent_count": absent,
            "total_enrolled": enrolled,
            "attendance_pct": round(pct, 2),
        })

    return {"sessions": result, "total": total, "page": page}
