"""
app/celery_app.py

Celery application factory.

This module is the single entry-point for all Celery workers and Celery Beat.
Import ``celery_app`` wherever you need to define or send tasks.

Worker launch (run from the project root):
    celery -A app.celery_app worker --loglevel=info --concurrency=4 --pool=prefork

Celery Beat (periodic tasks) launch:
    celery -A app.celery_app beat --loglevel=info

Flower monitoring dashboard:
    celery -A app.celery_app flower --port=5555
"""
from celery import Celery
from celery.schedules import crontab

from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "smart_attendance",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    # Auto-discover tasks in any tasks/ package under app/
    include=[
        "app.tasks.face_tasks",
        "app.tasks.email_tasks",
        "app.tasks.scheduled_tasks",
    ],
)

# ─── Serialisation ────────────────────────────────────────────────────────────
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    # Retry failed tasks with exponential back-off
    task_acks_late=True,          # only ack after task completes (safer)
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1, # fair dispatch — prevents one worker hoarding tasks
    # Result expiry (keep results for 1 hour for polling / debugging)
    result_expires=3600,
)

# ─── Celery Beat periodic schedule ────────────────────────────────────────────
# These replace the asyncio.create_task() background schedulers that previously
# ran inside the web process (which caused duplicate execution under multiple
# Uvicorn workers and made the web process responsible for scheduled work).
celery_app.conf.beat_schedule = {
    # Daily absence scanner — runs at 2:00 AM UTC
    "daily-absence-scanner": {
        "task": "app.tasks.scheduled_tasks.run_daily_absence_scanner",
        "schedule": crontab(hour=2, minute=0),
    },
    # Hourly session checker — runs at the top of every hour
    "hourly-session-checker": {
        "task": "app.tasks.scheduled_tasks.run_hourly_session_check",
        "schedule": crontab(minute=0),
    },
    # Weekly reports — runs every Monday at 8:00 AM UTC
    "weekly-reports": {
        "task": "app.tasks.scheduled_tasks.run_scheduled_reports",
        "schedule": crontab(day_of_week="monday", hour=8, minute=0),
    },
    # Cleanup expired QR codes — runs every hour at :30
    "cleanup-expired-qr": {
        "task": "app.tasks.scheduled_tasks.run_cleanup_tasks",
        "schedule": crontab(minute=30),
    },
}
