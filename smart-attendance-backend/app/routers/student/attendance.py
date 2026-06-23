"""
Student Attendance Router.

Handles the 5-step attendance marking flow with anti-cheat measures.
"""
import json
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Query, Form
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
import base64
from fastapi_limiter.depends import RateLimiter

from app.database import get_db
from app.dependencies import require_student
from app.models.user import User
from app.models.student import Student, StudentCourse
from app.models.course import Course
from app.models.programme import Programme
from app.models.session import Session
from app.models.attendance import AttendanceRecord, AttendanceMethodEnum, AttendanceStatusEnum
from app.models.session_code_attempt import SessionCodeAttempt
from app.models.lecturer import Lecturer
from app.socket_manager import sio_server
from app.schemas.student_portal import (
    SessionCodeVerifyRequest,
    SessionCodeVerifyResponse,
    QRScanAttendanceRequest,
    AttendanceMarkResponse,
    StudentAttendanceHistoryResponse,
    AttendanceTrendPoint
)
from app.schemas.attendance import AttendanceRecordResponse, AttendanceListResponse
from app.services.face_service import FaceService
from app.services.notification_service import NotificationService
from app.config import get_settings

router = APIRouter(dependencies=[Depends(require_student)])
logger = logging.getLogger(__name__)
settings = get_settings()


async def get_student(user_id, db: AsyncSession):
    res = await db.execute(select(Student).filter(Student.user_id == user_id))
    s = res.scalars().first()
    if not s:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return s


