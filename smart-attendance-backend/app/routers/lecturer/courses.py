"""
Lecturer Courses Router.

Endpoints for the lecturer to manage and view details for their assigned courses.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.database import get_db
from app.dependencies import require_lecturer
from app.models.user import User
from app.models.lecturer import Lecturer
from app.models.course import Course
from app.models.programme import Programme
from app.models.student import Student, StudentCourse
from app.models.session import Session
from app.models.attendance import AttendanceRecord
from app.schemas.course import CourseResponse, CourseListResponse, BulkWarnRequest
from app.schemas.lecturer import LecturerCourseDetailResponse, CourseStudentRow, AtRiskStudent
from app.schemas.session import SessionResponse
from app.schemas.attendance import AttendanceListResponse, AttendanceRecordResponse
from app.services.email_service import send_attendance_warning_email
from app.services.notification_service import NotificationService

router = APIRouter(dependencies=[Depends(require_lecturer)])


async def get_lecturer_id(user_id, db: AsyncSession):
    res = await db.execute(select(Lecturer.id).filter(Lecturer.user_id == user_id))
    lid = res.scalar()
    if not lid:
        raise HTTPException(status_code=404, detail="Lecturer profile not found")
    return lid


@router.get("/", response_model=CourseListResponse, summary="List My Courses")
async def list_courses(
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """List all courses assigned to the authenticated lecturer."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    query = (
        select(Course, Programme.name, Programme.code, Lecturer.name)
        .join(Programme, Course.programme_id == Programme.id)
        .join(Lecturer, Course.lecturer_id == Lecturer.id)
        .filter(Course.lecturer_id == lecturer_id)
    )

    if search:
        query = query.filter(
            Course.title.ilike(f"%{search}%") | Course.code.ilike(f"%{search}%")
        )
    if is_active is not None:
        query = query.filter(Course.is_active == is_active)

    # Total count
    res_total = await db.execute(
        select(func.count(Course.id)).filter(Course.lecturer_id == lecturer_id)
    )
    total = res_total.scalar() or 0

    res = await db.execute(query.offset((page - 1) * limit).limit(limit))
    rows = res.all()

    courses = []
    for c, p_name, p_code, l_name in rows:
        # Counts
        res_stu = await db.execute(
            select(func.count(StudentCourse.id)).filter(StudentCourse.course_id == c.id, StudentCourse.is_active == True)
        )
        res_sess = await db.execute(
            select(func.count(Session.id)).filter(Session.course_id == c.id)
        )
        
        c_dict = c.__dict__.copy()
        c_dict.update({
            "programme_name": p_name,
            "programme_code": p_code,
            "lecturer_name": l_name,
            "enrolled_student_count": res_stu.scalar() or 0,
            "session_count": res_sess.scalar() or 0
        })
        courses.append(CourseResponse(**c_dict))

    return CourseListResponse(courses=courses, total=total)


