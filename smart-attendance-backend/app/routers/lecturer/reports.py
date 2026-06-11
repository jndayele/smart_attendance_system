"""
Lecturer Reports Router.

Endpoints for the lecturer to generate attendance reports in JSON, PDF, and Excel formats.
All operations must be scoped strictly to the authenticated lecturer's courses.
"""
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.database import get_db
from app.dependencies import require_lecturer
from app.models.user import User
from app.models.lecturer import Lecturer
from app.models.course import Course
from app.models.student import Student, StudentCourse
from app.models.session import Session
from app.models.attendance import AttendanceRecord
from app.schemas.course import CourseResponse
from app.schemas.session import SessionSummary
from app.schemas.lecturer import CourseStudentRow, AtRiskStudent
from app.schemas.student import CourseAttendanceSummary, StudentResponse, AttendanceRecordResponse
from app.services.report_service import ReportService
from app.services.email_service import send_attendance_warning_email
from app.services.notification_service import NotificationService

router = APIRouter(dependencies=[Depends(require_lecturer)])


async def get_lecturer_id(user_id, db: AsyncSession):
    res = await db.execute(select(Lecturer.id).filter(Lecturer.user_id == user_id))
    lid = res.scalar()
    if not lid:
        raise HTTPException(status_code=404, detail="Lecturer profile not found")
    return lid


