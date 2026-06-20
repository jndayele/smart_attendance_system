"""
Admin Student Management Router.

Full CRUD, suspend/reactivate, move-level, resend-invitation, 
password-reset, bulk-import, attendance-override.
"""
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, update, or_, delete
from sqlalchemy.orm import selectinload
import uuid

from app.database import get_db
from app.dependencies import require_admin
from app.models.student import Student, StudentCourse
from app.models.user import User, RoleEnum
from app.models.department import Department
from app.models.programme import Programme
from app.models.course import Course
from app.models.attendance import AttendanceRecord
from app.models.session import Session
from app.models.notification import Notification
from app.schemas.student import (
    StudentCreate, StudentUpdate, StudentResponse, StudentListResponse,
    StudentBulkImportResponse, StudentBulkImportRequest, StudentBulkImportRow,
    StudentMoveLevel, ManualAttendanceOverride, StudentDetailResponse,
    AttendanceRecordResponse, CourseAttendanceSummary,
)
from app.services.notification_service import NotificationService
from app.services.email_service import (
    send_student_invitation_email,
    send_password_reset_email,
)
from app.utils.security import create_invitation_token, create_reset_token, hash_password
from app.config import get_settings

settings = get_settings()
router = APIRouter(dependencies=[Depends(require_admin)])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def get_student_or_404(student_id: str, db: AsyncSession) -> Student:
    try:
        stu_uuid = UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid student ID")
    res = await db.execute(
        select(Student)
        .options(selectinload(Student.user))
        .where(Student.id == stu_uuid)
    )
    stu = res.scalars().first()
    if not stu:
        raise HTTPException(status_code=404, detail="Student not found")
    return stu


async def build_student_response(stu: Student, db: AsyncSession) -> StudentResponse:
    user = stu.user if stu.user else await db.get(User, stu.user_id)
    dept = await db.get(Department, stu.department_id)
    prog = await db.get(Programme, stu.programme_id)

    return StudentResponse(
        id=stu.id,
        user_id=stu.user_id,
        name=stu.name,
        student_id=stu.student_id,
        email=user.email,
        department_id=stu.department_id,
        department_name=dept.name if dept else "Unknown",
        programme_id=stu.programme_id,
        programme_name=prog.name if prog else "Unknown",
        level=stu.level,
        semester_of_entry=stu.semester_of_entry,
        face_registered=stu.face_registered,
        is_suspended=stu.is_suspended,
        is_active=user.is_active,
        is_verified=user.is_verified,
        invitation_status=stu.invitation_status if hasattr(stu, "invitation_status") and stu.invitation_status else "pending",
        last_login=user.last_login,
        created_at=stu.created_at,
        updated_at=stu.updated_at,
    )


async def compute_attendance_pct_for(student_id, course_id, db: AsyncSession) -> float:
    sess_res = await db.execute(
        select(Session.id).where(Session.course_id == course_id, Session.is_locked == True)
    )
    session_ids = [r[0] for r in sess_res.all()]
    if not session_ids:
        return 0.0
    pres_res = await db.execute(
        select(func.count(AttendanceRecord.id)).where(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.session_id.in_(session_ids),
            AttendanceRecord.status == "present",
        )
    )
    present = pres_res.scalar() or 0
    return (present / len(session_ids)) * 100.0


async def compute_global_attendance_pct(student_id: UUID, db: AsyncSession) -> Optional[float]:
    # Find all courses the student is enrolled in
    sc_res = await db.execute(select(StudentCourse.course_id).where(StudentCourse.student_id == student_id))
    course_ids = [r[0] for r in sc_res.all()]
    if not course_ids:
        return None
        
    # Find all locked sessions for these courses
    sess_res = await db.execute(
        select(Session.id).where(Session.course_id.in_(course_ids), Session.is_locked == True)
    )
    session_ids = [r[0] for r in sess_res.all()]
    if not session_ids:
        return None
        
    # Count present records for these sessions
    pres_res = await db.execute(
        select(func.count(AttendanceRecord.id)).where(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.session_id.in_(session_ids),
            AttendanceRecord.status == "present",
        )
    )
    present = pres_res.scalar() or 0
    return round((present / len(session_ids)) * 100.0, 1)


# ---------------------------------------------------------------------------
# LEVELS  (must be before /{student_id} to avoid route shadowing)
# ---------------------------------------------------------------------------

