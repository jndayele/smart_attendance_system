"""
app/tasks/scheduled_tasks.py

Celery periodic tasks (replaces asyncio.create_task() schedulers in main.py).

Why Celery Beat instead of asyncio background tasks?
-----------------------------------------------------
The previous approach ran four asyncio tasks inside the FastAPI process.  This
caused three problems:

1. Duplicate execution: with 4 Uvicorn workers, every scheduler fired 4 times -
   4x emails, 4x notifications, race conditions on QR cleanup.

2. No isolation: a crash in the web process also killed all scheduled work.

3. No recovery: if the server restarted mid-task, the job was silently lost.

Celery Beat is a dedicated scheduler daemon that dispatches tasks to worker
processes.  One beat instance runs per deployment.  Workers are independently
scalable and crash-restartable.

Why synchronous DB access here?
---------------------------------
Same reason as face_tasks.py: Celery workers run in plain Python processes, not
asyncio coroutines. Using asyncpg (async driver) inside asyncio.run() causes
SSL teardown errors ("Event loop is closed"). psycopg2 (sync driver) has no
asyncio involvement at all, so it works cleanly.

Schedule is defined in app/celery_app.py.
"""
import logging
from contextlib import contextmanager

from celery import shared_task

logger = logging.getLogger(__name__)


def _make_sync_engine():
    """Build a synchronous psycopg2-backed SQLAlchemy engine (NullPool, no caching)."""
    from sqlalchemy import create_engine
    from sqlalchemy.pool import NullPool
    from app.config import get_settings

    url = get_settings().DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
    return create_engine(url, connect_args={"sslmode": "require"}, poolclass=NullPool)


@contextmanager
def _sync_session():
    """Open a psycopg2 sync session, commit on success, rollback on error, always dispose."""
    from sqlalchemy.orm import sessionmaker

    engine = _make_sync_engine()
    Session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = Session()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
        engine.dispose()


@shared_task(name="app.tasks.scheduled_tasks.run_daily_absence_scanner", acks_late=True)
def run_daily_absence_scanner():
    """Daily job: scan for students below attendance threshold and send alerts."""
    from sqlalchemy import select
    from app.models.course import Course
    from app.models.student import StudentCourse
    from app.models.student import Student
    from app.models.session import Session
    from app.models.attendance import AttendanceRecord
    from app.services.notification_service import NotificationService
    import asyncio

    logger.info("[Beat] Starting Daily Absence Scanner...")

    with _sync_session() as db:
        courses = db.execute(select(Course).filter(Course.is_active == True)).scalars().all()
        for c in courses:
            student_ids = [
                r[0] for r in db.execute(
                    select(StudentCourse.student_id).filter(
                        StudentCourse.course_id == c.id,
                        StudentCourse.is_active == True,
                    )
                ).all()
            ]
            for sid in student_ids:
                try:
                    # NotificationService.check_and_send_threshold_alerts is async;
                    # run it in a temporary loop (it only does read + email, no asyncpg)
                    asyncio.run(
                        NotificationService.check_and_send_threshold_alerts(sid, c.id, db)
                    )
                except Exception as e:
                    logger.error(f"[Beat] Threshold alert failed for student {sid}: {e}")

    logger.info("[Beat] Daily Absence Scanner completed.")


@shared_task(name="app.tasks.scheduled_tasks.run_hourly_session_check", acks_late=True)
def run_hourly_session_check():
    """Hourly job: find sessions open > 2 hours and notify the lecturer."""
    from app.services.notification_service import NotificationService
    import asyncio

    logger.info("[Beat] Starting Hourly Session Checker...")

    with _sync_session() as db:
        asyncio.run(NotificationService.notify_session_not_closed(db))

    logger.info("[Beat] Hourly Session Checker completed.")


