"""
app/tasks/face_tasks.py

Celery tasks for CPU-intensive face recognition work.

Why offload to Celery?
----------------------
DeepFace.represent() / extract_faces() are CPU-bound operations that take
1-4 seconds each. Running them inside the FastAPI async event loop blocks all
other coroutines for the full duration.  By dispatching them to a dedicated
Celery worker process (prefork pool), the web workers stay free to handle
hundreds of concurrent HTTP requests while face inference happens in parallel
on a separate process pool.

Why synchronous DB access in this file?
-----------------------------------------
Celery workers are NOT asyncio coroutines. Each task runs in a normal Python
thread/process. Using asyncpg (the async PostgreSQL driver) inside a Celery
task requires manually creating and destroying asyncio event loops via
asyncio.run(). This causes a hard-to-fix bug: asyncpg registers SSL teardown
callbacks with the event loop. When asyncio.run() finishes and closes the loop,
those callbacks fire AFTER the loop is already marked closed, producing:
  RuntimeError: Event loop is closed
The definitive solution is to use psycopg2 (the synchronous driver) for all
Celery DB work. psycopg2 has zero asyncio involvement.

Flow for attendance mark via face:
  1. FastAPI route validates session, gets student from DB.
  2. Route calls verify_face_async.delay(image_b64, student_id, session_id)
     and returns 202 Accepted + task_id to the frontend.
  3. This worker runs DeepFace inference (~1-4 s).
  4. On success -> attendance record written, Socket.IO event fired.
  5. Frontend polls /student/attendance/mark/face/status/{task_id}.
"""
import logging
import uuid as _uuid
from contextlib import contextmanager
from datetime import datetime

from celery import shared_task

logger = logging.getLogger(__name__)