@router.get("/levels")
async def get_student_levels(db: AsyncSession = Depends(get_db)):
    """
    Returns the distinct student levels that currently exist in the DB,
    merged with the standard configured set so the list is never empty.
    """
    STANDARD_LEVELS = [100, 200, 300, 400, 500, 600]

    res = await db.execute(
        select(Student.level).distinct().order_by(Student.level)
    )
    db_levels = [r[0] for r in res.all()]

    # Merge: include standard levels + any custom ones from DB
    merged = sorted(set(STANDARD_LEVELS) | set(db_levels))

    return {"levels": merged}


# ---------------------------------------------------------------------------
# LIST
# ---------------------------------------------------------------------------

@router.get("/", response_model=StudentListResponse)
async def list_students(
    search: str = None,
    department_id: str = None,
    programme_id: str = None,
    level: int = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Student, Department.name.label("dept_name"), Programme.name.label("prog_name"), User)
        .select_from(Student)
        .join(Department, Student.department_id == Department.id)
        .join(Programme, Student.programme_id == Programme.id)
        .join(User, Student.user_id == User.id)
        .filter(Student.is_suspended == False)
    )
    
    if search:
        query = query.filter(
            Student.name.ilike(f"%{search}%")
            | Student.student_id.ilike(f"%{search}%")
            | User.email.ilike(f"%{search}%")
        )
    if department_id:
        query = query.filter(Student.department_id == department_id)
    if programme_id:
        query = query.filter(Student.programme_id == programme_id)
    if level:
        query = query.filter(Student.level == level)
        
    total_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(total_query)
    total = total_res.scalar() or 0

    res = await db.execute(query.offset((page - 1) * limit).limit(limit))
    rows = res.all()

    
    responses = []
    for stu, d_name, p_name, user in rows:
        att_avg = await compute_global_attendance_pct(stu.id, db)
        
        status_val = "pending"
        if user.is_active and user.is_verified and stu.invitation_token is None:
            status_val = "accepted"

        responses.append(StudentResponse(
            id=stu.id,
            user_id=stu.user_id,
            name=stu.name,
            student_id=stu.student_id,
            email=user.email,
            department_id=stu.department_id,
            department_name=d_name,
            programme_id=stu.programme_id,
            programme_name=p_name,
            level=stu.level,
            semester_of_entry=stu.semester_of_entry,
            face_registered=stu.face_registered,
            is_suspended=stu.is_suspended,
            is_active=user.is_active,
            is_verified=user.is_verified,
            invitation_status=status_val,
            attendance_avg=att_avg,
            last_login=user.last_login,
            created_at=stu.created_at,
            updated_at=stu.updated_at,
        ))
        
    return StudentListResponse(students=responses, total=total)


# ---------------------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------------------