@shared_task(name="app.tasks.scheduled_tasks.run_scheduled_reports", acks_late=True)
def run_scheduled_reports():
    """Weekly job: generate and email weekly summary reports."""
    from datetime import datetime, timedelta
    from sqlalchemy import select, func, case
    from app.models.institution import Institution
    from app.models.user import User
    from app.models.course import Course
    from app.models.session import Session
    from app.models.attendance import AttendanceRecord
    from app.models.lecturer import Lecturer
    from app.services.email_service import send_weekly_summary_email, send_weekly_lecturer_summary_email
    import asyncio

    logger.info("[Beat] Starting Scheduled Reports task...")

    with _sync_session() as db:
        now = datetime.utcnow()
        start_of_week = (now - timedelta(days=now.weekday())).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        inst = db.execute(select(Institution).limit(1)).scalars().first()
        admin_email = inst.admin_email if inst else None
        if not admin_email:
            admin_user = db.execute(select(User).where(User.role == "admin").limit(1)).scalars().first()
            if admin_user:
                admin_email = admin_user.email

        total_students = db.execute(select(func.count(User.id))).scalar() or 0

        sess_ids = [
            r[0] for r in db.execute(
                select(Session.id).where(Session.started_at >= start_of_week)
            ).all()
        ]

        overall_pct = 0.0
        if sess_ids:
            total_pres = db.execute(
                select(func.count(AttendanceRecord.id)).where(
                    AttendanceRecord.session_id.in_(sess_ids),
                    AttendanceRecord.status == "present",
                )
            ).scalar() or 0
            total_recs = db.execute(
                select(func.count(AttendanceRecord.id)).where(
                    AttendanceRecord.session_id.in_(sess_ids)
                )
            ).scalar() or 1
            overall_pct = (total_pres / total_recs) * 100

        all_courses = db.execute(select(Course).where(Course.is_active == True)).scalars().all()

        course_stats_rows = db.execute(
            select(
                Session.course_id,
                func.count(AttendanceRecord.id).label("total"),
                func.sum(case((AttendanceRecord.status == "present", 1), else_=0)).label("present"),
            )
            .join(AttendanceRecord, Session.id == AttendanceRecord.session_id, isouter=True)
            .where(Session.started_at >= start_of_week)
            .group_by(Session.course_id)
        ).all()
        course_stats = {r.course_id: r for r in course_stats_rows}

        admin_courses_data = []
        for c in all_courses:
            stat = course_stats.get(c.id)
            avg_pct = ((stat.present or 0) / stat.total * 100) if stat and stat.total else 0.0
            admin_courses_data.append({"course_code": c.code, "attendance_rate": avg_pct})

        summary_data = {
            "total_students": total_students,
            "total_sessions_week": len(sess_ids),
            "overall_attendance_pct": overall_pct,
            "students_below_threshold": 0,
            "courses": admin_courses_data,
        }

        if admin_email:
            asyncio.run(send_weekly_summary_email(admin_email, "Admin", summary_data))

        lecturers = db.execute(
            select(Lecturer, User).join(User, Lecturer.user_id == User.id)
            .where(Lecturer.is_suspended == False)
        ).all()

        for lec, user in lecturers:
            prefs = user.preferences or {}
            if not prefs.get("weekly_summary", False):
                continue
            lec_courses = [c for c in all_courses if c.lecturer_id == lec.id]
            courses_summary = []
            for c in lec_courses:
                stat = course_stats.get(c.id)
                avg_pct = ((stat.present or 0) / stat.total * 100) if stat and stat.total else 0.0
                courses_summary.append({
                    "course_code": c.code,
                    "sessions_this_week": stat.total if stat else 0,
                    "avg_attendance_pct": avg_pct,
                    "at_risk_count": 0,
                })
            if user.email and courses_summary:
                asyncio.run(send_weekly_lecturer_summary_email(user.email, lec.name, courses_summary))

    logger.info("[Beat] Scheduled Reports completed.")


@shared_task(name="app.tasks.scheduled_tasks.run_cleanup_tasks", acks_late=True)
def run_cleanup_tasks():
    """Hourly job: clear expired QR tokens and stale session code attempts."""
    from datetime import datetime
    from sqlalchemy import update
    from app.models.session import Session

    logger.info("[Beat] Starting Cleanup Task...")

    with _sync_session() as db:
        now = datetime.utcnow()
        db.execute(
            update(Session)
            .where(Session.qr_expires_at != None, Session.qr_expires_at < now)
            .values(qr_token=None, qr_expires_at=None)
        )

    logger.info("[Beat] Cleanup Task completed.")
