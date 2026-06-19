import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy.future import select
from app.database import AsyncSessionLocal
from app.models.course import Course
from app.models.lecturer import Lecturer
from app.models.user import User

from sqlalchemy import func
from app.models.student import Student
from app.models.session import Session
from app.models.attendance import AttendanceRecord
from app.models.institution import Institution
from app.services.email_service import send_weekly_summary_email, send_weekly_lecturer_summary_email

logger = logging.getLogger(__name__)

async def run_scheduled_reports():
    """Generate and email scheduled weekly reports to admins and lecturers."""
    logger.info("Starting Scheduled Reports task...")
    async with AsyncSessionLocal() as db:
        now = datetime.utcnow()
        start_of_week = now - timedelta(days=now.weekday())
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)

        # 1. Fetch admin email
        inst_res = await db.execute(select(Institution).limit(1))
        inst = inst_res.scalars().first()
        admin_email = inst.admin_email if inst else None
        
        if not admin_email:
            admin_res = await db.execute(select(User).where(User.role == "admin").limit(1))
            admin_user = admin_res.scalars().first()
            if admin_user:
                admin_email = admin_user.email

        # 2 & 3. Aggregate institution-wide stats
        total_stu_res = await db.execute(select(func.count(Student.id)))
        total_students = total_stu_res.scalar() or 0
        
        sess_week_res = await db.execute(select(func.count(Session.id)).where(Session.started_at >= start_of_week))
        total_sessions_week = sess_week_res.scalar() or 0
        
        sess_ids_res = await db.execute(select(Session.id).where(Session.started_at >= start_of_week))
        sess_ids = [r[0] for r in sess_ids_res.all()]
        
        overall_attendance_pct = 0.0
        if sess_ids:
            pres_res = await db.execute(select(func.count(AttendanceRecord.id)).where(
                AttendanceRecord.session_id.in_(sess_ids),
                AttendanceRecord.status == "present"
            ))
            total_pres = pres_res.scalar() or 0
            
            tot_rec_res = await db.execute(select(func.count(AttendanceRecord.id)).where(AttendanceRecord.session_id.in_(sess_ids)))
            total_records = tot_rec_res.scalar() or 0
            
            if total_records > 0:
                overall_attendance_pct = (total_pres / total_records) * 100

        # We need a courses list for the admin email
        courses_res_all = await db.execute(select(Course).where(Course.is_active == True))
        all_courses = courses_res_all.scalars().all()
        admin_courses_data = []
        for c in all_courses:
            c_sess_res = await db.execute(select(Session.id).where(Session.course_id == c.id, Session.started_at >= start_of_week))
            c_sess_ids = [r[0] for r in c_sess_res.all()]
            c_avg_pct = 0.0
            if c_sess_ids:
                c_pres_res = await db.execute(select(func.count(AttendanceRecord.id)).where(
                    AttendanceRecord.session_id.in_(c_sess_ids), AttendanceRecord.status == "present"
                ))
                c_pres = c_pres_res.scalar() or 0
                c_tot_res = await db.execute(select(func.count(AttendanceRecord.id)).where(AttendanceRecord.session_id.in_(c_sess_ids)))
                c_tot = c_tot_res.scalar() or 0
                if c_tot > 0:
                    c_avg_pct = (c_pres / c_tot) * 100
            admin_courses_data.append({"course_code": c.code, "attendance_rate": c_avg_pct})

        summary_data = {
            "total_students": total_students,
            "total_sessions_week": total_sessions_week,
            "overall_attendance_pct": overall_attendance_pct,
            "students_below_threshold": 0,
            "courses": admin_courses_data
        }
        
        if admin_email:
            await send_weekly_summary_email(admin_email, "Admin", summary_data)
            
        # 6. Lecturer summary email
        lec_res = await db.execute(select(Lecturer, User).join(User, Lecturer.user_id == User.id).where(Lecturer.is_suspended == False))
        lecturers = lec_res.all()
        
        for lec, user in lecturers:
            email = user.email
            prefs = user.preferences or {}
            
            if not prefs.get("weekly_summary", False):
                continue
                
            lec_courses = [c for c in all_courses if c.lecturer_id == lec.id]
            courses_summary = []
            for c in lec_courses:
                c_sess_res = await db.execute(select(Session.id).where(Session.course_id == c.id, Session.started_at >= start_of_week))
                c_sess_ids = [r[0] for r in c_sess_res.all()]
                c_avg_pct = 0.0
                if c_sess_ids:
                    c_pres_res = await db.execute(select(func.count(AttendanceRecord.id)).where(
                        AttendanceRecord.session_id.in_(c_sess_ids), AttendanceRecord.status == "present"
                    ))
                    c_pres = c_pres_res.scalar() or 0
                    c_tot_res = await db.execute(select(func.count(AttendanceRecord.id)).where(AttendanceRecord.session_id.in_(c_sess_ids)))
                    c_tot = c_tot_res.scalar() or 0
                    if c_tot > 0:
                        c_avg_pct = (c_pres / c_tot) * 100
                        
                courses_summary.append({
                    "course_code": c.code,
                    "sessions_this_week": len(c_sess_ids),
                    "avg_attendance_pct": c_avg_pct,
                    "at_risk_count": 0
                })
                
            if email and courses_summary:
                await send_weekly_lecturer_summary_email(email, lec.name, courses_summary)
                
        logger.info("Scheduled Reports completed.")

async def start_report_scheduler():
    """Weekly background scheduler."""
    while True:
        try:
            await run_scheduled_reports()
        except Exception as e:
            logger.error(f"Error in report scheduler: {e}")
        # Run once a week
        await asyncio.sleep(604800)
