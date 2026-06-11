"""
Lecturer Dashboard Router.

Provides aggregate statistics and overviews for the lecturer dashboard UI.
"""
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.database import get_db
from app.dependencies import require_lecturer
from app.models.user import User
from app.models.lecturer import Lecturer
from app.models.department import Department
from app.models.course import Course
from app.models.programme import Programme
from app.models.session import Session
from app.models.attendance import AttendanceRecord
from app.models.student import Student, StudentCourse
from app.schemas.lecturer import (
    LecturerDashboardResponse,
    LecturerStats,
    LecturerCourseCard,
    AtRiskStudent,
    SessionSummary,
)

router = APIRouter(dependencies=[Depends(require_lecturer)])


@router.get("/", response_model=LecturerDashboardResponse, summary="Get Dashboard Data")
async def get_dashboard(
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the complete dashboard payload including stats, active courses,
    recent sessions, and at-risk students scoped to the authenticated lecturer.
    """
    # 1. Fetch lecturer & department
    res = await db.execute(
        select(Lecturer, Department.name)
        .join(Department, Lecturer.department_id == Department.id)
        .filter(Lecturer.user_id == current_user.id)
    )
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Lecturer profile not found")
    lecturer, dept_name = row

    # 2. Fetch assigned courses
    res = await db.execute(
        select(Course, Programme.name)
        .join(Programme, Course.programme_id == Programme.id)
        .filter(Course.lecturer_id == lecturer.id, Course.is_active == True)
    )
    courses_data = res.all()

    course_cards = []
    course_ids = []
    total_enrolled_all = set()
    total_at_risk_count = 0

    for c, p_name in courses_data:
        course_ids.append(c.id)
        
        # Enrolled count
        res_en = await db.execute(
            select(StudentCourse.student_id).filter(
                StudentCourse.course_id == c.id,
                StudentCourse.is_active == True
            )
        )
        enrolled_student_ids = [r[0] for r in res_en.all()]
        total_enrolled_all.update(enrolled_student_ids)
        enrolled_count = len(enrolled_student_ids)

        # Sessions held
        res_sess = await db.execute(
            select(Session).filter(Session.course_id == c.id)
        )
        sessions_held_records = res_sess.scalars().all()
        sessions_held = len(sessions_held_records)
        session_ids = [s.id for s in sessions_held_records]

        # Live session check
        live_session = next((s for s in sessions_held_records if s.is_active and not s.is_locked), None)

        # Avg attendance and below threshold
        avg_attendance_pct = 0.0
        below_threshold_count = 0
        
        if session_ids and enrolled_student_ids:
            # Get attendance for enrolled students in these sessions
            res_att = await db.execute(
                select(AttendanceRecord.student_id, AttendanceRecord.status).filter(
                    AttendanceRecord.session_id.in_(session_ids),
                    AttendanceRecord.student_id.in_(enrolled_student_ids)
                )
            )
            att_records = res_att.all()
            
            total_present = sum(1 for r in att_records if r.status.value == "present")
            total_records = sessions_held * enrolled_count
            avg_attendance_pct = (total_present / total_records * 100) if total_records > 0 else 0.0

            # Calculate per student
            student_att = {sid: {"present": 0} for sid in enrolled_student_ids}
            for sid, stat in att_records:
                if stat.value == "present":
                    student_att[sid]["present"] += 1
            
            for sid, data in student_att.items():
                pct = (data["present"] / sessions_held * 100) if sessions_held > 0 else 0.0
                if pct < c.threshold_pct:
                    below_threshold_count += 1
            
            total_at_risk_count += below_threshold_count

        course_cards.append(
            LecturerCourseCard(
                course_id=c.id,
                course_title=c.title,
                course_code=c.code,
                programme_name=p_name,
                level=c.level,
                semester_number=c.semester_number,
                credit_hours=c.credit_hours,
                threshold_pct=c.threshold_pct,
                enrolled_count=enrolled_count,
                sessions_held=sessions_held,
                avg_attendance_pct=avg_attendance_pct,
                below_threshold_count=below_threshold_count,
                has_live_session=bool(live_session),
                live_session_id=live_session.id if live_session else None
            )
        )

    # 3. Recent Sessions
    recent_sessions = []
    if course_ids:
        res_recent = await db.execute(
            select(Session, Course.title, Course.code)
            .join(Course, Session.course_id == Course.id)
            .filter(Session.course_id.in_(course_ids))
            .order_by(Session.started_at.desc())
            .limit(5)
        )
        recent_records = res_recent.all()
        for s, c_title, c_code in recent_records:
            # Counts
            res_counts = await db.execute(
                select(
                    func.count(AttendanceRecord.id).filter(AttendanceRecord.status == "present"),
                    func.count(AttendanceRecord.id).filter(AttendanceRecord.status == "absent"),
                    func.count(AttendanceRecord.id)
                ).filter(AttendanceRecord.session_id == s.id)
            )
            pres, absnt, tot_rec = res_counts.first()
            
            # Enrolled for this course
            en_cnt = sum(1 for cc in course_cards if cc.course_id == s.course_id)
            # Actually get true enrolled count for the course at that time, but we'll use current
            res_en_c = await db.execute(
                select(func.count(StudentCourse.id)).filter(StudentCourse.course_id == s.course_id, StudentCourse.is_active == True)
            )
            tot_en = res_en_c.scalar() or 0

            att_pct = (pres / tot_en * 100) if tot_en > 0 else 0.0

            dur = None
            if s.ended_at:
                dur = int((s.ended_at - s.started_at).total_seconds() / 60)

            res_methods = await db.execute(
                select(
                    func.count(AttendanceRecord.id).filter(AttendanceRecord.method == "face"),
                    func.count(AttendanceRecord.id).filter(AttendanceRecord.method == "qr")
                ).filter(AttendanceRecord.session_id == s.id)
            )
            face_cnt, qr_cnt = res_methods.first()

            recent_sessions.append(
                SessionSummary(
                    session_id=s.id,
                    course_title=c_title,
                    course_code=c_code,
                    label=s.label,
                    session_date=s.session_date,
                    total_enrolled=tot_en,
                    present_count=pres,
                    absent_count=absnt,
                    attendance_pct=att_pct,
                    face_scan_count=face_cnt,
                    qr_scan_count=qr_cnt,
                    duration_minutes=dur
                )
            )

    # 4. At-risk students (limit 10, ordered by lowest pct)
    at_risk_list = []
    if course_ids:
        # Complex to do purely in SQL without window functions, doing it efficiently in Python for the courses
        for cc in course_cards:
            if cc.below_threshold_count > 0:
                # get all students for this course
                res_stu = await db.execute(
                    select(Student, StudentCourse)
                    .join(StudentCourse, Student.id == StudentCourse.student_id)
                    .filter(StudentCourse.course_id == cc.course_id, StudentCourse.is_active == True)
                )
                st_records = res_stu.all()
                for st, sc in st_records:
                    res_att_st = await db.execute(
                        select(
                            func.count(AttendanceRecord.id).filter(AttendanceRecord.status == "present"),
                            func.count(AttendanceRecord.id)
                        ).filter(
                            AttendanceRecord.student_id == st.id,
                            AttendanceRecord.session_id.in_(
                                select(Session.id).filter(Session.course_id == cc.course_id)
                            )
                        )
                    )
                    st_pres, st_tot_att = res_att_st.first()
                    st_tot_sess = cc.sessions_held
                    
                    if st_tot_sess > 0:
                        pct = (st_pres / st_tot_sess) * 100
                        if pct < cc.threshold_pct:
                            at_risk_list.append(
                                AtRiskStudent(
                                    student_id=st.id,
                                    student_name=st.name,
                                    student_number=st.student_id,
                                    course_id=cc.course_id,
                                    course_title=cc.course_title,
                                    course_code=cc.course_code,
                                    current_pct=pct,
                                    threshold_pct=cc.threshold_pct,
                                    shortfall=cc.threshold_pct - pct
                                )
                            )
    
    # Sort by lowest % first, take 10
    at_risk_list.sort(key=lambda x: x.current_pct)
    at_risk_list = at_risk_list[:10]

    # 5. Sessions this week
    start_of_week = datetime.utcnow() - timedelta(days=datetime.utcnow().weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
    sessions_this_week = 0
    if course_ids:
        res_this_week = await db.execute(
            select(func.count(Session.id)).filter(
                Session.course_id.in_(course_ids),
                Session.started_at >= start_of_week
            )
        )
        sessions_this_week = res_this_week.scalar() or 0

    stats = LecturerStats(
        total_courses=len(course_cards),
        total_students=len(total_enrolled_all),
        sessions_this_week=sessions_this_week,
        at_risk_count=total_at_risk_count
    )

    return LecturerDashboardResponse(
        lecturer_name=lecturer.name,
        department_name=dept_name,
        courses=course_cards,
        recent_sessions=recent_sessions,
        at_risk_students=at_risk_list,
        stats=stats
    )


@router.get("/stats", response_model=LecturerStats, summary="Get Dashboard Stats")
async def get_dashboard_stats(
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns only the top-level stats for quick refresh.
    """
    res = await db.execute(select(Lecturer).filter(Lecturer.user_id == current_user.id))
    lecturer = res.scalars().first()
    if not lecturer:
        raise HTTPException(status_code=404, detail="Lecturer profile not found")

    res = await db.execute(select(Course.id).filter(Course.lecturer_id == lecturer.id, Course.is_active == True))
    course_ids = [row[0] for row in res.all()]

    if not course_ids:
        return LecturerStats(total_courses=0, total_students=0, sessions_this_week=0, at_risk_count=0)

    # Students
    res_en = await db.execute(
        select(func.count(func.distinct(StudentCourse.student_id))).filter(
            StudentCourse.course_id.in_(course_ids),
            StudentCourse.is_active == True
        )
    )
    total_students = res_en.scalar() or 0

    # Sessions this week
    start_of_week = datetime.utcnow() - timedelta(days=datetime.utcnow().weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
    res_this_week = await db.execute(
        select(func.count(Session.id)).filter(
            Session.course_id.in_(course_ids),
            Session.started_at >= start_of_week
        )
    )
    sessions_this_week = res_this_week.scalar() or 0

    # At risk count (simplified for quick stats: just an approximation or run the full logic)
    # Re-running the full logic since we need accuracy.
    res_courses = await db.execute(select(Course).filter(Course.id.in_(course_ids)))
    courses = res_courses.scalars().all()
    
    total_at_risk_count = 0
    for c in courses:
        res_stu = await db.execute(
            select(StudentCourse.student_id).filter(StudentCourse.course_id == c.id, StudentCourse.is_active == True)
        )
        enrolled_student_ids = [r[0] for r in res_stu.all()]
        if not enrolled_student_ids:
            continue
            
        res_sess = await db.execute(select(Session.id).filter(Session.course_id == c.id))
        session_ids = [r[0] for r in res_sess.all()]
        if not session_ids:
            continue
            
        sessions_held = len(session_ids)
        res_att = await db.execute(
            select(AttendanceRecord.student_id, AttendanceRecord.status).filter(
                AttendanceRecord.session_id.in_(session_ids),
                AttendanceRecord.student_id.in_(enrolled_student_ids)
            )
        )
        att_records = res_att.all()
        
        student_att = {sid: 0 for sid in enrolled_student_ids}
        for sid, stat in att_records:
            if stat.value == "present":
                student_att[sid] += 1
        
        for sid, pres_cnt in student_att.items():
            pct = (pres_cnt / sessions_held * 100)
            if pct < c.threshold_pct:
                total_at_risk_count += 1

    return LecturerStats(
        total_courses=len(course_ids),
        total_students=total_students,
        sessions_this_week=sessions_this_week,
        at_risk_count=total_at_risk_count
    )
