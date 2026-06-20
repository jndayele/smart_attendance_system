"""
Admin Lecturer Management Router.

Full CRUD, suspend/reactivate, password reset, activation resend,
courses and sessions sub-resources.
"""
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, delete
from sqlalchemy.orm import selectinload
import uuid

from app.database import get_db
from app.dependencies import require_admin
from app.models.lecturer import Lecturer
from app.models.user import User, RoleEnum
from app.models.department import Department
from app.models.course import Course
from app.models.session import Session
from app.schemas.lecturer import (
    LecturerCreate, LecturerUpdate, LecturerResponse,
    LecturerListResponse, LecturerDetailResponse
)
from app.services.notification_service import NotificationService
from app.services.email_service import (
    send_lecturer_activation_email,
    send_password_reset_email,
)
from app.utils.security import (
    hash_password, create_activation_token, create_reset_token,
)
from app.config import get_settings

settings = get_settings()

router = APIRouter(dependencies=[Depends(require_admin)])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def get_lecturer_or_404(lecturer_id: str, db: AsyncSession) -> Lecturer:
    try:
        lec_uuid = UUID(lecturer_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid lecturer ID")
    res = await db.execute(
        select(Lecturer)
        .options(selectinload(Lecturer.user))
        .where(Lecturer.id == lec_uuid)
    )
    lec = res.scalars().first()
    if not lec:
        raise HTTPException(status_code=404, detail="Lecturer not found")
    return lec


async def get_dept_name(dept_id: UUID, db: AsyncSession) -> str:
    res = await db.execute(select(Department.name).where(Department.id == dept_id))
    name = res.scalar()
    return name or "Unknown"


async def build_lecturer_response(lec: Lecturer, db: AsyncSession) -> LecturerResponse:
    user = lec.user if lec.user else await db.get(User, lec.user_id)
    dept_name = await get_dept_name(lec.department_id, db)

    crs_cnt_res = await db.execute(
        select(func.count(Course.id)).where(Course.lecturer_id == lec.id)
    )
    sess_cnt_res = await db.execute(
        select(func.count(Session.id)).where(Session.lecturer_id == lec.id)
    )

    return LecturerResponse(
        id=lec.id,
        user_id=lec.user_id,
        name=lec.name,
        email=user.email,
        staff_id=lec.staff_id,
        department_id=lec.department_id,
        department_name=dept_name,
        phone=lec.phone,
        is_suspended=lec.is_suspended,
        is_active=user.is_active,
        is_verified=user.is_verified,
        course_count=crs_cnt_res.scalar() or 0,
        session_count=sess_cnt_res.scalar() or 0,
        last_login=user.last_login,
        created_at=lec.created_at,
        updated_at=lec.updated_at,
    )


# ---------------------------------------------------------------------------
# LIST
# ---------------------------------------------------------------------------

@router.get("/", response_model=LecturerListResponse)
async def list_lecturers(
    search: str = None,
    department_id: str = None,
    is_active: bool = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Lecturer, Department.name.label("dept_name"), User)
        .join(Department)
        .join(User, Lecturer.user_id == User.id)
    )
    
    if search:
        query = query.filter(
            Lecturer.name.ilike(f"%{search}%")
            | Lecturer.staff_id.ilike(f"%{search}%")
            | User.email.ilike(f"%{search}%")
        )
    if department_id:
        query = query.filter(Lecturer.department_id == department_id)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    total_res = await db.execute(
        select(func.count(Lecturer.id))
        .join(User, Lecturer.user_id == User.id)
    )
    total = total_res.scalar() or 0

    res = await db.execute(query.offset((page - 1) * limit).limit(limit))
    rows = res.all()
    
    responses = []
    for lec, dept_name, user in rows:
        crs_cnt = await db.execute(select(func.count(Course.id)).filter(Course.lecturer_id == lec.id))
        sess_cnt = await db.execute(select(func.count(Session.id)).filter(Session.lecturer_id == lec.id))
        
        responses.append(LecturerResponse(
            id=lec.id,
            user_id=lec.user_id,
            name=lec.name,
            email=user.email,
            staff_id=lec.staff_id,
            department_id=lec.department_id,
            department_name=dept_name,
            phone=lec.phone,
            is_suspended=lec.is_suspended,
            is_active=user.is_active,
            is_verified=user.is_verified,
            course_count=crs_cnt.scalar() or 0,
            session_count=sess_cnt.scalar() or 0,
            last_login=user.last_login,
            created_at=lec.created_at,
            updated_at=lec.updated_at,
        ))
        
    return LecturerListResponse(lecturers=responses, total=total)


