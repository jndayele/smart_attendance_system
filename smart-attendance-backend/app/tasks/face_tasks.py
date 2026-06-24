"""
app/tasks/face_tasks.py

Celery tasks for CPU-intensive face recognition work.

Why offload to Celery?
----------------------
DeepFace.represent() / extract_faces() are CPU-bound operations that take
1–4 seconds each. Running them inside the FastAPI async event loop blocks all
other coroutines for the full duration.  By dispatching them to a dedicated
Celery worker process (prefork pool), the web workers stay free to handle
hundreds of concurrent HTTP requests while face inference happens in parallel
on a separate process pool.

Flow for attendance mark via face:
  1. FastAPI route validates QR/session, gets student from DB.
  2. Route calls verify_face_async.delay(image_b64, student_id, session_id)
     and returns 202 Accepted + task_id to the frontend.
  3. This worker runs DeepFace inference (~1–4 s).
  4. On success → attendance record written, Socket.IO event fired.
  5. Frontend polls /tasks/{task_id}/status  OR  listens for the socket event.
"""
import base64
import logging
import uuid as _uuid
from datetime import datetime

from celery import shared_task

logger = logging.getLogger(__name__)


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
    import asyncio
    import base64 as _b64

    # ─── Imports inside task to avoid circular import at module load time ────
    from app.services.face_service import FaceService
    from app.database import AsyncSessionLocal
    from app.models.student import Student
    from app.models.session import Session
    from app.models.course import Course
    from app.models.attendance import AttendanceRecord, AttendanceMethodEnum, AttendanceStatusEnum
    from app.models.notification import Notification, AuditLog
    from sqlalchemy.future import select
    from sqlalchemy.dialects.postgresql import insert as pg_insert

    image_bytes = _b64.b64decode(image_b64)

    try:
        # Step 1: Validate image & run face inference (synchronous — we're in a worker process)
        val_res = FaceService.validate_photo_requirements(image_bytes)
        if not val_res["valid"]:
            return {"verified": False, "error": val_res["error"], "attendance_id": None}

        # Step 2: DB fetch student + session (run in a new event loop on the worker)
        async def _db_ops():
            async with AsyncSessionLocal() as db:
                res_s = await db.execute(select(Student).where(Student.id == student_id))
                student = res_s.scalars().first()
                if not student or not student.face_registered or student.face_encoding is None:
                    return None, None, None, "Face not registered."

                res_sess = await db.execute(
                    select(Session, Course)
                    .join(Course, Session.course_id == Course.id)
                    .where(Session.id == session_id)
                )
                row = res_sess.first()
                if not row:
                    return None, None, None, "Session not found."

                session, course = row
                if not session.is_active or session.is_locked:
                    return None, None, None, "Session has ended."

                return student, session, course, None

        student, session, course, err = asyncio.run(_db_ops())
        if err:
            return {"verified": False, "error": err, "attendance_id": None}

        # Step 3: Face verification (synchronous, CPU-bound — OK in worker process)
        match_res = FaceService.verify_face_from_encoding(image_bytes, student.face_encoding)

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

        # Step 4: Atomic attendance insert + notifications
        async def _write_attendance():
            async with AsyncSessionLocal() as db:
                now = datetime.utcnow()
                new_id = _uuid.uuid4()

                insert_stmt = (
                    pg_insert(AttendanceRecord)
                    .values(
                        id=new_id,
                        session_id=session.id,
                        student_id=student.id,
                        checked_in_at=now,
                        method=AttendanceMethodEnum("face"),
                        status=AttendanceStatusEnum("present"),
                        is_manual_override=False,
                        created_at=now,
                    )
                    .on_conflict_do_nothing(constraint="uq_session_student")
                )
                res = await db.execute(insert_stmt)
                if res.rowcount == 0:
                    return None, "Attendance already marked."

                notif = Notification(
                    id=_uuid.uuid4(),
                    user_id=student.user_id,
                    type="attendance_marked",
                    title="Attendance Confirmed",
                    message=f"You are marked Present for {course.title} via Face Scan.",
                    is_read=False,
                    created_at=now,
                )
                db.add(notif)
                await db.commit()
                return str(new_id), None

        attendance_id, write_err = asyncio.run(_write_attendance())
        if write_err:
            return {"verified": True, "error": write_err, "attendance_id": None}

        # Step 5: Emit Socket.IO event via Redis pub/sub
        try:
            import socketio
            from app.config import get_settings
            settings = get_settings()
            mgr = socketio.RedisManager(settings.REDIS_URL, write_only=True)
            mgr.emit(
                "attendance_marked",
                {
                    "session_id": str(session.id),
                    "student_id": str(student.id),
                    "student_name": student.name,
                    "student_number": student.student_id,
                    "method": "face",
                    "checked_in_at": datetime.utcnow().isoformat(),
                },
                room=f"session_{session.id}",
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