@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    data: StudentCreate, 
    background_tasks: BackgroundTasks,
    request: Request,
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(require_admin)
):
    d_res = await db.execute(select(Department).filter(Department.id == data.department_id))
    dept = d_res.scalars().first()
    if not dept:
        raise HTTPException(status_code=400, detail="Department not found")
        
    p_res = await db.execute(select(Programme).filter(Programme.id == data.programme_id))
    prog = p_res.scalars().first()
    if not prog:
        raise HTTPException(status_code=400, detail="Programme not found")
        
    email_check = await db.execute(select(User).filter(func.lower(User.email) == data.email.lower()))
    if email_check.scalars().first():
        raise HTTPException(status_code=409, detail="Email exists")
        
    stu_check = await db.execute(select(Student).filter(func.lower(Student.student_id) == data.student_id.lower()))
    if stu_check.scalars().first():
        raise HTTPException(status_code=409, detail="Student ID exists")
        
    new_user = User(
        email=data.email.lower(),
        password_hash="",
        role=RoleEnum.student,
        is_active=False,
        is_verified=False,
        failed_attempts=0,
    )
    db.add(new_user)
    await db.flush()

    # FIX-P0-8: Use proper JWT invitation token
    raw_token = create_invitation_token(new_user.email)
    expiry = datetime.utcnow() + timedelta(hours=settings.INVITATION_TOKEN_EXPIRE_HOURS)
    
    new_stu = Student(
        id=uuid.uuid4(),
        user_id=new_user.id,
        name=data.name,
        student_id=data.student_id,
        department_id=data.department_id,
        programme_id=data.programme_id,
        level=data.level,
        semester_of_entry=data.semester_of_entry,
        invitation_token=raw_token,
        invitation_token_expiry=expiry,
        face_registered=False,
        is_suspended=False,
    )
    db.add(new_stu)
    await db.commit()
    await db.refresh(new_stu)

    # FIX-P1-3: Auto-enroll in all courses matching programme + level
    courses_res = await db.execute(
        select(Course).where(
            Course.programme_id == new_stu.programme_id,
            Course.level == new_stu.level,
            Course.is_active == True
        )
    )
    courses_to_enroll = courses_res.scalars().all()

    enrollment_count = 0
    course_titles = []
    try:
        for course in courses_to_enroll:
            existing = await db.execute(
                select(StudentCourse).where(
                    StudentCourse.student_id == new_stu.id,
                    StudentCourse.course_id == course.id
                )
            )
            if not existing.scalars().first():
                sc = StudentCourse(
                    student_id=new_stu.id,
                    course_id=course.id,
                    enrolled_at=datetime.utcnow(),
                    is_active=True
                )
                db.add(sc)
                enrollment_count += 1
                course_titles.append(course.title)
        await db.commit()
        
        for course in courses_to_enroll:
            await NotificationService.notify_new_student_enrolled(new_stu, course.id, db)
            
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Student created but enrollment failed: {str(e)}"
        )

    # FIX-P0-7: Use settings.STUDENT_FRONTEND_URL for invitation link
    invitation_link = f"{settings.STUDENT_FRONTEND_URL}/register-student?token={raw_token}"
    await send_student_invitation_email(
        new_user.email,
        new_stu.name,
        new_stu.student_id,
        course_titles,
        invitation_link,
    )
    
    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="student_created",
        entity_type="student",
        entity_id=new_stu.id,
        details={"name": new_stu.name, "courses_enrolled": enrollment_count},
        ip_address=request.client.host if request.client else None,
        db=db,
    )
    
    return StudentResponse(
        id=new_stu.id,
        user_id=new_stu.user_id,
        name=new_stu.name,
        student_id=new_stu.student_id,
        email=new_user.email,
        department_id=new_stu.department_id,
        department_name=dept.name,
        programme_id=new_stu.programme_id,
        programme_name=prog.name,
        level=new_stu.level,
        semester_of_entry=new_stu.semester_of_entry,
        face_registered=False,
        is_suspended=False,
        is_active=False,
        is_verified=False,
        invitation_status="pending",
        last_login=None,
        created_at=new_stu.created_at,
        updated_at=new_stu.updated_at,
    )


# ---------------------------------------------------------------------------
# GET ONE
# ---------------------------------------------------------------------------