def _make_sync_db():
    """
    Build a synchronous SQLAlchemy session backed by psycopg2.
    Called inside Celery task functions — no asyncio involved.
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import NullPool
    from app.config import get_settings

    settings = get_settings()
    # Convert asyncpg URL -> psycopg2 URL
    sync_url = (
        settings.DATABASE_URL
        .replace("postgresql+asyncpg://", "postgresql+psycopg2://")
        .replace("postgresql+asyncpg://", "postgresql://")   # fallback
    )
    # Ensure the scheme is correct
    if sync_url.startswith("postgresql+asyncpg://"):
        sync_url = sync_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")

    engine = create_engine(
        sync_url,
        connect_args={"sslmode": "require"},
        poolclass=NullPool,
    )
    Session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    return engine, Session


@contextmanager
def _sync_db_session():
    """Context manager: open a psycopg2-backed sync DB session, commit or rollback, dispose."""
    engine, Session = _make_sync_db()
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


@shared_task(
    bind=True,
    name="app.tasks.face_tasks.verify_face_async",
    max_retries=2,
    default_retry_delay=5,
    acks_late=True,
)
def verify_face_async(self, image_b64: str, student_id: str, session_id: str):
    """
    Celery task: verify a student's face and mark attendance if matched.

    Parameters
    ----------
    image_b64 : str
        Base64-encoded image bytes sent from the frontend.
    student_id : str
        UUID string of the Student record.
    session_id : str
        UUID string of the Session record.

    Returns
    -------
    dict
        { "verified": bool, "confidence": float, "attendance_id": str | None }
    """
    import base64 as _b64

    from app.services.face_service import FaceService
    from app.models.student import Student
    from app.models.session import Session
    from app.models.course import Course
    from app.models.attendance import AttendanceRecord, AttendanceMethodEnum, AttendanceStatusEnum
    from app.models.notification import Notification
    from sqlalchemy import select
    from sqlalchemy.dialects.postgresql import insert as pg_insert

    image_bytes = _b64.b64decode(image_b64)

    try:
        # ── Step 1: Validate image ────────────────────────────────────────────
        val_res = FaceService.validate_photo_requirements(image_bytes)
        if not val_res["valid"]:
            return {"verified": False, "error": val_res["error"], "attendance_id": None}

        # ── Step 2: Load student + session from DB (sync psycopg2) ────────────
        with _sync_db_session() as db:
            student = db.execute(
                select(Student).where(Student.id == student_id)
            ).scalars().first()

            if not student or not student.face_registered or student.face_encoding is None:
                return {"verified": False, "error": "Face not registered.", "attendance_id": None}

            row = db.execute(
                select(Session, Course)
                .join(Course, Session.course_id == Course.id)
                .where(Session.id == session_id)
            ).first()

            if not row:
                return {"verified": False, "error": "Session not found.", "attendance_id": None}

            session_obj, course = row
            if not session_obj.is_active or session_obj.is_locked:
                return {"verified": False, "error": "Session has ended.", "attendance_id": None}

            # Cache values we need after the session closes
            student_id_val = student.id
            student_user_id = student.user_id
            student_name = student.name
            student_number = student.student_id
            face_encoding = student.face_encoding
            session_id_val = session_obj.id
            course_title = course.title

        # ── Step 3: Face verification (CPU-bound, no DB needed) ───────────────
        match_res = FaceService.verify_face_from_encoding(image_bytes, face_encoding)

        if not match_res["verified"]:
            return {
                "verified": False,
                "confidence": match_res["confidence"],
                "error": (
                    f"Face verification failed. Confidence: {match_res['confidence']:.1f}%."
                    f" Required: {match_res['threshold_confidence']}%."
                ),
                "attendance_id": None,
            }

        # ── Step 4: Write attendance record (sync psycopg2) ───────────────────
        new_id = _uuid.uuid4()
        now = datetime.utcnow()
        attendance_id = None

        with _sync_db_session() as db:
            result = db.execute(
                pg_insert(AttendanceRecord)
                .values(
                    id=new_id,
                    session_id=session_id_val,
                    student_id=student_id_val,
                    checked_in_at=now,
                    method=AttendanceMethodEnum("face"),
                    status=AttendanceStatusEnum("present"),
                    is_manual_override=False,
                    created_at=now,
                )
                .on_conflict_do_nothing(constraint="uq_session_student")
            )
            if result.rowcount == 0:
                return {"verified": True, "error": "Attendance already marked.", "attendance_id": None}

            notif = Notification(
                id=_uuid.uuid4(),
                user_id=student_user_id,
                type="attendance_marked",
                title="Attendance Confirmed",
                message=f"You are marked Present for {course_title} via Face Scan.",
                is_read=False,
                created_at=now,
            )
            db.add(notif)
            attendance_id = str(new_id)

        # ── Step 5: Emit Socket.IO event via Redis pub/sub ────────────────────
        try:
            import socketio
            from app.config import get_settings
            settings = get_settings()

            redis_options = {}
            if settings.REDIS_URL and settings.REDIS_URL.startswith("rediss://"):
                redis_options["ssl_cert_reqs"] = "required"

            mgr = socketio.RedisManager(settings.REDIS_URL, write_only=True, redis_options=redis_options)
            mgr.emit(
                "attendance_marked",
                {
                    "session_id": str(session_id_val),
                    "student_id": str(student_id_val),
                    "student_name": student_name,
                    "student_number": student_number,
                    "method": "face",
                    "checked_in_at": now.isoformat(),
                },
                room=f"session_{session_id_val}",
            )
        except Exception as e:
            logger.warning(f"[FaceTask] Socket.IO emit failed (non-critical): {e}")

        return {
            "verified": True,
            "confidence": match_res["confidence"],
            "attendance_id": attendance_id,
        }

    except Exception as exc:
        logger.error(f"[FaceTask] Unexpected error: {exc}", exc_info=True)
        raise self.retry(exc=exc)


@shared_task(
    name="app.tasks.face_tasks.extract_face_encoding_async",
    max_retries=1,
    acks_late=True,
)
def extract_face_encoding_async(image_b64: str) -> list:
    """
    Celery task: extract a 512-D face embedding from a base64-encoded image.
    Used during student face registration so the web request returns instantly.
    """
    import base64 as _b64
    from app.services.face_service import FaceService

    image_bytes = _b64.b64decode(image_b64)
    return FaceService.extract_face_encoding(image_bytes)