@router.get("/{course_id}", response_model=LecturerCourseDetailResponse, summary="Get Course Detail")
async def get_course_detail(
    course_id: str,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Full detail for one of the lecturer's courses with enrolled students stats."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    res = await db.execute(
        select(Course, Programme.name, Programme.code)
        .join(Programme, Course.programme_id == Programme.id)
        .filter(Course.id == course_id)
    )
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Course not found")
    c, p_name, p_code = row

    if c.lecturer_id != lecturer_id:
        raise HTTPException(status_code=403, detail="Forbidden: You are not assigned to this course")

    # Get sessions count
    res_sess = await db.execute(select(Session.id).filter(Session.course_id == c.id))
    session_ids = [r[0] for r in res_sess.all()]
    sessions_held = len(session_ids)

    # Get enrolled students
    res_stu = await db.execute(
        select(Student, User.email)
        .join(StudentCourse, Student.id == StudentCourse.student_id)
        .join(User, Student.user_id == User.id)
        .filter(StudentCourse.course_id == c.id, StudentCourse.is_active == True)
    )
    students = res_stu.all()
    enrolled_rows = []
    total_present_all = 0
    total_records_all = sessions_held * len(students)
    below_threshold_count = 0

    att_records = []
    if session_ids and students:
        student_ids = [st.id for st, _ in students]
        res_att = await db.execute(
            select(AttendanceRecord.student_id, AttendanceRecord.status, AttendanceRecord.created_at)
            .filter(AttendanceRecord.session_id.in_(session_ids), AttendanceRecord.student_id.in_(student_ids))
            .order_by(AttendanceRecord.created_at.asc())
        )
        att_records = res_att.all()

    for st, email in students:
        st_recs = [r for r in att_records if r.student_id == st.id]
        st_pres = sum(1 for r in st_recs if r.status.value == "present")
        total_present_all += st_pres
        
        last_checkin = next((r.created_at for r in reversed(st_recs) if r.status.value == "present"), None)
        pct = (st_pres / sessions_held * 100) if sessions_held > 0 else 0.0
        
        if pct < c.threshold_pct:
            status_val = "at_risk"
            below_threshold_count += 1
            if pct < 50.0:
                status_val = "defaulter"
        else:
            status_val = "good"

        enrolled_rows.append(
            CourseStudentRow(
                student_id=st.id,
                student_name=st.name,
                student_number=st.student_id,
                email=email,
                sessions_present=st_pres,
                sessions_total=sessions_held,
                attendance_pct=pct,
                status=status_val,
                last_checkin=last_checkin
            )
        )

    avg_pct = (total_present_all / total_records_all * 100) if total_records_all > 0 else 0.0

    return LecturerCourseDetailResponse(
        course_id=c.id,
        course_title=c.title,

        course_code=c.code,
        programme_name=p_name,
        programme_code=p_code,
        level=c.level,
        semester_number=c.semester_number,
        credit_hours=c.credit_hours,
        threshold_pct=c.threshold_pct,
        is_active=c.is_active,
        enrolled_students=enrolled_rows,
        session_count=sessions_held,
        avg_attendance_pct=avg_pct,
        below_threshold_count=below_threshold_count
    )


