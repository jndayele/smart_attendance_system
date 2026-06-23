"""
app/tasks/scheduled_tasks.py

Celery periodic tasks (replaces asyncio.create_task() schedulers in main.py).

Why Celery Beat instead of asyncio background tasks?
-----------------------------------------------------
The previous approach ran four asyncio tasks inside the FastAPI process.  This
caused three problems:

1. Duplicate execution: with 4 Uvicorn workers, every scheduler fired 4 times —
   4× emails, 4× notifications, race conditions on QR cleanup.

2. No isolation: a crash in the web process also killed all scheduled work.

3. No recovery: if the server restarted mid-task, the job was silently lost.

Celery Beat is a dedicated scheduler daemon that dispatches tasks to worker
processes.  One beat instance runs per deployment.  Workers are independently
scalable and crash-restartable.

Schedule is defined in app/celery_app.py.
"""
import asyncio
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


def _run(coro):
    """Run an async coroutine synchronously inside a Celery worker."""
    return asyncio.run(coro)


@shared_task(name="app.tasks.scheduled_tasks.run_daily_absence_scanner", acks_late=True)
def run_daily_absence_scanner():
    """Daily job: scan for students below attendance threshold and send alerts."""
    from app.database import AsyncSessionLocal
    from app.models.course import Course
    from app.models.student import StudentCourse
    from app.services.notification_service import NotificationService
    from sqlalchemy.future import select

    async def _inner():
        logger.info("[Beat] Starting Daily Absence Scanner...")
        async with AsyncSessionLocal() as db:
            res_courses = await db.execute(select(Course).filter(Course.is_active == True))
            courses = res_courses.scalars().all()

            for c in courses:
                res_sc = await db.execute(
                    select(StudentCourse.student_id).filter(
                        StudentCourse.course_id == c.id,
                        StudentCourse.is_active == True,
                    )
                )
                student_ids = [r[0] for r in res_sc.all()]
                for sid in student_ids:
                    try:
                        await NotificationService.check_and_send_threshold_alerts(sid, c.id, db)
                    except Exception as e:
                        logger.error(f"[Beat] Threshold alert failed for student {sid}: {e}")

        logger.info("[Beat] Daily Absence Scanner completed.")

    _run(_inner())


@shared_task(name="app.tasks.scheduled_tasks.run_hourly_session_check", acks_late=True)
def run_hourly_session_check():
    """Hourly job: find sessions open > 2 hours and notify the lecturer."""
    from app.database import AsyncSessionLocal
    from app.services.notification_service import NotificationService

    async def _inner():
        logger.info("[Beat] Starting Hourly Session Checker...")
        async with AsyncSessionLocal() as db:
            await NotificationService.notify_session_not_closed(db)
        logger.info("[Beat] Hourly Session Checker completed.")

    _run(_inner())