# ---------------------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------------------

@router.post("/", response_model=LecturerResponse, status_code=status.HTTP_201_CREATED)
async def create_lecturer(
    data: LecturerCreate, 
    background_tasks: BackgroundTasks,
    request: Request,
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(require_admin)
):
    dept_res = await db.execute(select(Department).filter(Department.id == data.department_id))
    dept = dept_res.scalars().first()
    if not dept:
        raise HTTPException(status_code=400, detail="Department not found")
        
    email_check = await db.execute(select(User).filter(func.lower(User.email) == data.email.lower()))
    if email_check.scalars().first():
        raise HTTPException(status_code=409, detail="Email exists")
        
    staff_check = await db.execute(select(Lecturer).filter(func.lower(Lecturer.staff_id) == data.staff_id.lower()))
    if staff_check.scalars().first():
        raise HTTPException(status_code=409, detail="Staff ID exists")
        
    new_user = User(
        email=data.email.lower(),
        password_hash="",
        role=RoleEnum.lecturer,
        is_active=True,
        is_verified=False
    )
    db.add(new_user)
    await db.flush()
    
    new_lec = Lecturer(
        id=uuid.uuid4(),
        user_id=new_user.id,
        name=data.name,
        staff_id=data.staff_id,
        department_id=data.department_id,
        phone=data.phone
    )
    db.add(new_lec)
    await db.commit()
    await db.refresh(new_lec)
    
    # FIX-P0-7: Use settings.FRONTEND_URL for activation link
    token = create_activation_token(new_user.email, new_lec.name)
    new_lec.activation_token = token
    new_lec.activation_token_expiry = datetime.utcnow() + timedelta(hours=72)
    # FIX-P0-7: Use settings.LECTURER_FRONTEND_URL for activation link
    activation_link = f"{settings.LECTURER_FRONTEND_URL}/activate?token={token}"
    await db.commit()
    await send_lecturer_activation_email(new_user.email, new_lec.name, activation_link)
    
    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="lecturer_created",
        entity_type="lecturer",
        entity_id=new_lec.id,
        details={"name": new_lec.name, "email": new_user.email},
        ip_address=request.client.host if request.client else None,
        db=db
    )
    
    return LecturerResponse(
        id=new_lec.id,
        user_id=new_lec.user_id,
        name=new_lec.name,
        email=new_user.email,
        staff_id=new_lec.staff_id,
        department_id=new_lec.department_id,
        department_name=dept.name,
        phone=new_lec.phone,
        is_suspended=new_lec.is_suspended,
        is_active=new_user.is_active,
        is_verified=False,
        course_count=0,
        session_count=0,
        last_login=None,
        created_at=new_lec.created_at,
        updated_at=new_lec.updated_at,
    )


# ---------------------------------------------------------------------------
# GET ONE
# ---------------------------------------------------------------------------