@router.get("/{course_id}/students", response_model=List[CourseStudentRow], summary="Get Enrolled Students")
async def get_course_students(
    course_id: str,
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Returns all students enrolled in a specific course."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    c = await db.scalar(select(Course).filter(Course.id == course_id))
    if not c or c.lecturer_id != lecturer_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Delegate full computation to the detail endpoint to avoid duplication,
    # then just paginate & filter. In production with thousands of students,
    # this would be pure SQL.
    detail = await get_course_detail(course_id, current_user, db)
    students = detail.enrolled_students

    if search:
        s = search.lower()
        students = [x for x in students if s in x.student_name.lower() or s in x.student_number.lower()]
    if status:
        students = [x for x in students if x.status == status]

    # Paginate
    start = (page - 1) * limit
    return students[start:start + limit]


@router.get("/{course_id}/students/{student_id}/attendance", response_model=AttendanceListResponse, summary="Student Course Attendance")
async def get_student_course_attendance(
    course_id: str,
    student_id: str,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Full attendance history for one student in a specific course."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    c = await db.scalar(select(Course).filter(Course.id == course_id))
    if not c or c.lecturer_id != lecturer_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Get all sessions for this course
    res_sess = await db.execute(select(Session).filter(Session.course_id == c.id).order_by(Session.session_date.desc()))
    sessions = res_sess.scalars().all()
    session_map = {s.id: s for s in sessions}

    if not sessions:
        return AttendanceListResponse(records=[], total=0, present_count=0, absent_count=0, attendance_pct=0.0)

    # Get student info
    st = await db.scalar(select(Student).filter(Student.id == student_id))
    if not st:
        raise HTTPException(status_code=404, detail="Student not found")

    # Get attendance records
    res_att = await db.execute(
        select(AttendanceRecord).filter(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.session_id.in_(session_map.keys())
        )
    )
    records = res_att.scalars().all()

    pres = sum(1 for r in records if r.status.value == "present")
    absnt = sum(1 for r in records if r.status.value == "absent")
    tot = len(sessions)
    pct = (pres / tot * 100) if tot > 0 else 0.0

    resp_records = []
    for r in records:
        sess = session_map[r.session_id]
        resp_records.append(
            AttendanceRecordResponse(
                id=r.id,
                session_id=r.session_id,
                session_label=sess.label or sess.session_code,
                session_date=sess.session_date,
                student_id=st.id,
                student_name=st.name,
                student_number=st.student_id,
                course_id=c.id,
                course_title=c.title,
                course_code=c.code,
                checked_in_at=r.checked_in_at,
                method=r.method.value if r.method else None,
                status=r.status.value,
                is_manual_override=r.is_manual_override,
                override_reason=r.override_reason,
                created_at=r.created_at
            )
        )
    
    # Also add "absent" records for sessions that have no AttendanceRecord 
    # (though they should have been created on session end)
    existing_sess_ids = {r.session_id for r in records}
    for sess in sessions:
        if sess.id not in existing_sess_ids and sess.is_locked:
            resp_records.append(
                AttendanceRecordResponse(
                    id=sess.id, # mock ID for UI loop if strictly needed, or skip
                    session_id=sess.id,
                    session_label=sess.label or sess.session_code,
                    session_date=sess.session_date,
                    student_id=st.id,
                    student_name=st.name,
                    student_number=st.student_id,
                    course_id=c.id,
                    course_title=c.title,
                    course_code=c.code,
                    checked_in_at=None,
                    method=None,
                    status="absent",
                    is_manual_override=False,
                    override_reason=None,
                    created_at=sess.ended_at or sess.created_at
                )
            )
            absnt += 1

    return AttendanceListResponse(
        records=resp_records,
        total=len(resp_records),
        present_count=pres,
        absent_count=absnt,
        attendance_pct=pct
    )


@router.get("/{course_id}/sessions", response_model=List[SessionResponse], summary="Course Sessions")
async def get_course_sessions(
    course_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """All sessions for a specific course."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    c = await db.scalar(select(Course).filter(Course.id == course_id))
    if not c or c.lecturer_id != lecturer_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    res = await db.execute(
        select(Session, Lecturer.name)
        .join(Lecturer, Session.lecturer_id == Lecturer.id)
        .filter(Session.course_id == course_id)
        .order_by(Session.session_date.desc(), Session.started_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    rows = res.all()

    en_res = await db.execute(select(func.count(StudentCourse.id)).filter(StudentCourse.course_id == course_id, StudentCourse.is_active == True))
    en_cnt = en_res.scalar() or 0

    sessions = []
    for s, l_name in rows:
        att_res = await db.execute(
            select(
                func.count(AttendanceRecord.id).filter(AttendanceRecord.status == "present"),
                func.count(AttendanceRecord.id).filter(AttendanceRecord.status == "absent"),
                func.count(AttendanceRecord.id).filter(AttendanceRecord.method == "face"),
                func.count(AttendanceRecord.id).filter(AttendanceRecord.method == "qr")
            ).filter(AttendanceRecord.session_id == s.id)
        )
        pres, absnt, face_cnt, qr_cnt = att_res.first()

        dur = None
        if s.ended_at:
            dur = int((s.ended_at - s.started_at).total_seconds() / 60)

        pct = (pres / en_cnt * 100) if en_cnt > 0 else 0.0

        s_dict = s.__dict__.copy()
        s_dict.update({
            "course_title": c.title,
            "course_code": c.code,
            "lecturer_name": l_name,
            "duration_minutes": dur,
            "present_count": pres,
            "absent_count": absnt,
            "total_enrolled": en_cnt,
            "attendance_pct": pct,
            "face_scan_count": face_cnt,
            "qr_scan_count": qr_cnt
        })
        sessions.append(SessionResponse(**s_dict))

    return sessions


@router.get("/{course_id}/at-risk", response_model=List[AtRiskStudent], summary="At-Risk Students")
async def get_course_at_risk(
    course_id: str,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """All students below threshold for this course."""
    detail = await get_course_detail(course_id, current_user, db)
    return [
        AtRiskStudent(
            student_id=st.student_id,
            student_name=st.student_name,
            student_number=st.student_number,
            course_id=detail.course_id,
            course_title=detail.course_title,
            course_code=detail.course_code,
            current_pct=st.attendance_pct,
            threshold_pct=detail.threshold_pct,
            shortfall=detail.threshold_pct - st.attendance_pct
        )
        for st in detail.enrolled_students if st.status in ["at_risk", "defaulter"]
    ]


@router.post("/{course_id}/students/bulk-warn", summary="Bulk Send Warning Emails")
async def bulk_send_warning_emails(
    course_id: str,
    data: BulkWarnRequest,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Send attendance warning emails to multiple students."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    c = await db.scalar(select(Course).filter(Course.id == course_id))
    if not c or c.lecturer_id != lecturer_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    enrolled_res = await db.execute(select(StudentCourse.student_id).filter(
        StudentCourse.course_id == c.id, 
        StudentCourse.student_id.in_(data.student_ids),
        StudentCourse.is_active == True
    ))
    enrolled_ids = {str(r[0]) for r in enrolled_res.all()}

    sent_count = 0
    for st_id in data.student_ids:
        if str(st_id) not in enrolled_ids:
            continue
        await NotificationService.check_and_send_threshold_alerts(st_id, c.id, db)
        sent_count += 1
        
    return {"message": f"Warnings processed for {sent_count} students"}

@router.post("/{course_id}/students/{student_id}/send-warning", summary="Send Warning Email")
async def send_warning_email(
    course_id: str,
    student_id: str,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Send attendance warning email to a specific student."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    c = await db.scalar(select(Course).filter(Course.id == course_id))
    if not c or c.lecturer_id != lecturer_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Get student & user for email
    res = await db.execute(
        select(Student, User.email)
        .join(User, Student.user_id == User.id)
        .filter(Student.id == student_id)
    )
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Student not found")
    st, email = row

    # Ensure enrolled
    sc = await db.scalar(select(StudentCourse).filter(StudentCourse.student_id == st.id, StudentCourse.course_id == c.id, StudentCourse.is_active == True))
    if not sc:
        raise HTTPException(status_code=400, detail="Student not enrolled in course")

    # Get attendance stats
    res_sess = await db.execute(select(func.count(Session.id)).filter(Session.course_id == c.id))
    sessions_held = res_sess.scalar() or 0
    
    res_pres = await db.execute(
        select(func.count(AttendanceRecord.id)).filter(
            AttendanceRecord.student_id == st.id,
            AttendanceRecord.status == "present",
            AttendanceRecord.session_id.in_(select(Session.id).filter(Session.course_id == c.id))
        )
    )
    present_count = res_pres.scalar() or 0

    pct = (present_count / sessions_held * 100) if sessions_held > 0 else 0.0
    
    # Calculate needed sessions (approximation)
    needed = int(((c.threshold_pct * sessions_held) / 100) - present_count)
    if needed < 0: needed = 0

    await send_attendance_warning_email(
        to_email=email,
        student_name=st.name,
        course_title=c.title,
        course_code=c.code,
        current_pct=pct,
        threshold_pct=c.threshold_pct,
        sessions_needed=needed
    )

    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="warning_email_sent",
        entity_type="student",
        entity_id=st.id,
        details={"student_name": st.name, "course": c.code, "pct": pct},
        ip_address=None,
        db=db
    )

    return {"message": f"Warning email sent to {email}"}