@shared_task(name="app.tasks.scheduled_tasks.run_scheduled_reports", acks_late=True)
def run_scheduled_reports():
    """Weekly job: generate and email weekly summary reports."""
    from app.database import AsyncSessionLocal
    from sqlalchemy.future import select
    from sqlalchemy import func
    from datetime import datetime, timedelta
    from app.models.institution import Institution
    from app.models.user import User
    from app.models.course import Course
    from app.models.session import Session
    from app.models.attendance import AttendanceRecord
    from app.models.lecturer import Lecturer
    from app.services.email_service import send_weekly_summary_email, send_weekly_lecturer_summary_email

    async def _inner():
        logger.info("[Beat] Starting Scheduled Reports task...")
        async with AsyncSessionLocal() as db:
            now = datetime.utcnow()
            start_of_week = (now - timedelta(days=now.weekday())).replace(
                hour=0, minute=0, second=0, microsecond=0
            )

            inst_res = await db.execute(select(Institution).limit(1))
            inst = inst_res.scalars().first()
            admin_email = inst.admin_email if inst else None

            if not admin_email:
                admin_res = await db.execute(select(User).where(User.role == "admin").limit(1))
                admin_user = admin_res.scalars().first()
                if admin_user:
                    admin_email = admin_user.email

            # Institution-wide stats (2 aggregation queries instead of N+1)
            total_stu_res = await db.execute(select(func.count(User.id)))
            total_students = total_stu_res.scalar() or 0

            sess_ids_res = await db.execute(
                select(Session.id).where(Session.started_at >= start_of_week)
            )
            sess_ids = [r[0] for r in sess_ids_res.all()]

            overall_pct = 0.0
            if sess_ids:
                pres_res = await db.execute(
                    select(func.count(AttendanceRecord.id)).where(
                        AttendanceRecord.session_id.in_(sess_ids),
                        AttendanceRecord.status == "present",
                    )
                )
                tot_res = await db.execute(
                    select(func.count(AttendanceRecord.id)).where(
                        AttendanceRecord.session_id.in_(sess_ids)
                    )
                )
                total_pres = pres_res.scalar() or 0
                total_recs = tot_res.scalar() or 1
                overall_pct = (total_pres / total_recs) * 100

            courses_res = await db.execute(select(Course).where(Course.is_active == True))
            all_courses = courses_res.scalars().all()

            # Batch per-course stats using a single GROUP BY query
            from sqlalchemy import case
            course_stats_res = await db.execute(
                select(
                    Session.course_id,
                    func.count(AttendanceRecord.id).label("total"),
                    func.sum(
                        case((AttendanceRecord.status == "present", 1), else_=0)
                    ).label("present"),
                )
                .join(AttendanceRecord, Session.id == AttendanceRecord.session_id, isouter=True)
                .where(Session.started_at >= start_of_week)
                .group_by(Session.course_id)
            )
            course_stats = {r.course_id: r for r in course_stats_res.all()}

            admin_courses_data = []
            for c in all_courses:
                stat = course_stats.get(c.id)
                avg_pct = 0.0
                if stat and stat.total:
                    avg_pct = ((stat.present or 0) / stat.total) * 100
                admin_courses_data.append({"course_code": c.code, "attendance_rate": avg_pct})

            summary_data = {
                "total_students": total_students,
                "total_sessions_week": len(sess_ids),
                "overall_attendance_pct": overall_pct,
                "students_below_threshold": 0,
                "courses": admin_courses_data,
            }

            if admin_email:
                await send_weekly_summary_email(admin_email, "Admin", summary_data)

            # Per-lecturer summaries
            lec_res = await db.execute(
                select(Lecturer, User).join(User, Lecturer.user_id == User.id)
                .where(Lecturer.is_suspended == False)
            )
            for lec, user in lec_res.all():
                prefs = user.preferences or {}
                if not prefs.get("weekly_summary", False):
                    continue
                lec_courses = [c for c in all_courses if c.lecturer_id == lec.id]
                courses_summary = []
                for c in lec_courses:
                    stat = course_stats.get(c.id)
                    avg_pct = 0.0
                    if stat and stat.total:
                        avg_pct = ((stat.present or 0) / stat.total) * 100
                    courses_summary.append({
                        "course_code": c.code,
                        "sessions_this_week": stat.total if stat else 0,
                        "avg_attendance_pct": avg_pct,
                        "at_risk_count": 0,
                    })
                if user.email and courses_summary:
                    await send_weekly_lecturer_summary_email(user.email, lec.name, courses_summary)

        logger.info("[Beat] Scheduled Reports completed.")

    _run(_inner())


@shared_task(name="app.tasks.scheduled_tasks.run_cleanup_tasks", acks_late=True)
def run_cleanup_tasks():
    """Hourly job: clear expired QR tokens and stale session code attempts."""
    from app.database import AsyncSessionLocal
    from app.models.session import Session
    from sqlalchemy import update
    from datetime import datetime

    async def _inner():
        logger.info("[Beat] Starting Cleanup Task...")
        async with AsyncSessionLocal() as db:
            now = datetime.utcnow()
            await db.execute(
                update(Session)
                .where(Session.qr_expires_at != None, Session.qr_expires_at < now)
                .values(qr_token=None, qr_expires_at=None)
            )
            await db.commit()
        logger.info("[Beat] Cleanup Task completed.")

    _run(_inner())
