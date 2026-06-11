"""
Student Dashboard Router.

Provides aggregate statistics, upcoming schedule, and active session alerts for the student dashboard.
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.database import get_db
from app.dependencies import require_student
from app.models.user import User
from app.models.student import Student, StudentCourse
from app.models.course import Course
from app.models.programme import Programme
from app.models.session import Session
from app.models.attendance import AttendanceRecord
from app.models.lecturer import Lecturer
from app.models.academic_year import AcademicYear, Semester
from app.schemas.student_portal import (
    StudentDashboardResponse,
    StudentDashboardStats,
    StudentCourseCard,
    LiveSessionAlert,
    StudentActivityItem,
    UpcomingClass
)
from app.services.face_service import FaceService

router = APIRouter(dependencies=[Depends(require_student)])


async def get_student_record(user_id, db: AsyncSession):
    res = await db.execute(
        select(Student, Programme.name)
        .join(Programme, Student.programme_id == Programme.id)
        .filter(Student.user_id == user_id)
    )
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return row[0], row[1]


@router.get("/", response_model=StudentDashboardResponse, summary="Get Dashboard Data")
async def get_dashboard(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    """Returns everything the student dashboard needs in one call."""
    student, prog_name = await get_student_record(current_user.id, db)

    # Fetch enrolled courses
    res_courses = await db.execute(
        select(Course, Programme.name, Lecturer.name)
        .join(Programme, Course.programme_id == Programme.id)
        .join(Lecturer, Course.lecturer_id == Lecturer.id)
        .join(StudentCourse, StudentCourse.course_id == Course.id)
        .filter(StudentCourse.student_id == student.id, StudentCourse.is_active == True)
    )
    enrolled_data = res_courses.all()

    course_cards = []
    course_ids = []
    tot_pres_all = 0
    tot_sess_all = 0
    at_risk_count = 0
    
    live_session_alert = None

    for c, c_prog_name, l_name in enrolled_data:
        course_ids.append(c.id)
        
        # Sessions held (locked)
        res_sess = await db.execute(select(Session.id).filter(Session.course_id == c.id, Session.is_locked == True))
        locked_sess_ids = [r[0] for r in res_sess.all()]
        sessions_total = len(locked_sess_ids)
        
        sessions_present = 0
        if locked_sess_ids:
            res_pres = await db.execute(
                select(func.count(AttendanceRecord.id)).filter(
                    AttendanceRecord.student_id == student.id,
                    AttendanceRecord.session_id.in_(locked_sess_ids),
                    AttendanceRecord.status == "present"
                )
            )
            sessions_present = res_pres.scalar() or 0
            
        tot_pres_all += sessions_present
        tot_sess_all += sessions_total
        
        attendance_pct = (sessions_present / sessions_total * 100) if sessions_total > 0 else 0.0
        
        if attendance_pct >= c.threshold_pct:
            status = "good"
        elif c.threshold_pct - 5 <= attendance_pct < c.threshold_pct:
            status = "at_risk"
            at_risk_count += 1
        else:
            status = "defaulter"
            at_risk_count += 1
            
        needed = FaceService.compute_sessions_needed(sessions_present, sessions_total, c.threshold_pct)
        
        # Live session
        res_live = await db.execute(select(Session).filter(Session.course_id == c.id, Session.is_active == True, Session.is_locked == False))
        live_sess = res_live.scalars().first()
        
        if live_sess and not live_session_alert:
            # Check if marked
            res_marked = await db.execute(
                select(func.count(AttendanceRecord.id)).filter(
                    AttendanceRecord.session_id == live_sess.id,
                    AttendanceRecord.student_id == student.id,
                    AttendanceRecord.status == "present"
                )
            )
            already_marked = (res_marked.scalar() or 0) > 0
            
            secs_rem = None
            if live_sess.qr_expires_at:
                secs_rem = int((live_sess.qr_expires_at - datetime.utcnow()).total_seconds())
                if secs_rem < 0: secs_rem = 0
                
            live_session_alert = LiveSessionAlert(
                session_id=live_sess.id,
                course_id=c.id,
                course_title=c.title,
                course_code=c.code,
                lecturer_name=l_name,
                started_at=live_sess.started_at,
                qr_expires_at=live_sess.qr_expires_at,
                seconds_remaining=secs_rem,
                already_marked=already_marked
            )
            
        course_cards.append(StudentCourseCard(
            course_id=c.id,
            course_title=c.title,
            course_code=c.code,
            programme_name=c_prog_name,
            level=c.level,
            semester_number=c.semester_number,
            lecturer_name=l_name,
            sessions_present=sessions_present,
            sessions_total=sessions_total,
            attendance_pct=attendance_pct,
            threshold_pct=c.threshold_pct,
            status=status,
            sessions_needed_to_pass=needed,
            has_live_session=bool(live_sess),
            live_session_id=live_sess.id if live_sess else None
        ))

    overall_avg_pct = (tot_pres_all / tot_sess_all * 100) if tot_sess_all > 0 else 0.0

    # Recent activity
    recent_activity = []
    if course_ids:
        res_rec = await db.execute(
            select(AttendanceRecord, Session, Course)
            .join(Session, AttendanceRecord.session_id == Session.id)
            .join(Course, Session.course_id == Course.id)
            .filter(AttendanceRecord.student_id == student.id)
            .order_by(Session.session_date.desc(), AttendanceRecord.checked_in_at.desc())
            .limit(5)
        )
        for ar, s, c in res_rec.all():
            recent_activity.append(StudentActivityItem(
                session_id=s.id,
                course_title=c.title,
                course_code=c.code,
                session_date=s.session_date,
                session_label=s.label or s.session_code,
                checked_in_at=ar.checked_in_at,
                method=ar.method.value if ar.method else None,
                status=ar.status.value,
                is_manual_override=ar.is_manual_override
            ))

    # Academic year / Semester
    res_ay = await db.execute(select(AcademicYear).filter(AcademicYear.is_active == True))
    ay = res_ay.scalars().first()
    ay_name = ay.year_label if ay else None
    
    res_sem = await db.execute(select(Semester).filter(Semester.is_active == True))
    sem = res_sem.scalars().first()
    sem_name = f"Semester {sem.number}" if sem else None

    # Upcoming Schedule
    # (Assuming no explicit schedule table, return a basic projection of courses based on their semester/level)
    upcoming_schedule = []

    stats = StudentDashboardStats(
        total_courses=len(course_cards),
        overall_avg_pct=overall_avg_pct,
        sessions_attended=tot_pres_all,
        sessions_total=tot_sess_all,
        at_risk_courses=at_risk_count
    )

    return StudentDashboardResponse(
        student_name=student.name,
        student_number=student.student_id,
        programme_name=prog_name,
        level=student.level,
        academic_year=ay_name,
        active_semester=sem_name,
        enrolled_courses=course_cards,
        recent_activity=recent_activity,
        upcoming_schedule=upcoming_schedule,
        live_session=live_session_alert,
        stats=stats
    )


@router.get("/live-session", response_model=dict, summary="Get Active Live Session")
async def get_live_session(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    """Check if any live session is active for the student's courses."""
    student, _ = await get_student_record(current_user.id, db)
    
    res_c = await db.execute(select(StudentCourse.course_id).filter(StudentCourse.student_id == student.id, StudentCourse.is_active == True))
    course_ids = [r[0] for r in res_c.all()]
    
    if not course_ids:
        return {"live_session": None}
        
    res_live = await db.execute(
        select(Session, Course, Lecturer.name)
        .join(Course, Session.course_id == Course.id)
        .join(Lecturer, Course.lecturer_id == Lecturer.id)
        .filter(Session.course_id.in_(course_ids), Session.is_active == True, Session.is_locked == False)
    )
    row = res_live.first()
    
    if not row:
        return {"live_session": None}
        
    s, c, l_name = row
    
    res_marked = await db.execute(
        select(func.count(AttendanceRecord.id)).filter(
            AttendanceRecord.session_id == s.id,
            AttendanceRecord.student_id == student.id,
            AttendanceRecord.status == "present"
        )
    )
    already_marked = (res_marked.scalar() or 0) > 0
    
    secs_rem = None
    if s.qr_expires_at:
        secs_rem = int((s.qr_expires_at - datetime.utcnow()).total_seconds())
        if secs_rem < 0: secs_rem = 0
        
    alert = LiveSessionAlert(
        session_id=s.id,
        course_id=c.id,
        course_title=c.title,
        course_code=c.code,
        lecturer_name=l_name,
        started_at=s.started_at,
        qr_expires_at=s.qr_expires_at,
        seconds_remaining=secs_rem,
        already_marked=already_marked
    )
    return {"live_session": alert.model_dump()}

@router.get("/upcoming-sessions", summary="Get Upcoming Sessions")
async def get_upcoming_sessions(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    # Retrieve the student
    student, _ = await get_student_record(current_user.id, db)
    
    # Retrieve active courses for the student
    res_c = await db.execute(select(StudentCourse.course_id).filter(StudentCourse.student_id == student.id, StudentCourse.is_active == True))
    course_ids = [r[0] for r in res_c.all()]
    
    if not course_ids:
        return {"upcoming_sessions": []}
    
    # Normally we would query a Schedule table here. For now, since there's no schedule table,
    # we return a static projection based on active courses or simply an empty list
    return {"upcoming_sessions": []}