@router.get("/{student_id}", response_model=StudentDetailResponse)
async def get_student(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    stu = await get_student_or_404(student_id, db)
    user = stu.user if stu.user else await db.get(User, stu.user_id)
    dept = await db.get(Department, stu.department_id)
    prog = await db.get(Programme, stu.programme_id)

    # Enrolled courses with attendance stats
    sc_res = await db.execute(
        select(StudentCourse).where(StudentCourse.student_id == stu.id, StudentCourse.is_active == True)
    )
    enrollments = sc_res.scalars().all()

    enrolled_courses = []
    for sc in enrollments:
        course = await db.get(Course, sc.course_id)
        if not course:
            continue
        pct = await compute_attendance_pct_for(stu.id, course.id, db)

        # count sessions present and total
        sess_ids_res = await db.execute(
            select(Session.id).where(Session.course_id == course.id, Session.is_locked == True)
        )
        sess_ids = [r[0] for r in sess_ids_res.all()]
        sessions_total = len(sess_ids)
        pres_res = await db.execute(
            select(func.count(AttendanceRecord.id)).where(
                AttendanceRecord.student_id == stu.id,
                AttendanceRecord.session_id.in_(sess_ids),
                AttendanceRecord.status == "present"
            )
        ) if sess_ids else None
        sessions_present = (pres_res.scalar() or 0) if pres_res else 0

        if pct >= course.threshold_pct:
            att_status = "good"
        elif pct >= course.threshold_pct - 5:
            att_status = "at_risk"
        else:
            att_status = "defaulter"

        enrolled_courses.append(CourseAttendanceSummary(
            course_id=course.id,
            course_title=course.title,
            course_code=course.code,
            sessions_present=sessions_present,
            sessions_total=sessions_total,
            attendance_pct=round(pct, 2),
            threshold_pct=course.threshold_pct,
            status=att_status,
        ))

    # Last 10 attendance records
    att_res = await db.execute(
        select(AttendanceRecord, Session)
        .join(Session, AttendanceRecord.session_id == Session.id)
        .where(AttendanceRecord.student_id == stu.id)
        .order_by(Session.session_date.desc(), Session.started_at.desc())
        .limit(10)
    )
    recent_att = []
    for ar, s in att_res.all():
        course_for_sess = await db.get(Course, s.course_id)
        recent_att.append(AttendanceRecordResponse(
            id=ar.id,
            session_id=s.id,
            course_id=s.course_id,
            course_code=course_for_sess.code if course_for_sess else "Unknown",
            session_date=s.started_at,
            status=ar.status.value if hasattr(ar.status, 'value') else str(ar.status),
            method=ar.method.value if ar.method else None,
            is_manual_override=ar.is_manual_override,
            created_at=ar.created_at,
        ))

    status_val = "pending"
    if user.is_active and user.is_verified and stu.invitation_token is None:
        status_val = "accepted"

    return StudentDetailResponse(
        id=stu.id,
        user_id=stu.user_id,
        name=stu.name,
        student_id=stu.student_id,
        email=user.email,
        department_id=stu.department_id,
        department_name=dept.name if dept else "Unknown",
        programme_id=stu.programme_id,
        programme_name=prog.name if prog else "Unknown",
        level=stu.level,
        semester_of_entry=stu.semester_of_entry,
        face_registered=stu.face_registered,
        is_suspended=stu.is_suspended,
        is_active=user.is_active,
        is_verified=user.is_verified,
        invitation_status=status_val,
        last_login=user.last_login,
        created_at=stu.created_at,
        updated_at=stu.updated_at,
        enrolled_courses=enrolled_courses,
        recent_attendance=recent_att,
    )


# ---------------------------------------------------------------------------
# UPDATE
# ---------------------------------------------------------------------------

@router.patch("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: str,
    data: StudentUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    stu = await get_student_or_404(student_id, db)
    user = stu.user if stu.user else await db.get(User, stu.user_id)

    if data.name is not None:
        stu.name = data.name
    if data.email is not None:
        user.email = data.email.lower()
    if data.department_id is not None:
        stu.department_id = data.department_id
    
    level_changed = data.level is not None and data.level != stu.level
    programme_changed = data.programme_id is not None and data.programme_id != stu.programme_id

    if data.programme_id is not None:
        stu.programme_id = data.programme_id
    if data.level is not None:
        stu.level = data.level

    # Re-enrollment logic when level or programme changes
    if level_changed or programme_changed:
        # Deactivate old enrollments
        await db.execute(
            update(StudentCourse)
            .where(StudentCourse.student_id == stu.id, StudentCourse.is_active == True)
            .values(is_active=False)
        )
        # Find courses for new level+programme
        new_courses_res = await db.execute(
            select(Course).where(
                Course.programme_id == stu.programme_id,
                Course.level == stu.level,
                Course.is_active == True,
            )
        )
        for course in new_courses_res.scalars().all():
            existing = await db.execute(
                select(StudentCourse).where(
                    StudentCourse.student_id == stu.id,
                    StudentCourse.course_id == course.id
                )
            )
            if not existing.scalars().first():
                db.add(StudentCourse(
                    student_id=stu.id,
                    course_id=course.id,
                    enrolled_at=datetime.utcnow(),
                    is_active=True,
                ))

    stu.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(stu)

    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="student_updated",
        entity_type="student",
        entity_id=stu.id,
        details=data.model_dump(exclude_unset=True),
        ip_address=request.client.host if request.client else None,
        db=db
    )
    return await build_student_response(stu, db)


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------

@router.delete("/{student_id}")
async def delete_student(
    student_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    stu = await get_student_or_404(student_id, db)
    user = stu.user if stu.user else await db.get(User, stu.user_id)

    att_count_res = await db.execute(
        select(func.count(AttendanceRecord.id)).where(AttendanceRecord.student_id == stu.id)
    )
    att_count = att_count_res.scalar() or 0

    if att_count > 0:
        # Soft delete — preserve attendance history
        stu.is_suspended = True
        if user:
            user.is_active = False
        await db.commit()
        delete_type = "soft"
    else:
        # Hard delete
        stu_id_for_log = stu.id
        stu_name_for_log = stu.name
        
        if user:
            await db.execute(delete(Notification).where(Notification.user_id == user.id))
            
        await db.delete(stu)
        if user:
            await db.delete(user)
        await db.commit()
        delete_type = "hard"
        await NotificationService.log_audit_action(
            performed_by=current_user.id,
            action="student_deleted",
            entity_type="student",
            entity_id=stu_id_for_log,
            details={"name": stu_name_for_log, "type": delete_type},
            ip_address=request.client.host if request.client else None,
            db=db
        )
        return {"message": f"Student account {delete_type} deleted", "type": delete_type}

    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="student_deleted",
        entity_type="student",
        entity_id=stu.id,
        details={"name": stu.name, "type": delete_type},
        ip_address=request.client.host if request.client else None,
        db=db
    )
    return {"message": f"Student account {delete_type} deleted", "type": delete_type}


# ---------------------------------------------------------------------------
# SUSPEND
# ---------------------------------------------------------------------------

@router.post("/{student_id}/suspend", response_model=StudentResponse)
async def suspend_student(
    student_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    stu = await get_student_or_404(student_id, db)
    user = stu.user if stu.user else await db.get(User, stu.user_id)
    stu.is_suspended = True
    if user:
        user.is_active = False
    await db.commit()
    await db.refresh(stu)
    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="student_suspended",
        entity_type="student",
        entity_id=stu.id,
        details={"name": stu.name},
        ip_address=request.client.host if request.client else None,
        db=db
    )
    return await build_student_response(stu, db)


# ---------------------------------------------------------------------------
# REACTIVATE
# ---------------------------------------------------------------------------

@router.post("/{student_id}/reactivate", response_model=StudentResponse)
async def reactivate_student(
    student_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    stu = await get_student_or_404(student_id, db)
    user = stu.user if stu.user else await db.get(User, stu.user_id)
    stu.is_suspended = False
    if user:
        user.is_active = True
    await db.commit()
    await db.refresh(stu)
    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="student_reactivated",
        entity_type="student",
        entity_id=stu.id,
        details={"name": stu.name},
        ip_address=request.client.host if request.client else None,
        db=db
    )
    return await build_student_response(stu, db)


# ---------------------------------------------------------------------------
# MOVE LEVEL
# ---------------------------------------------------------------------------

@router.post("/{student_id}/move-level")
async def move_level(
    student_id: str,
    body: StudentMoveLevel,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    stu = await get_student_or_404(student_id, db)
    old_level = stu.level

    stu.level = body.new_level

    # Deactivate current enrollments
    await db.execute(
        update(StudentCourse)
        .where(StudentCourse.student_id == stu.id, StudentCourse.is_active == True)
        .values(is_active=False)
    )

    # Enroll in new level courses
    new_courses_res = await db.execute(
        select(Course).where(
            Course.programme_id == stu.programme_id,
            Course.level == body.new_level,
            Course.is_active == True,
        )
    )
    new_courses = new_courses_res.scalars().all()
    enrolled_count = 0
    for course in new_courses:
        existing = await db.execute(
            select(StudentCourse).where(
                StudentCourse.student_id == stu.id,
                StudentCourse.course_id == course.id,
            )
        )
        if not existing.scalars().first():
            db.add(StudentCourse(
                student_id=stu.id,
                course_id=course.id,
                enrolled_at=datetime.utcnow(),
                is_active=True,
            ))
            enrolled_count += 1

    stu.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(stu)

    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="student_level_moved",
        entity_type="student",
        entity_id=stu.id,
        details={"from_level": old_level, "to_level": body.new_level, "new_courses_enrolled": enrolled_count},
        ip_address=request.client.host if request.client else None,
        db=db
    )

    response = await build_student_response(stu, db)
    return {**response.model_dump(), "new_courses_enrolled": enrolled_count}


# ---------------------------------------------------------------------------
# RESEND INVITATION
# ---------------------------------------------------------------------------

@router.post("/{student_id}/resend-invitation")
async def resend_invitation(
    student_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    stu = await get_student_or_404(student_id, db)
    user = stu.user if stu.user else await db.get(User, stu.user_id)

    if user and user.is_verified:
        raise HTTPException(status_code=400, detail="Student has already registered.")

    raw_token = create_invitation_token(user.email)
    stu.invitation_token = raw_token
    stu.invitation_token_expiry = datetime.utcnow() + timedelta(hours=settings.INVITATION_TOKEN_EXPIRE_HOURS)
    await db.commit()

    # Fetch enrolled course titles for email
    sc_res = await db.execute(
        select(StudentCourse).where(StudentCourse.student_id == stu.id, StudentCourse.is_active == True)
    )
    course_titles = []
    for sc in sc_res.scalars().all():
        c = await db.get(Course, sc.course_id)
        if c:
            course_titles.append(c.title)

    invitation_link = f"{settings.STUDENT_FRONTEND_URL}/register-student?token={raw_token}"
    await send_student_invitation_email(user.email, stu.name, stu.student_id, course_titles, invitation_link)

    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="student_invitation_resent",
        entity_type="student",
        entity_id=stu.id,
        details={"email": user.email},
        ip_address=request.client.host if request.client else None,
        db=db
    )
    return {"message": f"Invitation email resent to {user.email}"}


# ---------------------------------------------------------------------------
# RESET PASSWORD
# ---------------------------------------------------------------------------

@router.post("/{student_id}/reset-password")
async def reset_student_password(
    student_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    stu = await get_student_or_404(student_id, db)
    user = stu.user if stu.user else await db.get(User, stu.user_id)
    if not user:
        raise HTTPException(404, "User record not found")

    raw_token = create_reset_token(user.email)
    user.password_reset_token = hash_password(raw_token)
    user.password_reset_expiry = datetime.utcnow() + timedelta(minutes=30)
    await db.commit()

    reset_link = f"{settings.STUDENT_FRONTEND_URL}/reset-password?token={raw_token}"
    await send_password_reset_email(user.email, stu.name, reset_link)

    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="student_password_reset_initiated",
        entity_type="student",
        entity_id=stu.id,
        details={"email": user.email},
        ip_address=request.client.host if request.client else None,
        db=db
    )
    return {"message": f"Password reset email sent to {user.email}"}


# ---------------------------------------------------------------------------
# ATTENDANCE OVERRIDE
# ---------------------------------------------------------------------------

@router.post("/attendance/override")
async def override_attendance(
    data: ManualAttendanceOverride,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    # Validate session
    session = await db.get(Session, data.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Validate student enrolled in the course for this session
    sc_res = await db.execute(
        select(StudentCourse).where(
            StudentCourse.student_id == data.student_id,
            StudentCourse.course_id == session.course_id,
            StudentCourse.is_active == True,
        )
    )
    if not sc_res.scalars().first():
        raise HTTPException(status_code=400, detail="Student is not enrolled in the course for this session")

    if len(data.reason) < 10:
        raise HTTPException(status_code=422, detail="Reason must be at least 10 characters")

    from app.models.attendance import AttendanceStatusEnum, AttendanceMethodEnum

    # Upsert attendance record
    existing_res = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.session_id == data.session_id,
            AttendanceRecord.student_id == data.student_id,
        )
    )
    record = existing_res.scalars().first()
    now = datetime.utcnow()

    if record:
        record.status = AttendanceStatusEnum(data.status)
        record.is_manual_override = True
        record.override_reason = data.reason
        record.override_by = current_user.id
        record.override_at = now
    else:
        record = AttendanceRecord(
            session_id=data.session_id,
            student_id=data.student_id,
            checked_in_at=now,
            method=AttendanceMethodEnum.manual,
            status=AttendanceStatusEnum(data.status),
            is_manual_override=True,
            override_reason=data.reason,
            override_by=current_user.id,
            override_at=now,
        )
        db.add(record)

    await db.commit()
    await db.refresh(record)

    # Threshold alerts
    await NotificationService.check_and_send_threshold_alerts(data.student_id, session.course_id, db)

    # Notify student
    stu = await db.get(Student, data.student_id)
    if stu:
        await NotificationService.create_notification(
            user_id=stu.user_id,
            type="attendance_override",
            title="Attendance Record Updated",
            message=f"Your attendance for this session has been updated to {data.status} by an administrator.",
            db=db
        )

    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="attendance_override",
        entity_type="attendance",
        entity_id=record.id,
        details={
            "session_id": str(data.session_id),
            "student_id": str(data.student_id),
            "status": data.status,
            "reason": data.reason,
        },
        ip_address=request.client.host if request.client else None,
        db=db
    )
    return {"message": "Attendance record updated", "record_id": str(record.id), "status": data.status}