@router.get("/{lecturer_id}", response_model=LecturerDetailResponse)
async def get_lecturer(
    lecturer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    lec = await get_lecturer_or_404(lecturer_id, db)

    courses_res = await db.execute(
        select(Course).where(Course.lecturer_id == lec.id, Course.is_active == True)
    )
    courses = courses_res.scalars().all()

    sessions_res = await db.execute(
        select(Session)
        .where(Session.lecturer_id == lec.id)
        .order_by(Session.started_at.desc())
        .limit(5)
    )
    recent_sessions = sessions_res.scalars().all()

    session_count_res = await db.execute(
        select(func.count(Session.id)).where(Session.lecturer_id == lec.id)
    )
    session_count = session_count_res.scalar() or 0

    from app.models.student import StudentCourse
    
    total_students = 0
    course_ids = [c.id for c in courses]
    if course_ids:
        res_stu = await db.execute(
            select(func.count(func.distinct(StudentCourse.student_id)))
            .where(StudentCourse.course_id.in_(course_ids), StudentCourse.is_active == True)
        )
        total_students = res_stu.scalar() or 0

    dept_name = await get_dept_name(lec.department_id, db)

    from app.schemas.course import CourseResponse
    from app.models.programme import Programme
    from app.models.student import StudentCourse

    # Build course responses
    course_responses = []
    for c in courses:
        prog = await db.get(Programme, c.programme_id) if c.programme_id else None
        stu_cnt = await db.execute(
            select(func.count(StudentCourse.id))
            .where(StudentCourse.course_id == c.id, StudentCourse.is_active == True)
        )
        sess_cnt = await db.execute(
            select(func.count(Session.id)).where(Session.course_id == c.id)
        )
        course_responses.append(CourseResponse(
            id=c.id,
            title=c.title,
            code=c.code,
            programme_id=c.programme_id,
            programme_name=prog.name if prog else "Unknown",
            programme_code=prog.code if prog else "Unknown",
            semester_id=c.semester_id,
            level=c.level,
            semester_number=c.semester_number,
            credit_hours=c.credit_hours,
            threshold_pct=c.threshold_pct,
            is_active=c.is_active,
            lecturer_id=c.lecturer_id,
            lecturer_name=lec.name,
            enrolled_student_count=stu_cnt.scalar() or 0,
            session_count=sess_cnt.scalar() or 0,
            created_at=c.created_at,
            updated_at=c.updated_at,
        ))

    # Build session summaries
    from app.schemas.lecturer import SessionSummary as LecturerSessionSummary
    from app.models.attendance import AttendanceRecord

    session_summaries = []
    for s in recent_sessions:
        pres = await db.execute(
            select(func.count(AttendanceRecord.id))
            .where(AttendanceRecord.session_id == s.id, AttendanceRecord.status == "present")
        )
        absnt = await db.execute(
            select(func.count(AttendanceRecord.id))
            .where(AttendanceRecord.session_id == s.id, AttendanceRecord.status == "absent")
        )
        course_for_sess = await db.get(Course, s.course_id)
        session_summaries.append(LecturerSessionSummary(
            id=s.id,
            course_id=s.course_id,
            course_code=course_for_sess.code if course_for_sess else "Unknown",
            session_date=s.started_at,
            label=s.label,
            students_present=pres.scalar() or 0,
            students_absent=absnt.scalar() or 0,
        ))

    user = lec.user
    return LecturerDetailResponse(
        id=lec.id,
        user_id=lec.user_id,
        name=lec.name,
        email=user.email,
        staff_id=lec.staff_id,
        department_id=lec.department_id,
        department_name=dept_name,
        phone=lec.phone,
        is_suspended=lec.is_suspended,
        is_active=user.is_active,
        is_verified=user.is_verified,
        course_count=len(courses),
        session_count=session_count,
        total_students=total_students,
        last_login=user.last_login,
        last_login_device=user.last_login_device,
        created_at=lec.created_at,
        updated_at=lec.updated_at,
        courses=course_responses,
        recent_sessions=session_summaries,
    )


# ---------------------------------------------------------------------------
# UPDATE
# ---------------------------------------------------------------------------

@router.patch("/{lecturer_id}", response_model=LecturerResponse)
async def update_lecturer(
    lecturer_id: str,
    data: LecturerUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    lec = await get_lecturer_or_404(lecturer_id, db)
    if data.name is not None:
        lec.name = data.name
    if data.phone is not None:
        lec.phone = data.phone
    if data.department_id is not None:
        dept = await db.get(Department, data.department_id)
        if not dept or not dept.is_active:
            raise HTTPException(400, "Department not found or inactive")
        lec.department_id = data.department_id
    lec.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(lec)
    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="lecturer_updated",
        entity_type="lecturer",
        entity_id=lec.id,
        details=data.model_dump(exclude_unset=True),
        ip_address=request.client.host if request.client else None,
        db=db
    )
    return await build_lecturer_response(lec, db)


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------

@router.delete("/{lecturer_id}")
async def delete_lecturer(
    lecturer_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    lec = await get_lecturer_or_404(lecturer_id, db)
    active_courses_res = await db.execute(
        select(func.count(Course.id)).where(
            Course.lecturer_id == lec.id,
            Course.is_active == True
        )
    )
    active_count = active_courses_res.scalar() or 0
    if active_count > 0:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete lecturer with active courses. Reassign courses first."
        )
    user = await db.get(User, lec.user_id)
    lec_name = lec.name
    lec_uuid = lec.id
    
    if user:
        from app.models.notification import Notification
        await db.execute(delete(Notification).where(Notification.user_id == user.id))
        
    await db.delete(lec)
    if user:
        await db.delete(user)
    await db.commit()
    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="lecturer_deleted",
        entity_type="lecturer",
        entity_id=lec_uuid,
        details={"name": lec_name},
        ip_address=request.client.host if request.client else None,
        db=db
    )
    return {"message": "Lecturer account deleted successfully"}


