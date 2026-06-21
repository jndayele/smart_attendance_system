"""
Student Courses Router.

Endpoints for students to view their enrolled courses and attendance details.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.user import User as UserModel

from app.database import get_db
from app.dependencies import require_student
from app.models.user import User
from app.models.student import Student, StudentCourse
from app.models.course import Course
from app.models.programme import Programme
from app.models.session import Session
from app.models.attendance import AttendanceRecord
from app.models.lecturer import Lecturer
from app.schemas.course import CourseResponse
from app.schemas.student_portal import StudentCourseCard, SessionSummaryForStudent
from app.schemas.student import CourseAttendanceSummary
from app.services.face_service import FaceService

router = APIRouter(dependencies=[Depends(require_student)])


async def get_student_id(user_id, db: AsyncSession):
    res = await db.execute(select(Student.id).filter(Student.user_id == user_id))
    sid = res.scalar()
    if not sid:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return sid


@router.get("/", summary="List My Courses")
async def list_courses(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    """List all courses the student is enrolled in."""
    student_id = await get_student_id(current_user.id, db)

    lec_user = UserModel.__table__.alias('lec_user')
    query = (
        select(Course, Programme.name, Lecturer.name, lec_user.c.email)
        .join(Programme, Course.programme_id == Programme.id)
        .join(Lecturer, Course.lecturer_id == Lecturer.id)
        .join(lec_user, lec_user.c.id == Lecturer.user_id)
        .join(StudentCourse, StudentCourse.course_id == Course.id)
        .filter(StudentCourse.student_id == student_id, StudentCourse.is_active == True)
    )

    if search:
        query = query.filter(
            Course.title.ilike(f"%{search}%") | Course.code.ilike(f"%{search}%")
        )

    res_total = await db.execute(select(func.count(Course.id)).select_from(query.subquery()))
    total = res_total.scalar() or 0

    res = await db.execute(query.offset((page - 1) * limit).limit(limit))
    rows = res.all()

    courses = []
    for c, p_name, l_name, l_email in rows:
        res_sess = await db.execute(select(Session.id).filter(Session.course_id == c.id, Session.is_locked == True))
        locked_sess_ids = [r[0] for r in res_sess.all()]
        sessions_total = len(locked_sess_ids)
        
        sessions_present = 0
        if locked_sess_ids:
            res_pres = await db.execute(
                select(func.count(AttendanceRecord.id)).filter(
                    AttendanceRecord.student_id == student_id,
                    AttendanceRecord.session_id.in_(locked_sess_ids),
                    AttendanceRecord.status == "present"
                )
            )
            sessions_present = res_pres.scalar() or 0

        attendance_pct = (sessions_present / sessions_total * 100) if sessions_total > 0 else 0.0
        
        if attendance_pct >= c.threshold_pct:
            status = "good"
        elif c.threshold_pct - 5 <= attendance_pct < c.threshold_pct:
            status = "at_risk"
        else:
            status = "defaulter"
            
        needed = FaceService.compute_sessions_needed(sessions_present, sessions_total, c.threshold_pct)
        
        res_live = await db.execute(select(Session).filter(Session.course_id == c.id, Session.is_active == True, Session.is_locked == False))
        live_sess = res_live.scalars().first()
        
        courses.append(StudentCourseCard(
            course_id=c.id,
            course_title=c.title,
            course_code=c.code,
            programme_name=p_name,
            level=c.level,
            semester_number=c.semester_number,
            credit_hours=c.credit_hours if hasattr(c, 'credit_hours') else None,
            lecturer_name=l_name,
            lecturer_email=l_email,
            sessions_present=sessions_present,
            sessions_total=sessions_total,
            attendance_pct=attendance_pct,
            threshold_pct=c.threshold_pct,
            status=status,
            sessions_needed_to_pass=needed,
            has_live_session=bool(live_sess),
            live_session_id=live_sess.id if live_sess else None
        ).model_dump())

    return {"courses": courses, "total": total}


@router.get("/{course_id}", summary="Get Course Details")
async def get_course_details(
    course_id: str,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    """Get details for one enrolled course."""
    student_id = await get_student_id(current_user.id, db)

    sc = await db.scalar(select(StudentCourse).filter(StudentCourse.student_id == student_id, StudentCourse.course_id == course_id, StudentCourse.is_active == True))
    if not sc:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course.")

    lec_user2 = UserModel.__table__.alias('lec_user2')
    res = await db.execute(
        select(Course, Programme.name, Programme.code, Lecturer.name, lec_user2.c.email)
        .join(Programme, Course.programme_id == Programme.id)
        .join(Lecturer, Course.lecturer_id == Lecturer.id)
        .join(lec_user2, lec_user2.c.id == Lecturer.user_id)
        .filter(Course.id == course_id)
    )
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Course not found")
    c, p_name, p_code, l_name, l_email = row

    res_sess = await db.execute(select(Session).filter(Session.course_id == c.id).order_by(Session.session_date.desc(), Session.started_at.desc()))
    all_sessions = res_sess.scalars().all()
    
    res_att = await db.execute(select(AttendanceRecord).filter(
        AttendanceRecord.student_id == student_id,
        AttendanceRecord.session_id.in_([s.id for s in all_sessions])
    ))
    att_records = {r.session_id: r for r in res_att.scalars().all()}

    sessions_resp = []
    sessions_total = sum(1 for s in all_sessions if s.is_locked)
    sessions_present = 0

    for s in all_sessions:
        ar = att_records.get(s.id)
        status = None
        method = None
        checked_in = None
        
        if ar:
            status = ar.status.value
            method = ar.method.value if ar.method else None
            checked_in = ar.checked_in_at
            if s.is_locked and status == "present":
                sessions_present += 1
        elif s.is_locked:
            status = "absent"
        elif s.is_active:
            status = "pending"

        sessions_resp.append(SessionSummaryForStudent(
            session_id=s.id,
            label=s.label or s.session_code,
            session_date=s.session_date,
            started_at=s.started_at,
            ended_at=s.ended_at,
            is_active=s.is_active,
            is_locked=s.is_locked,
            student_status=status,
            checked_in_at=checked_in,
            method=method
        ))

    attendance_pct = (sessions_present / sessions_total * 100) if sessions_total > 0 else 0.0
    overall_status = "good"
    if attendance_pct < c.threshold_pct:
        overall_status = "at_risk"

    needed = FaceService.compute_sessions_needed(sessions_present, sessions_total, c.threshold_pct)
    
    msg = None
    if overall_status == "at_risk":
        msg = f"You are at {attendance_pct:.1f}%. You need to attend {needed} more consecutive sessions to reach the {c.threshold_pct}% minimum."

    c_dict = c.__dict__.copy()
    c_dict.update({
        "programme_name": p_name,
        "programme_code": p_code,
        "lecturer_name": l_name,
        "lecturer_email": l_email,
        "enrolled_student_count": 0,
        "session_count": len(all_sessions)
    })

    return {
        "course": CourseResponse(**c_dict),
        "attendance_summary": CourseAttendanceSummary(
            course_id=c.id,
            course_title=c.title,
            course_code=c.code,
            sessions_present=sessions_present,
            sessions_total=sessions_total,
            attendance_pct=attendance_pct,
            threshold_pct=c.threshold_pct,
            status=overall_status
        ),
        "sessions": sessions_resp,
        "warning_message": msg
    }

@router.get("/{course_id}/attendance-history", summary="Get Course Attendance History")
async def get_course_attendance_history(
    course_id: str,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    """Specific endpoint for attendance history, reusing course details."""
    details = await get_course_details(course_id, current_user, db)
    return {"attendance_history": details["sessions"], "summary": details["attendance_summary"]}