@router.get("/overview", summary="Get Reports Overview")
async def get_overview(
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Attendance overview for all of the lecturer's courses."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    res = await db.execute(select(Course).filter(Course.lecturer_id == lecturer_id, Course.is_active == True))
    courses = res.scalars().all()

    resp_courses = []
    for c in courses:
        res_en = await db.execute(select(StudentCourse.student_id).filter(StudentCourse.course_id == c.id, StudentCourse.is_active == True))
        enrolled_ids = [r[0] for r in res_en.all()]
        tot_enrolled = len(enrolled_ids)

        res_sess = await db.execute(select(Session).filter(Session.course_id == c.id).order_by(Session.session_date.asc()))
        sessions = res_sess.scalars().all()
        
        session_trend = []
        tot_pres = 0
        tot_records = len(sessions) * tot_enrolled

        student_pres_counts = {sid: 0 for sid in enrolled_ids}

        for s in sessions:
            res_att = await db.execute(select(AttendanceRecord.student_id).filter(AttendanceRecord.session_id == s.id, AttendanceRecord.status == "present"))
            pres_ids = [r[0] for r in res_att.all()]
            pres_count = len(pres_ids)
            tot_pres += pres_count
            
            for sid in pres_ids:
                if sid in student_pres_counts:
                    student_pres_counts[sid] += 1
                    
            pct = (pres_count / tot_enrolled * 100) if tot_enrolled > 0 else 0.0
            session_trend.append({
                "session_date": s.session_date,
                "session_label": s.label or s.session_code,
                "attendance_pct": pct,
                "present": pres_count,
                "total": tot_enrolled
            })
            
        avg_pct = (tot_pres / tot_records * 100) if tot_records > 0 else 0.0
        
        below_thresh = 0
        if len(sessions) > 0:
            for sid, p_count in student_pres_counts.items():
                p_pct = (p_count / len(sessions) * 100)
                if p_pct < c.threshold_pct:
                    below_thresh += 1

        c_dict = c.__dict__.copy()
        c_dict.update({
            "programme_name": "Unknown",
            "programme_code": "Unknown",
            "lecturer_name": current_user.email,
            "enrolled_student_count": tot_enrolled,
            "session_count": len(sessions)
        })

        resp_courses.append({
            "course": CourseResponse(**c_dict),
            "total_sessions": len(sessions),
            "avg_pct": avg_pct,
            "below_threshold_count": below_thresh,
            "session_trend": session_trend
        })

    return {"courses": resp_courses}


@router.get("/course/{course_id}", summary="Course Attendance Data")
async def get_course_data(
    course_id: str,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Attendance data for a specific course as JSON."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    c = await db.scalar(select(Course).filter(Course.id == course_id))
    if not c or c.lecturer_id != lecturer_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # This combines much of what we do in detail endpoint but optimized for reports
    # Let's import detail endpoint for reuse to keep it DRY
    from app.routers.lecturer.courses import get_course_detail
    detail = await get_course_detail(course_id, current_user, db)

    res_sess = await db.execute(select(Session).filter(Session.course_id == c.id).order_by(Session.session_date.asc()))
    sessions = res_sess.scalars().all()

    # Get charts data
    session_trend = []
    tot_face = 0
    tot_qr = 0
    
    threshold_dist = {"above": 0, "approaching": 0, "below": 0}

    for s in sessions:
        att_res = await db.execute(
            select(
                func.count(AttendanceRecord.id).filter(AttendanceRecord.status == "present"),
                func.count(AttendanceRecord.id).filter(AttendanceRecord.method == "face"),
                func.count(AttendanceRecord.id).filter(AttendanceRecord.method == "qr")
            ).filter(AttendanceRecord.session_id == s.id)
        )
        pres, face_c, qr_c = att_res.first()
        tot_face += face_c
        tot_qr += qr_c
        
        pct = (pres / len(detail.enrolled_students) * 100) if detail.enrolled_students else 0.0
        session_trend.append({
            "date": s.session_date,
            "label": s.label or s.session_code,
            "pct": pct,
            "present": pres,
            "total": len(detail.enrolled_students)
        })

    for st in detail.enrolled_students:
        if st.attendance_pct >= c.threshold_pct:
            threshold_dist["above"] += 1
        elif c.threshold_pct - 10 <= st.attendance_pct < c.threshold_pct:
            threshold_dist["approaching"] += 1
        else:
            threshold_dist["below"] += 1

    # Fake SessionSummary list for this response
    # We will just map session to simple dict to represent SessionSummary
    session_summaries = []
    for s in sessions:
        session_summaries.append(SessionSummary(
            session_id=s.id,
            course_title=c.title,
            course_code=c.code,
            label=s.label,
            session_date=s.session_date,
            total_enrolled=len(detail.enrolled_students),
            present_count=0, # skipped
            absent_count=0,  # skipped
            attendance_pct=0.0, # skipped
            face_scan_count=0, # skipped
            qr_scan_count=0, # skipped
            duration_minutes=None
        ))

    c_dict = c.__dict__.copy()
    c_dict.update({
        "programme_name": detail.programme_name,
        "programme_code": detail.programme_code,
        "lecturer_name": current_user.email,
        "enrolled_student_count": len(detail.enrolled_students),
        "session_count": len(sessions)
    })

    return {
        "course": CourseResponse(**c_dict),
        "sessions": session_summaries,
        "students": detail.enrolled_students,
        "defaulters": [
            AtRiskStudent(
                student_id=st.student_id,
                student_name=st.student_name,
                student_number=st.student_number,
                course_id=c.id,
                course_title=c.title,
                course_code=c.code,
                current_pct=st.attendance_pct,
                threshold_pct=c.threshold_pct,
                shortfall=c.threshold_pct - st.attendance_pct
            ) for st in detail.enrolled_students if st.status in ["at_risk", "defaulter"]
        ],
        "charts": {
            "session_trend": session_trend,
            "method_breakdown": {"face": tot_face, "qr": tot_qr},
            "threshold_distribution": threshold_dist
        }
    }


@router.get("/course/{course_id}/pdf", summary="Download Course PDF Report")
async def get_course_pdf(
    course_id: str,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Full attendance PDF report for this course."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    c = await db.scalar(select(Course).filter(Course.id == course_id))
    if not c or c.lecturer_id != lecturer_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    res_sess = await db.execute(select(Session).filter(Session.course_id == c.id).order_by(Session.session_date.asc()))
    sessions = res_sess.scalars().all()

    res_stu = await db.execute(select(Student).join(StudentCourse, Student.id == StudentCourse.student_id).filter(StudentCourse.course_id == c.id, StudentCourse.is_active == True))
    students = res_stu.scalars().all()

    res_att = await db.execute(select(AttendanceRecord).filter(AttendanceRecord.session_id.in_([s.id for s in sessions])))
    att_records = res_att.scalars().all()

    pdf_bytes = ReportService.generate_course_attendance_pdf(c, sessions, students, att_records)

    import io
    buffer = io.BytesIO(pdf_bytes)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={c.code}_attendance_report.pdf"}
    )


@router.get("/course/{course_id}/excel", summary="Download Course Excel Report")
async def get_course_excel(
    course_id: str,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Full attendance Excel report for this course."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    c = await db.scalar(select(Course).filter(Course.id == course_id))
    if not c or c.lecturer_id != lecturer_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    res_sess = await db.execute(select(Session).filter(Session.course_id == c.id).order_by(Session.session_date.asc()))
    sessions = res_sess.scalars().all()

    res_stu = await db.execute(select(Student).join(StudentCourse, Student.id == StudentCourse.student_id).filter(StudentCourse.course_id == c.id, StudentCourse.is_active == True))
    students = res_stu.scalars().all()

    res_att = await db.execute(select(AttendanceRecord).filter(AttendanceRecord.session_id.in_([s.id for s in sessions])))
    att_records = res_att.scalars().all()

    excel_bytes = ReportService.generate_course_attendance_excel(c, sessions, students, att_records)

    import io
    buffer = io.BytesIO(excel_bytes)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={c.code}_attendance_report.xlsx"}
    )


@router.get("/defaulters", summary="Get Defaulters")
async def get_defaulters(
    course_id: Optional[str] = None,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """All defaulting students across all lecturer's courses."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    query = select(Course).filter(Course.lecturer_id == lecturer_id, Course.is_active == True)
    if course_id:
        query = query.filter(Course.id == course_id)
        
    res = await db.execute(query)
    courses = res.scalars().all()

    defaulters = []
    
    from app.routers.lecturer.courses import get_course_detail
    for c in courses:
        detail = await get_course_detail(str(c.id), current_user, db)
        for st in detail.enrolled_students:
            if st.status in ["at_risk", "defaulter"]:
                defaulters.append(AtRiskStudent(
                    student_id=st.student_id,
                    student_name=st.student_name,
                    student_number=st.student_number,
                    course_id=c.id,
                    course_title=c.title,
                    course_code=c.code,
                    current_pct=st.attendance_pct,
                    threshold_pct=c.threshold_pct,
                    shortfall=c.threshold_pct - st.attendance_pct
                ))

    defaulters.sort(key=lambda x: x.current_pct)
    return {"defaulters": defaulters, "total": len(defaulters)}


@router.get("/student/{student_id}/course/{course_id}", summary="Student Course Report")
async def get_student_course_report(
    student_id: str,
    course_id: str,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Individual student attendance for a specific course."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    c = await db.scalar(select(Course).filter(Course.id == course_id))
    if not c or c.lecturer_id != lecturer_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    st_row = await db.execute(select(Student, User.email).join(User, Student.user_id == User.id).filter(Student.id == student_id))
    row = st_row.first()
    if not row:
        raise HTTPException(status_code=404, detail="Student not found")
    st, email = row

    sc = await db.scalar(select(StudentCourse).filter(StudentCourse.student_id == student_id, StudentCourse.course_id == c.id, StudentCourse.is_active == True))
    if not sc:
        raise HTTPException(status_code=400, detail="Student not enrolled in course")

    from app.routers.lecturer.courses import get_student_course_attendance
    att_list = await get_student_course_attendance(course_id, student_id, current_user, db)

    st_dict = st.__dict__.copy()
    st_dict.update({
        "email": email,
        "department_name": "Unknown",
        "programme_name": "Unknown",
        "invitation_status": "accepted"
    })

    c_dict = c.__dict__.copy()
    c_dict.update({
        "programme_name": "Unknown",
        "programme_code": "Unknown",
        "lecturer_name": current_user.email,
        "enrolled_student_count": 0,
        "session_count": len(att_list.records)
    })

    summary = CourseAttendanceSummary(
        course_id=c.id,
        course_title=c.title,
        course_code=c.code,
        sessions_present=att_list.present_count,
        sessions_total=att_list.total,
        attendance_pct=att_list.attendance_pct,
        threshold_pct=c.threshold_pct,
        status="at_risk" if att_list.attendance_pct < c.threshold_pct else "good"
    )

    return {
        "student": StudentResponse(**st_dict),
        "course": CourseResponse(**c_dict),
        "attendance_records": att_list.records,
        "summary": summary
    }


@router.post("/send-warning/{student_id}/course/{course_id}", summary="Send Report Warning")
async def send_report_warning(
    student_id: str,
    course_id: str,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Send attendance warning email to a student (report context)."""
    # Reuse the courses router endpoint
    from app.routers.lecturer.courses import send_warning_email
    return await send_warning_email(course_id, student_id, current_user, db)