# ---------------------------------------------------------------------------
# SUSPEND
# ---------------------------------------------------------------------------

@router.post("/{lecturer_id}/suspend", response_model=LecturerResponse)
async def suspend_lecturer(
    lecturer_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    lec = await get_lecturer_or_404(lecturer_id, db)
    lec.is_suspended = True
    user = await db.get(User, lec.user_id)
    if user:
        user.is_active = False
    await db.commit()
    await db.refresh(lec)
    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="lecturer_suspended",
        entity_type="lecturer",
        entity_id=lec.id,
        details={"name": lec.name},
        ip_address=request.client.host if request.client else None,
        db=db
    )
    return await build_lecturer_response(lec, db)


# ---------------------------------------------------------------------------
# REACTIVATE
# ---------------------------------------------------------------------------

@router.post("/{lecturer_id}/reactivate", response_model=LecturerResponse)
async def reactivate_lecturer(
    lecturer_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    lec = await get_lecturer_or_404(lecturer_id, db)
    lec.is_suspended = False
    user = await db.get(User, lec.user_id)
    if user:
        user.is_active = True
    await db.commit()
    await db.refresh(lec)
    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="lecturer_reactivated",
        entity_type="lecturer",
        entity_id=lec.id,
        details={"name": lec.name},
        ip_address=request.client.host if request.client else None,
        db=db
    )
    return await build_lecturer_response(lec, db)


# ---------------------------------------------------------------------------
# RESET PASSWORD
# ---------------------------------------------------------------------------

@router.post("/{lecturer_id}/reset-password")
async def reset_lecturer_password(
    lecturer_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    lec = await get_lecturer_or_404(lecturer_id, db)
    user = await db.get(User, lec.user_id)
    if not user:
        raise HTTPException(404, "User record not found")

    raw_token = create_reset_token(user.email)
    user.password_reset_token = hash_password(raw_token)
    user.password_reset_expiry = datetime.utcnow() + timedelta(minutes=30)
    await db.commit()

    reset_link = f"{settings.LECTURER_FRONTEND_URL}/reset-password?token={raw_token}"
    await send_password_reset_email(user.email, lec.name, reset_link)

    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="lecturer_password_reset_initiated",
        entity_type="lecturer",
        entity_id=lec.id,
        details={"email": user.email},
        ip_address=request.client.host if request.client else None,
        db=db
    )
    return {"message": f"Password reset email sent to {user.email}"}


# ---------------------------------------------------------------------------
# RESEND ACTIVATION
# ---------------------------------------------------------------------------