# ---------------------------------------------------------------------------
# GET STUDENT ATTENDANCE HISTORY
# ---------------------------------------------------------------------------

@router.get("/{student_id}/attendance", response_model=dict)
async def get_student_attendance(
    student_id: str,
    course_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    stu = await get_student_or_404(student_id, db)

    query = (
        select(AttendanceRecord, Session, Course)
        .join(Session, AttendanceRecord.session_id == Session.id)
        .join(Course, Session.course_id == Course.id)
        .where(AttendanceRecord.student_id == stu.id)
    )

    if course_id:
        query = query.where(Session.course_id == course_id)
    if date_from:
        try:
            from datetime import date
            dt_from = datetime.fromisoformat(date_from).date()
            query = query.where(Session.session_date >= dt_from)
        except ValueError:
            pass
    if date_to:
        try:
            dt_to = datetime.fromisoformat(date_to).date()
            query = query.where(Session.session_date <= dt_to)
        except ValueError:
            pass

    query = query.order_by(Session.session_date.desc(), Session.started_at.desc())

    total_res = await db.execute(select(func.count(AttendanceRecord.id)).select_from(query.subquery()))
    total = total_res.scalar() or 0

    res = await db.execute(query.offset((page - 1) * limit).limit(limit))
    rows = res.all()

    records = []
    present_count = 0
    absent_count = 0
    for ar, s, c in rows:
        status_val = ar.status.value if hasattr(ar.status, 'value') else str(ar.status)
        if status_val == "present":
            present_count += 1
        else:
            absent_count += 1
        records.append({
            "id": str(ar.id),
            "session_id": str(s.id),
            "course_code": c.code,
            "course_title": c.title,
            "session_date": s.session_date,
            "status": status_val,
            "method": ar.method.value if ar.method else None,
            "is_manual_override": ar.is_manual_override,
            "checked_in_at": ar.checked_in_at,
        })

    return {
        "records": records,
        "total": total,
        "present_count": present_count,
        "absent_count": absent_count,
        "attendance_pct": round((present_count / total * 100) if total > 0 else 0.0, 2),
        "page": page,
        "limit": limit,
    }


# ---------------------------------------------------------------------------
# BULK IMPORT  (FIX-P1-4)
# ---------------------------------------------------------------------------

@router.post("/bulk-import", response_model=StudentBulkImportResponse, status_code=201)
async def bulk_import_students(
    data: StudentBulkImportRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    # Capture ID immediately — current_user expires after commits inside the loop
    admin_id = current_user.id
    total_submitted = len(data.students)

    total_created = 0
    total_failed = 0
    errors = []
    created_ids = []

    for idx, row in enumerate(data.students):
        try:
            # Look up department by code
            dept_res = await db.execute(
                select(Department).where(
                    func.upper(Department.code) == row.department_code.upper(),
                    Department.is_active == True
                )
            )
            dept = dept_res.scalars().first()
            if not dept:
                raise ValueError(f"Department with code '{row.department_code}' not found")

            # Look up programme by code
            prog_res = await db.execute(
                select(Programme).where(
                    func.upper(Programme.code) == row.programme_code.upper(),
                    Programme.is_active == True
                )
            )
            prog = prog_res.scalars().first()
            if not prog:
                raise ValueError(f"Programme with code '{row.programme_code}' not found")

            # Validate level
            valid_levels = [(y + 1) * 100 for y in range(prog.duration_years)]
            if row.level not in valid_levels:
                raise ValueError(f"Level {row.level} invalid for {prog.duration_years}-year programme")

            # Check duplicate email
            email_check = await db.execute(select(User).where(User.email == row.email.lower()))
            if email_check.scalars().first():
                raise ValueError(f"Email '{row.email}' already exists")

            # Check duplicate student_id
            sid_check = await db.execute(select(Student).where(Student.student_id == row.student_id))
            if sid_check.scalars().first():
                raise ValueError(f"Student ID '{row.student_id}' already exists")

            # Create user
            new_user = User(
                email=row.email.lower(),
                role=RoleEnum.student,
                is_active=False,
                is_verified=False,
                failed_attempts=0,
            )
            db.add(new_user)
            await db.flush()

            # Create student
            raw_token = create_invitation_token(new_user.email)
            expiry = datetime.utcnow() + timedelta(hours=settings.INVITATION_TOKEN_EXPIRE_HOURS)
            new_stu = Student(
                user_id=new_user.id,
                student_id=row.student_id,
                name=row.name,
                programme_id=prog.id,
                department_id=dept.id,
                level=row.level,
                semester_of_entry=row.semester_of_entry,
                invitation_token=raw_token,
                invitation_token_expiry=expiry,
                face_registered=False,
                is_suspended=False,
            )
            db.add(new_stu)
            await db.flush()

            # Auto-enroll in courses
            courses_res = await db.execute(
                select(Course).where(
                    Course.programme_id == prog.id,
                    Course.level == row.level,
                    Course.is_active == True
                )
            )
            enrolled_courses = courses_res.scalars().all()
            course_titles = []
            for course in enrolled_courses:
                sc = StudentCourse(
                    student_id=new_stu.id,
                    course_id=course.id,
                    enrolled_at=datetime.utcnow(),
                    is_active=True,
                )
                db.add(sc)
                course_titles.append(course.title)

            await db.commit()
            await db.refresh(new_stu)
            
            for course in enrolled_courses:
                await NotificationService.notify_new_student_enrolled(new_stu, course.id, db)

            invitation_link = f"{settings.STUDENT_FRONTEND_URL}/register-student?token={raw_token}"
            await send_student_invitation_email(
                new_user.email,
                new_stu.name,
                new_stu.student_id,
                course_titles,
                invitation_link,
            )

            created_ids.append(new_stu.id)
            total_created += 1

        except Exception as e:
            await db.rollback()
            total_failed += 1
            errors.append({
                "row": idx + 1,
                "student_id": getattr(row, "student_id", "unknown"),
                "error": str(e)
            })

    await NotificationService.log_audit_action(
        performed_by=admin_id,
        action="bulk_student_import",
        entity_type="student",
        entity_id=None,
        details={
            "total_submitted": total_submitted,
            "total_created": total_created,
            "total_failed": total_failed,
        },
        ip_address=request.client.host if request.client else None,
        db=db
    )

    return StudentBulkImportResponse(
        total_submitted=total_submitted,
        total_created=total_created,
        total_failed=total_failed,
        errors=errors,
        created_student_ids=created_ids,
    )


# ---------------------------------------------------------------------------
# BULK MOVE LEVEL
# ---------------------------------------------------------------------------

@router.post("/bulk-move-level")
async def bulk_move_level(
    payload: dict,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    student_ids = payload.get("student_ids", [])
    new_level = payload.get("new_level")
    if not student_ids or not new_level:
        raise HTTPException(400, "student_ids and new_level are required")

    updated = 0
    for sid in student_ids:
        try:
            stu_res = await db.execute(select(Student).where(Student.id == UUID(sid)))
            stu = stu_res.scalars().first()
            if not stu:
                continue
            stu.level = new_level
            await db.execute(
                update(StudentCourse)
                .where(StudentCourse.student_id == stu.id, StudentCourse.is_active == True)
                .values(is_active=False)
            )
            new_courses_res = await db.execute(
                select(Course).where(
                    Course.programme_id == stu.programme_id,
                    Course.level == new_level,
                    Course.is_active == True,
                )
            )
            for course in new_courses_res.scalars().all():
                existing = await db.execute(
                    select(StudentCourse).where(
                        StudentCourse.student_id == stu.id,
                        StudentCourse.course_id == course.id
                    )
                )
                if not existing.scalars().first():
                    db.add(StudentCourse(
                        student_id=stu.id,
                        course_id=course.id,
                        enrolled_at=datetime.utcnow(),
                        is_active=True,
                    ))
            updated += 1
        except Exception:
            continue

    await db.commit()
    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="bulk_level_move",
        entity_type="student",
        entity_id=None,
        details={"new_level": new_level, "students_updated": updated},
        ip_address=request.client.host if request.client else None,
        db=db
    )
    return {"message": "Levels updated", "students_updated": updated}