@router.post("/verify-code", response_model=SessionCodeVerifyResponse, summary="Step 2: Verify Session Code")
async def verify_code(
    req: SessionCodeVerifyRequest,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    student = await get_student(current_user.id, db)

    res = await db.execute(select(Session, Course).join(Course, Session.course_id == Course.id).filter(Session.id == req.session_id))
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found.")
    session, course = row

    if not session.is_active or session.is_locked:
        raise HTTPException(status_code=400, detail="This session has already ended.")

    # Find or create attempt record (with FOR UPDATE lock)
    res_att = await db.execute(
        select(SessionCodeAttempt)
        .filter(SessionCodeAttempt.session_id == session.id, SessionCodeAttempt.student_id == student.id)
        .with_for_update()
    )
    attempt = res_att.scalars().first()
    if not attempt:
        attempt = SessionCodeAttempt(session_id=session.id, student_id=student.id)
        db.add(attempt)
        await db.commit()
        await db.refresh(attempt)

    if attempt.is_locked:
        return SessionCodeVerifyResponse(
            verified=False, session_id=session.id, course_title=course.title, course_code=course.code,
            attempts_remaining=0, locked_out=True, message="You have been locked out of this session due to too many incorrect attempts."
        )

    # Enrolled check
    res_enr = await db.execute(select(StudentCourse).filter(StudentCourse.student_id == student.id, StudentCourse.course_id == course.id, StudentCourse.is_active == True))
    if not res_enr.scalars().first():
        raise HTTPException(status_code=400, detail="You are not enrolled in the course for this session.")

    # Duplicate check
    res_dup = await db.execute(select(AttendanceRecord).filter(AttendanceRecord.session_id == session.id, AttendanceRecord.student_id == student.id, AttendanceRecord.status == "present"))
    if res_dup.scalars().first():
        return SessionCodeVerifyResponse(
            verified=True, session_id=session.id, course_title=course.title, course_code=course.code,
            attempts_remaining=3 - attempt.attempts, locked_out=False, message="You have already marked attendance for this session."
        )

    max_attempts = 3
    
    if req.code.upper() != session.session_code.upper():
        attempt.attempts += 1
        rem = max_attempts - attempt.attempts
        if rem <= 0:
            attempt.is_locked = True
            attempt.locked_at = datetime.utcnow()
            await db.commit()
            return SessionCodeVerifyResponse(
                verified=False, session_id=session.id, course_title=course.title, course_code=course.code,
                attempts_remaining=0, locked_out=True, message="You have been locked out of this session. 3 incorrect attempts."
            )
        await db.commit()
        return SessionCodeVerifyResponse(
            verified=False, session_id=session.id, course_title=course.title, course_code=course.code,
            attempts_remaining=rem, locked_out=False, message=f"Incorrect code. {rem} attempt(s) remaining."
        )

    # FIX-P0-5: Set verified = True on successful code verification
    attempt.verified = True
    await db.commit()
    return SessionCodeVerifyResponse(
        verified=True, session_id=session.id, course_title=course.title, course_code=course.code,
        attempts_remaining=max_attempts - attempt.attempts, locked_out=False, message="Code verified."
    )


async def _mark_attendance(db: AsyncSession, student, session, course, method: str):
    """
    Atomically mark attendance using INSERT ... ON CONFLICT DO NOTHING.
    This eliminates the race condition where two concurrent requests both pass
    the duplicate check and then both insert, causing an IntegrityError.
    All DB writes (attendance + notification + audit log) are batched into
    a single transaction with one round-trip commit.
    """
    import uuid as _uuid
    from app.models.notification import Notification, AuditLog

    now = datetime.utcnow()

    # ── Step 1: Atomic upsert — race-condition safe ─────────────────────────────
    insert_stmt = (
        pg_insert(AttendanceRecord)
        .values(
            id=_uuid.uuid4(),
            session_id=session.id,
            student_id=student.id,
            checked_in_at=now,
            method=AttendanceMethodEnum(method),
            status=AttendanceStatusEnum("present"),
            is_manual_override=False,
            created_at=now,
        )
        .on_conflict_do_nothing(constraint="uq_session_student")
    )
    result = await db.execute(insert_stmt)

    if result.rowcount == 0:
        # Another concurrent request already inserted this record
        raise HTTPException(status_code=400, detail="Attendance already marked for this session.")

    # ── Step 2: Compute attendance % (read-only, no extra commit needed) ───
    pct = await NotificationService.compute_attendance_pct(student.id, course.id, db)
    status_label = "good" if pct >= course.threshold_pct else "at_risk"

    # ── Step 3: Batch all write objects in this same transaction ──────────
    # In-app attendance confirmation notification
    notif = Notification(
        id=_uuid.uuid4(),
        user_id=student.user_id,
        type="attendance_marked",
        title="Attendance Confirmed",
        message=(
            f"You are marked Present for {course.title} via "
            f"{'Face Scan' if method == 'face' else 'QR Code'}. "
            f"Attendance: {pct:.1f}%"
        ),
        is_read=False,
        created_at=now,
    )
    db.add(notif)

    # Audit log
    import json as _json
    audit = AuditLog(
        id=_uuid.uuid4(),
        performed_by=student.user_id,
        action=f"attendance_marked_{method}",
        entity_type="session",
        entity_id=session.id,
        details=_json.dumps({
            "course": course.code,
            "session": str(session.id),
            "student": str(student.id),
        }),
        ip_address=None,
        created_at=now,
    )
    db.add(audit)

    # ONE commit for everything above ────────────────────────────────
    await db.commit()

    # ── Step 4: Background concerns (threshold alerts, socket events) ────
    # Threshold alert check (non-blocking; runs after the commit)
    try:
        await NotificationService.check_and_send_threshold_alerts(student.id, course.id, db)
    except Exception as e:
        logger.warning(f"Threshold alert failed (non-critical): {e}")

    # Socket.IO events — emit to session room and global feed
    await sio_server.emit(
        "attendance_marked",
        {
            "session_id": str(session.id),
            "student_id": str(student.id),
            "student_name": student.name,
            "student_number": student.student_id,
            "method": method,
            "checked_in_at": now.isoformat(),
        },
        room=f"session_{session.id}",
    )

    await sio_server.emit(
        "global_update",
        {
            "type": "attendance_marked",
            "student_id": str(student.id),
            "message": f"Attendance marked for {student.name}",
        },
    )

    return AttendanceMarkResponse(
        success=True,
        status="present",
        message="Attendance marked successfully.",
        method=method,
        checked_in_at=now,
        course_title=course.title,
        course_code=course.code,
        session_label=session.label or session.session_code,
        updated_attendance_pct=pct,
        updated_status=status_label,
    )



@router.post("/mark/face", summary="Step 4A: Face Scan (Async)", dependencies=[Depends(RateLimiter(times=3, seconds=60))])
async def mark_face(
    session_id: str = Form(...),
    face_image: UploadFile = File(...),
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    student = await get_student(current_user.id, db)

    res = await db.execute(select(Session, Course).join(Course, Session.course_id == Course.id).filter(Session.id == session_id))
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found.")
    session, course = row

    if not session.is_active or session.is_locked:
        raise HTTPException(status_code=400, detail="Session has ended.")

    res_enr = await db.execute(select(StudentCourse).filter(StudentCourse.student_id == student.id, StudentCourse.course_id == course.id, StudentCourse.is_active == True))
    if not res_enr.scalars().first():
        raise HTTPException(status_code=403, detail="Not enrolled in this course.")

    res_dup = await db.execute(select(AttendanceRecord).filter(AttendanceRecord.session_id == session.id, AttendanceRecord.student_id == student.id, AttendanceRecord.status == "present"))
    if res_dup.scalars().first():
        raise HTTPException(status_code=400, detail="You have already marked attendance for this session.")

    # FIX-P0-5: Enforce verified=True check for face scan
    res_att = await db.execute(select(SessionCodeAttempt).filter(SessionCodeAttempt.session_id == session.id, SessionCodeAttempt.student_id == student.id))
    attempt = res_att.scalars().first()
    if not attempt or not attempt.verified:
        raise HTTPException(status_code=403, detail="Session code must be verified first.")
    if attempt.is_locked:
        raise HTTPException(status_code=403, detail="You are locked out of this session.")

    if not student.face_registered or not student.face_encoding:
        raise HTTPException(status_code=400, detail="Face not registered. Contact your admin.")

    image_bytes = await face_image.read()
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')

    # ── Async face verification — offloaded to Celery ───────────────────
    from app.tasks.face_tasks import verify_face_async
    task = verify_face_async.delay(image_b64, str(student.id), str(session.id))
    
    return JSONResponse(status_code=202, content={
        "success": True, 
        "message": "Face scan processing. Please wait...", 
        "task_id": task.id
    })

@router.get("/mark/face/status/{task_id}", summary="Check Face Scan Status")
async def check_face_status(task_id: str, current_user: User = Depends(require_student)):
    from app.tasks.face_tasks import verify_face_async
    from celery.result import AsyncResult
    
    task_result = AsyncResult(task_id)
    if not task_result.ready():
        return {"status": "processing"}
        
    result = task_result.result
    if task_result.successful():
        if result.get("verified"):
            return {
                "status": "success",
                "message": "Attendance marked successfully.",
                "attendance_id": result.get("attendance_id")
            }
        else:
            return {
                "status": "failed",
                "message": result.get("error", "Face verification failed.")
            }
    
    return {"status": "failed", "message": "Task execution failed."}


@router.post("/mark/qr", response_model=AttendanceMarkResponse, summary="Step 4B: QR Scan")
async def mark_qr(
    req: QRScanAttendanceRequest,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    student = await get_student(current_user.id, db)

    res = await db.execute(select(Session, Course).join(Course, Session.course_id == Course.id).filter(Session.id == req.session_id))
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found.")
    session, course = row

    if not session.is_active or session.is_locked:
        raise HTTPException(status_code=400, detail="This session has ended.")

    res_enr = await db.execute(select(StudentCourse).filter(StudentCourse.student_id == student.id, StudentCourse.course_id == course.id, StudentCourse.is_active == True))
    if not res_enr.scalars().first():
        raise HTTPException(status_code=403, detail="You are not enrolled in this course.")

    res_dup = await db.execute(select(AttendanceRecord).filter(AttendanceRecord.session_id == session.id, AttendanceRecord.student_id == student.id, AttendanceRecord.status == "present"))
    if res_dup.scalars().first():
        raise HTTPException(status_code=400, detail="You have already marked attendance for this session.")

    # FIX-P0-5: Enforce verified=True check for QR scan
    res_att = await db.execute(select(SessionCodeAttempt).filter(SessionCodeAttempt.session_id == session.id, SessionCodeAttempt.student_id == student.id))
    attempt = res_att.scalars().first()
    if not attempt or not attempt.verified:
        raise HTTPException(status_code=403, detail="Session code must be verified first.")
    if attempt.is_locked:
        raise HTTPException(status_code=403, detail="You are locked out of this session.")

    try:
        qr_json = json.loads(req.qr_data)
        qr_token = qr_json.get("qr_token")
        qr_course = qr_json.get("course_code")
        qr_sess = qr_json.get("session_id")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid QR code format.")

    if str(qr_sess) != str(session.id) or qr_token != session.qr_token or qr_course != course.code:
        raise HTTPException(status_code=400, detail="Invalid QR code. Please scan the code on the screen.")

    if session.qr_expires_at and session.qr_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="This QR code has expired. Ask your lecturer to refresh it.")

    return await _mark_attendance(db, student, session, course, "qr")


@router.get("/status/{session_id}", response_model=dict, summary="Check Session Status")
async def check_session_status(
    session_id: str,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    student = await get_student(current_user.id, db)

    res = await db.execute(select(Session, Course).join(Course, Session.course_id == Course.id).filter(Session.id == session_id))
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    session, course = row

    res_enr = await db.execute(select(StudentCourse).filter(StudentCourse.student_id == student.id, StudentCourse.course_id == course.id, StudentCourse.is_active == True))
    is_enrolled = bool(res_enr.scalars().first())

    res_dup = await db.execute(select(AttendanceRecord).filter(AttendanceRecord.session_id == session.id, AttendanceRecord.student_id == student.id, AttendanceRecord.status == "present"))
    rec = res_dup.scalars().first()
    already_marked = bool(rec)

    res_att = await db.execute(select(SessionCodeAttempt).filter(SessionCodeAttempt.session_id == session.id, SessionCodeAttempt.student_id == student.id))
    attempt = res_att.scalars().first()
    
    pct = await NotificationService.compute_attendance_pct(student.id, course.id, db)
    status_label = "good" if pct >= course.threshold_pct else "at_risk"

    return {
        "session_id": session.id,
        "course_title": course.title,
        "course_code": course.code,
        "is_enrolled": is_enrolled,
        "already_marked": already_marked,
        "check_in_record": None,
        "session_is_active": session.is_active,
        "session_is_locked": session.is_locked,
        "is_locked_out": attempt.is_locked if attempt else False,
        "code_verified": attempt.verified if attempt else False,
        "attempts_used": attempt.attempts if attempt else 0,
        "attempts_remaining": 3 - (attempt.attempts if attempt else 0),
        "current_attendance_pct": pct,
        "current_status": status_label
    }


@router.get("/history", response_model=AttendanceListResponse, summary="Get Full Attendance History")
async def get_history(
    course_id: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    student = await get_student(current_user.id, db)

    query = select(AttendanceRecord, Session, Course, Student.name, Student.student_id)\
        .join(Session, AttendanceRecord.session_id == Session.id)\
        .join(Course, Session.course_id == Course.id)\
        .join(Student, AttendanceRecord.student_id == Student.id)\
        .filter(AttendanceRecord.student_id == student.id)

    if course_id:
        query = query.filter(Session.course_id == course_id)
    if status:
        query = query.filter(AttendanceRecord.status == status)
    if date_from:
        try:
            dt_from = datetime.fromisoformat(date_from).date()
            query = query.filter(Session.session_date >= dt_from)
        except ValueError:
            pass
    if date_to:
        try:
            dt_to = datetime.fromisoformat(date_to).date()
            query = query.filter(Session.session_date <= dt_to)
        except ValueError:
            pass

    query = query.order_by(Session.session_date.desc(), Session.started_at.desc())

    res_total = await db.execute(select(func.count(AttendanceRecord.id)).select_from(query.subquery()))
    total = res_total.scalar() or 0

    res = await db.execute(query.offset((page - 1) * limit).limit(limit))
    rows = res.all()

    items = []
    present_count = 0
    absent_count = 0
    for ar, s, c, s_name, s_id in rows:
        status_val = ar.status.value if hasattr(ar.status, 'value') else str(ar.status)
        if status_val == "present":
            present_count += 1
        else:
            absent_count += 1
        items.append(AttendanceRecordResponse(
            id=ar.id,
            session_id=s.id,
            session_label=s.label,
            session_date=s.session_date,
            student_id=ar.student_id,
            student_name=s_name,
            student_number=s_id,
            course_id=c.id,
            course_title=c.title,
            course_code=c.code,
            checked_in_at=ar.checked_in_at,
            method=ar.method.value if ar.method else None,
            status=status_val,
            is_manual_override=ar.is_manual_override,
            override_reason=ar.override_reason,
            notes=None,
            created_at=ar.created_at
        ))

    attendance_pct = (present_count / total * 100) if total > 0 else 0.0

    # FIX-P0-2: Use 'records' field name
    return AttendanceListResponse(
        records=items,
        total=total,
        present_count=present_count,
        absent_count=absent_count,
        attendance_pct=round(attendance_pct, 2),
        page=page,
        limit=limit
    )


@router.get("/history/course/{course_id}", response_model=StudentAttendanceHistoryResponse, summary="Get Course Attendance History")
async def get_course_history(
    course_id: str,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    student = await get_student(current_user.id, db)

    res_c = await db.execute(
        select(Course, Programme.name, Lecturer.name)
        .join(Programme, Course.programme_id == Programme.id)
        .join(Lecturer, Course.lecturer_id == Lecturer.id)
        .filter(Course.id == course_id)
    )
    row = res_c.first()
    if not row:
        raise HTTPException(status_code=404, detail="Course not found")
    c, p_name, l_name = row

    res_enr = await db.execute(select(StudentCourse).filter(StudentCourse.student_id == student.id, StudentCourse.course_id == c.id, StudentCourse.is_active == True))
    if not res_enr.scalars().first():
        raise HTTPException(status_code=403, detail="Not enrolled in this course.")

    # Get all locked sessions chronological
    res_sess = await db.execute(select(Session).filter(Session.course_id == c.id, Session.is_locked == True).order_by(Session.session_date.asc(), Session.started_at.asc()))
    all_sessions = res_sess.scalars().all()

    res_att = await db.execute(select(AttendanceRecord).filter(
        AttendanceRecord.student_id == student.id,
        AttendanceRecord.session_id.in_([s.id for s in all_sessions])
    ))
    att_records = {r.session_id: r for r in res_att.scalars().all()}

    chart_data = []
    records_resp = []
    
    running_total = 0
    running_present = 0
    sessions_present = 0

    for i, s in enumerate(all_sessions, 1):
        ar = att_records.get(s.id)
        status = "absent"
        if ar and ar.status.value == "present":
            status = "present"
            running_present += 1
            sessions_present += 1
            
        running_total += 1
        cum_pct = (running_present / running_total * 100)
        
        chart_data.append(AttendanceTrendPoint(
            session_number=i,
            session_date=s.session_date,
            session_label=s.label or s.session_code,
            cumulative_pct=cum_pct,
            status=status
        ))

    # Fetch latest AR descending for records list
    res_latest = await db.execute(
        select(AttendanceRecord, Session)
        .join(Session, AttendanceRecord.session_id == Session.id)
        .filter(AttendanceRecord.student_id == student.id, Session.course_id == c.id)
        .order_by(Session.session_date.desc(), Session.started_at.desc())
    )
    for ar, s in res_latest.all():
        records_resp.append(AttendanceRecordResponse(
            id=ar.id,
            session_id=s.id,
            session_label=s.label,
            session_date=s.session_date,
            student_id=ar.student_id,
            student_name=student.name,
            student_number=student.student_id,
            course_id=c.id,
            course_title=c.title,
            course_code=c.code,
            checked_in_at=ar.checked_in_at,
            method=ar.method.value if ar.method else None,
            status=ar.status.value,
            is_manual_override=ar.is_manual_override,
            override_reason=ar.override_reason,
            notes=None,
            created_at=ar.created_at
        ))

    sessions_total = len(all_sessions)
    attendance_pct = (sessions_present / sessions_total * 100) if sessions_total > 0 else 0.0
    
    overall_status = "good"
    if attendance_pct < c.threshold_pct:
        overall_status = "defaulter" if attendance_pct < c.threshold_pct - 5 else "at_risk"

    needed = FaceService.compute_sessions_needed(sessions_present, sessions_total, c.threshold_pct)

    msg = None
    if overall_status != "good":
        msg = f"You are at {attendance_pct:.1f}%. You need to attend {needed} more consecutive sessions to reach the {c.threshold_pct}% minimum."
    elif c.threshold_pct - attendance_pct <= 5 and needed > 0:
        msg = f"You are approaching the minimum threshold. Missing sessions will put you below {c.threshold_pct}%."

    return StudentAttendanceHistoryResponse(
        course_id=c.id,
        course_title=c.title,
        course_code=c.code,
        programme_name=p_name,
        level=c.level,
        lecturer_name=l_name,
        threshold_pct=c.threshold_pct,
        sessions_present=sessions_present,
        sessions_total=sessions_total,
        attendance_pct=attendance_pct,
        status=overall_status,
        sessions_needed_to_pass=needed,
        records=records_resp,
        chart_data=chart_data,
        warning_message=msg
    )