@router.post("/{lecturer_id}/resend-activation")
async def resend_activation(
    lecturer_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    lec = await get_lecturer_or_404(lecturer_id, db)
    user = await db.get(User, lec.user_id)
    if user and user.is_verified:
        raise HTTPException(
            status_code=400,
            detail="This lecturer has already activated their account."
        )

    raw_token = create_activation_token(user.email, lec.name)
    lec.activation_token = raw_token
    lec.activation_token_expiry = datetime.utcnow() + timedelta(hours=72)
    await db.commit()

    activation_link = f"{settings.LECTURER_FRONTEND_URL}/activate?token={raw_token}"
    await send_lecturer_activation_email(user.email, lec.name, activation_link)

    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="lecturer_activation_resent",
        entity_type="lecturer",
        entity_id=lec.id,
        details={"email": user.email},
        ip_address=request.client.host if request.client else None,
        db=db
    )
    return {"message": f"Activation email resent to {user.email}"}


# ---------------------------------------------------------------------------
# GET COURSES
# ---------------------------------------------------------------------------

@router.get("/{lecturer_id}/courses")
async def get_lecturer_courses(
    lecturer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    lec = await get_lecturer_or_404(lecturer_id, db)
    from app.schemas.course import CourseResponse
    from app.models.programme import Programme
    from app.models.student import StudentCourse

    res = await db.execute(select(Course).where(Course.lecturer_id == lec.id))
    courses = res.scalars().all()

    responses = []
    for c in courses:
        prog = await db.get(Programme, c.programme_id) if c.programme_id else None
        stu_cnt = await db.execute(
            select(func.count(StudentCourse.id))
            .where(StudentCourse.course_id == c.id, StudentCourse.is_active == True)
        )
        sess_cnt = await db.execute(
            select(func.count(Session.id)).where(Session.course_id == c.id)
        )
        responses.append(CourseResponse(
            id=c.id,
            title=c.title,
            code=c.code,
            programme_id=c.programme_id,
            programme_name=prog.name if prog else "Unknown",
            programme_code=prog.code if prog else "Unknown",
            semester_id=c.semester_id,
            level=c.level,
            semester_number=c.semester_number,
            credit_hours=c.credit_hours,
            threshold_pct=c.threshold_pct,
            is_active=c.is_active,
            lecturer_id=c.lecturer_id,
            lecturer_name=lec.name,
            enrolled_student_count=stu_cnt.scalar() or 0,
            session_count=sess_cnt.scalar() or 0,
            created_at=c.created_at,
            updated_at=c.updated_at,
        ))
    return responses


# ---------------------------------------------------------------------------
# GET SESSIONS
# ---------------------------------------------------------------------------

@router.get("/{lecturer_id}/sessions")
async def get_lecturer_sessions(
    lecturer_id: str,
    course_id: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    lec = await get_lecturer_or_404(lecturer_id, db)

    query = select(Session).where(Session.lecturer_id == lec.id)
    if course_id:
        query = query.where(Session.course_id == UUID(course_id))
    query = query.order_by(Session.started_at.desc())

    total_res = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = total_res.scalar() or 0

    res = await db.execute(query.offset((page - 1) * limit).limit(limit))
    sessions = res.scalars().all()

    from app.schemas.lecturer import SessionSummary as LecturerSessionSummary
    from app.models.attendance import AttendanceRecord

    summaries = []
    for s in sessions:
        pres = await db.execute(
            select(func.count(AttendanceRecord.id))
            .where(AttendanceRecord.session_id == s.id, AttendanceRecord.status == "present")
        )
        absnt = await db.execute(
            select(func.count(AttendanceRecord.id))
            .where(AttendanceRecord.session_id == s.id, AttendanceRecord.status == "absent")
        )
        course_for_sess = await db.get(Course, s.course_id)
        summaries.append(LecturerSessionSummary(
            id=s.id,
            course_id=s.course_id,
            course_code=course_for_sess.code if course_for_sess else "Unknown",
            session_date=s.started_at,
            label=s.label,
            students_present=pres.scalar() or 0,
            students_absent=absnt.scalar() or 0,
        ))

    return {"sessions": summaries, "total": total, "page": page}
