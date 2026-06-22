"""
Lecturer Sessions Router.

The most critical router managing the lifecycle of attendance sessions:
creation, live QR management, finalisation, overrides, and history.
"""
import base64
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, update

from app.database import get_db
from app.dependencies import require_lecturer
from app.models.user import User
from app.models.lecturer import Lecturer
from app.models.course import Course
from app.models.session import Session
from app.models.student import Student, StudentCourse
from app.models.attendance import AttendanceRecord
from app.models.institution import Institution
from app.socket_manager import sio_server
from app.schemas.session import (
    SessionCreate,
    SessionUpdate,
    SessionResponse,
    ActiveSessionResponse,
    SessionEndResponse,
    SessionSummary,
    QRRefreshResponse,
    ManualSessionOverride,
    BulkSessionOverride,
    CheckedInStudent,
    SessionHistoryResponse,
    CourseSessionGroup
)
from app.schemas.attendance import AttendanceListResponse, AttendanceRecordResponse
from app.utils.security import generate_session_code, generate_qr_token
from app.services.qr_service import QRService
from app.services.notification_service import NotificationService
from app.config import get_settings

settings = get_settings()
router = APIRouter(dependencies=[Depends(require_lecturer)])


async def get_lecturer_id(user_id, db: AsyncSession):
    res = await db.execute(select(Lecturer.id).filter(Lecturer.user_id == user_id))
    lid = res.scalar()
    if not lid:
        raise HTTPException(status_code=404, detail="Lecturer profile not found")
    return lid


@router.post("/", response_model=ActiveSessionResponse, status_code=status.HTTP_201_CREATED, summary="Start Session")
async def create_session(
    data: SessionCreate,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Create and start a new attendance session."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    # Validate course ownership
    c = await db.scalar(select(Course).filter(Course.id == data.course_id))
    if not c or c.lecturer_id != lecturer_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not c.is_active:
        raise HTTPException(status_code=400, detail="Course is not active")

    # Check for existing active session
    active = await db.scalar(
        select(Session).filter(Session.course_id == c.id, Session.is_active == True, Session.is_locked == False)
    )
    if active:
        raise HTTPException(status_code=409, detail="A session is already active for this course. End the current session before starting a new one.")

    now = datetime.utcnow()
    qr_expiry = data.qr_expiry_minutes or settings.QR_DEFAULT_EXPIRY_MINUTES
    qr_expires_at = now + timedelta(minutes=qr_expiry)
    
    qr_token = generate_qr_token()
    
    # Get dynamic session code length from institution settings
    inst_res = await db.execute(select(Institution).limit(1))
    inst = inst_res.scalars().first()
    code_length = settings.SESSION_CODE_LENGTH
    if inst and inst.settings_data:
        code_length = inst.settings_data.get("session_code_length", code_length)
        
    session_code = generate_session_code(code_length)

    new_session = Session(
        course_id=c.id,
        lecturer_id=lecturer_id,
        label=data.label,
        session_date=data.session_date,
        started_at=now,
        qr_token=qr_token,
        qr_expires_at=qr_expires_at,
        session_code=session_code,
        is_active=True,
        is_locked=False
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)

    qr_bytes = QRService.generate_qr_code(new_session.id, qr_token, c.code)
    qr_base64 = base64.b64encode(qr_bytes).decode('utf-8')

    res_en = await db.execute(select(func.count(StudentCourse.id)).filter(StudentCourse.course_id == c.id, StudentCourse.is_active == True))
    enrolled_count = res_en.scalar() or 0

    await NotificationService.notify_students_session_started(
        session_id=new_session.id,
        course_id=c.id,
        course_title=c.title,
        course_code=c.code,
        lecturer_name=current_user.email,  # Should be lecturer name, but email is fine for now
        db=db
    )

    await NotificationService.log_audit_action(current_user.id, "session_started", "session", new_session.id, {"course": c.code, "session_code": session_code}, None, db)

    await sio_server.emit('global_update', {
        'type': 'session_started',
        'message': f"A new session has started for {c.title}"
    })
    
    await sio_server.emit('session_started', {
        'session_id': str(new_session.id),
        'course_id': str(c.id)
    })

    s_dict = new_session.__dict__.copy()
    s_dict.update({
        "course_title": c.title,
        "course_code": c.code,
        "lecturer_name": current_user.email,
        "duration_minutes": None,
        "present_count": 0,
        "absent_count": 0,
        "total_enrolled": enrolled_count,
        "attendance_pct": 0.0,
        "face_scan_count": 0,
        "qr_scan_count": 0,
        "qr_image_base64": qr_base64,
        "checked_in_students": [],
        "not_checked_in_count": enrolled_count,
        "seconds_until_qr_expiry": int((qr_expires_at - now).total_seconds()),
        "qr_expired": False
    })
    return ActiveSessionResponse(**s_dict)


@router.get("/active", response_model=ActiveSessionResponse, summary="Get Active Session")
async def get_active_session(
    course_id: Optional[str] = None,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Returns the currently active session for any of the lecturer's courses (or filtered by course)."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    query = select(Session, Course).join(Course, Session.course_id == Course.id).filter(
        Session.lecturer_id == lecturer_id,
        Session.is_active == True,
        Session.is_locked == False
    )
    if course_id:
        query = query.filter(Session.course_id == course_id)

    res = await db.execute(query)
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="No active session found")
    
    s, c = row
    now = datetime.utcnow()
    
    en_res = await db.execute(select(func.count(StudentCourse.id)).filter(StudentCourse.course_id == c.id, StudentCourse.is_active == True))
    enrolled_count = en_res.scalar() or 0

    att_res = await db.execute(
        select(AttendanceRecord, Student)
        .join(Student, AttendanceRecord.student_id == Student.id)
        .filter(AttendanceRecord.session_id == s.id, AttendanceRecord.status == "present")
        .order_by(AttendanceRecord.checked_in_at.desc())
    )
    att_rows = att_res.all()

    checked_in = []
    face_cnt = 0
    qr_cnt = 0
    for r, st in att_rows:
        checked_in.append(CheckedInStudent(
            student_id=st.id,
            student_name=st.name,
            student_number=st.student_id,
            method=r.method.value if r.method else "unknown",
            checked_in_at=r.checked_in_at
        ))
        if r.method and r.method.value == "face": face_cnt += 1
        elif r.method and r.method.value == "qr": qr_cnt += 1

    pres = len(checked_in)
    absnt = 0
    pct = (pres / enrolled_count * 100) if enrolled_count > 0 else 0.0

    qr_expired = False
    qr_base64 = None
    seconds_until_qr_expiry = 0
    if s.qr_expires_at:
        diff = (s.qr_expires_at - now).total_seconds()
        if diff < 0:
            qr_expired = True
        else:
            seconds_until_qr_expiry = int(diff)
            qr_bytes = QRService.generate_qr_code(s.id, s.qr_token, c.code)
            qr_base64 = base64.b64encode(qr_bytes).decode('utf-8')

    s_dict = s.__dict__.copy()
    s_dict.update({
        "course_title": c.title,
        "course_code": c.code,
        "lecturer_name": current_user.email,
        "duration_minutes": None,
        "present_count": pres,
        "absent_count": absnt,
        "total_enrolled": enrolled_count,
        "attendance_pct": pct,
        "face_scan_count": face_cnt,
        "qr_scan_count": qr_cnt,
        "qr_image_base64": qr_base64,
        "checked_in_students": checked_in,
        "not_checked_in_count": enrolled_count - pres,
        "seconds_until_qr_expiry": seconds_until_qr_expiry,
        "qr_expired": qr_expired
    })
    return ActiveSessionResponse(**s_dict)


@router.get("/history", response_model=SessionHistoryResponse, summary="Session History")
async def get_session_history(
    course_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """All sessions across all of the lecturer's courses."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    query = select(Session, Course).join(Course, Session.course_id == Course.id).filter(Session.lecturer_id == lecturer_id)
    
    if course_id:
        query = query.filter(Session.course_id == course_id)
    if date_from:
        query = query.filter(Session.session_date >= datetime.strptime(date_from, "%Y-%m-%d").date())
    if date_to:
        query = query.filter(Session.session_date <= datetime.strptime(date_to, "%Y-%m-%d").date())
    if status == "active":
        query = query.filter(Session.is_active == True, Session.is_locked == False)
    elif status == "completed":
        query = query.filter(Session.is_locked == True)

    res_total = await db.execute(select(func.count(Session.id)).select_from(query.subquery()))
    total = res_total.scalar() or 0

    query = query.order_by(Session.session_date.desc(), Session.started_at.desc())
    res = await db.execute(query.offset((page - 1) * limit).limit(limit))
    rows = res.all()

    sessions = []
    course_groups = {}

    for s, c in rows:
        en_res = await db.execute(select(func.count(StudentCourse.id)).filter(StudentCourse.course_id == c.id, StudentCourse.is_active == True))
        en_cnt = en_res.scalar() or 0

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
            "lecturer_name": current_user.email,
            "duration_minutes": dur,
            "present_count": pres,
            "absent_count": absnt,
            "total_enrolled": en_cnt,
            "attendance_pct": pct,
            "face_scan_count": face_cnt,
            "qr_scan_count": qr_cnt
        })
        sr = SessionResponse(**s_dict)
        sessions.append(sr)

        if c.id not in course_groups:
            course_groups[c.id] = {
                "course_id": c.id,
                "course_title": c.title,
                "course_code": c.code,
                "session_count": 0,
                "sum_pct": 0.0,
                "sessions": []
            }
        course_groups[c.id]["session_count"] += 1
        course_groups[c.id]["sum_pct"] += pct
        course_groups[c.id]["sessions"].append(sr)

    grouped = []
    for g in course_groups.values():
        grouped.append(
            CourseSessionGroup(
                course_id=g["course_id"],
                course_title=g["course_title"],
                course_code=g["course_code"],
                session_count=g["session_count"],
                avg_attendance_pct=(g["sum_pct"] / g["session_count"]) if g["session_count"] > 0 else 0.0,
                sessions=g["sessions"]
            )
        )

    return SessionHistoryResponse(
        sessions=sessions,
        total=total,
        page=page,
        grouped_by_course=grouped
    )


@router.get("/{session_id}", response_model=SessionResponse, summary="Get Session")
async def get_session(
    session_id: str,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Get a single session by ID."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    res = await db.execute(select(Session, Course).join(Course, Session.course_id == Course.id).filter(Session.id == session_id))
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    s, c = row

    if s.lecturer_id != lecturer_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    en_res = await db.execute(select(func.count(StudentCourse.id)).filter(StudentCourse.course_id == c.id, StudentCourse.is_active == True))
    en_cnt = en_res.scalar() or 0

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
        "lecturer_name": current_user.email,
        "duration_minutes": dur,
        "present_count": pres,
        "absent_count": absnt,
        "total_enrolled": en_cnt,
        "attendance_pct": pct,
        "face_scan_count": face_cnt,
        "qr_scan_count": qr_cnt
    })
    return SessionResponse(**s_dict)


@router.get("/{session_id}/attendance", response_model=AttendanceListResponse, summary="Get Session Attendance")
async def get_session_attendance(
    session_id: str,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """All attendance records for a specific session."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    res = await db.execute(select(Session, Course).join(Course, Session.course_id == Course.id).filter(Session.id == session_id))
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    s, c = row

    if s.lecturer_id != lecturer_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    query = select(AttendanceRecord, Student).join(Student, AttendanceRecord.student_id == Student.id).filter(AttendanceRecord.session_id == s.id)
    if status:
        query = query.filter(AttendanceRecord.status == status)
    
    query = query.order_by(Student.name.asc())

    res_total = await db.execute(select(func.count(AttendanceRecord.id)).select_from(query.subquery()))
    total = res_total.scalar() or 0

    res_all_pres = await db.execute(select(func.count(AttendanceRecord.id)).filter(AttendanceRecord.session_id == s.id, AttendanceRecord.status == "present"))
    pres = res_all_pres.scalar() or 0
    res_all_absnt = await db.execute(select(func.count(AttendanceRecord.id)).filter(AttendanceRecord.session_id == s.id, AttendanceRecord.status == "absent"))
    absnt = res_all_absnt.scalar() or 0

    tot = pres + absnt
    pct = (pres / tot * 100) if tot > 0 else 0.0

    res = await db.execute(query.offset((page - 1) * limit).limit(limit))
    rows = res.all()

    records = []
    for r, st in rows:
        records.append(AttendanceRecordResponse(
            id=r.id,
            session_id=s.id,
            session_label=s.label or s.session_code,
            session_date=s.session_date,
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
        ))

    return AttendanceListResponse(
        records=records,
        total=total,
        present_count=pres,
        absent_count=absnt,
        attendance_pct=pct
    )


@router.post("/{session_id}/refresh-qr", response_model=QRRefreshResponse, summary="Refresh QR Code")
async def refresh_qr(
    session_id: str,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Refresh the QR code for an active session."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    res = await db.execute(select(Session, Course).join(Course, Session.course_id == Course.id).filter(Session.id == session_id))
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    s, c = row

    if s.lecturer_id != lecturer_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not s.is_active or s.is_locked:
        raise HTTPException(status_code=400, detail="Session is already ended/locked")

    new_token = generate_qr_token()
    now = datetime.utcnow()
    # Assuming original duration was roughly the difference between qr_expires_at and started_at, but we can just use default
    expiry_minutes = settings.QR_DEFAULT_EXPIRY_MINUTES
    if s.qr_expires_at and s.started_at:
        expiry_minutes = int((s.qr_expires_at - s.started_at).total_seconds() / 60)
        if expiry_minutes <= 0: expiry_minutes = settings.QR_DEFAULT_EXPIRY_MINUTES
    
    new_expiry = now + timedelta(minutes=expiry_minutes)

    # Atomic update
    await db.execute(
        update(Session).where(Session.id == s.id).values(qr_token=new_token, qr_expires_at=new_expiry)
    )
    await db.commit()

    qr_bytes = QRService.generate_qr_code(s.id, new_token, c.code)
    qr_base64 = base64.b64encode(qr_bytes).decode('utf-8')

    await sio_server.emit('qr_refreshed', {
        'session_id': session_id,
        'qr_token': new_token,
        'qr_image_base64': qr_base64,
        'qr_expires_at': new_expiry.isoformat(),
        'seconds_until_expiry': int((new_expiry - now).total_seconds())
    }, room=f"session_{session_id}")

    return QRRefreshResponse(
        qr_token=new_token,
        qr_image_base64=qr_base64,
        qr_expires_at=new_expiry,
        seconds_until_expiry=int((new_expiry - now).total_seconds())
    )


@router.post("/{session_id}/end", response_model=SessionEndResponse, summary="End Session")
async def end_session(
    session_id: str,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """End an active session and finalise attendance."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    res = await db.execute(select(Session, Course).join(Course, Session.course_id == Course.id).filter(Session.id == session_id))
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    s, c = row

    if s.lecturer_id != lecturer_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not s.is_active or s.is_locked:
        raise HTTPException(status_code=400, detail="Session is already ended")

    # Fetch all enrolled students
    res_en = await db.execute(select(StudentCourse.student_id).filter(StudentCourse.course_id == c.id, StudentCourse.is_active == True))
    enrolled_ids = [r[0] for r in res_en.all()]

    # Fetch checked in students
    res_att = await db.execute(select(AttendanceRecord.student_id).filter(AttendanceRecord.session_id == s.id))
    checked_in_ids = [r[0] for r in res_att.all()]

    # Find absent
    absent_ids = list(set(enrolled_ids) - set(checked_in_ids))

    now = datetime.utcnow()

    # Bulk insert absent
    if absent_ids:
        absent_records = [
            {
                "session_id": s.id,
                "student_id": sid,
                "checked_in_at": None,
                "method": None,
                "status": "absent",
                "is_manual_override": False,
                "created_at": now
            }
            for sid in absent_ids
        ]
        await db.execute(AttendanceRecord.__table__.insert().values(absent_records))

    # Update session
    s.is_active = False
    s.is_locked = True
    s.ended_at = now
    s.qr_token = None
    s.qr_expires_at = None
    await db.commit()

    # Check threshold for all students
    for sid in enrolled_ids:
        await NotificationService.check_and_send_threshold_alerts(sid, c.id, db)

    pres = len(checked_in_ids)
    absnt = len(absent_ids)
    tot = len(enrolled_ids)
    pct = (pres / tot * 100) if tot > 0 else 0.0

    await NotificationService.create_notification(
        user_id=current_user.id,
        type="session_completed",
        title="Session Ended",
        message=f"Session for {c.title} ended. {pres}/{tot} students present ({pct:.1f}%).",
        db=db
    )

    await NotificationService.log_audit_action(
        current_user.id, "session_ended", "session", s.id,
        {"course": c.code, "present": pres, "absent": absnt, "total": tot, "pct": pct},
        None, db
    )

    await sio_server.emit('session_ended', {
        'session_id': session_id,
        'action': 'session_ended'
    }, room=f"session_{session_id}")

    # Need full lists for response
    full_att = await get_session_attendance(str(s.id), None, 1, 1000, current_user, db)
    
    dur = int((now - s.started_at).total_seconds() / 60)
    
    # We need to construct SessionResponse
    att_res_counts = await db.execute(
        select(
            func.count(AttendanceRecord.id).filter(AttendanceRecord.method == "face"),
            func.count(AttendanceRecord.id).filter(AttendanceRecord.method == "qr")
        ).filter(AttendanceRecord.session_id == s.id)
    )
    face_cnt, qr_cnt = att_res_counts.first()

    s_dict = s.__dict__.copy()
    s_dict.update({
        "course_title": c.title,
        "course_code": c.code,
        "lecturer_name": current_user.email,
        "duration_minutes": dur,
        "present_count": pres,
        "absent_count": absnt,
        "total_enrolled": tot,
        "attendance_pct": pct,
        "face_scan_count": face_cnt,
        "qr_scan_count": qr_cnt
    })
    
    summary = SessionSummary(
        session_id=s.id,
        course_title=c.title,
        course_code=c.code,
        label=s.label,
        session_date=s.session_date,
        total_enrolled=tot,
        present_count=pres,
        absent_count=absnt,
        attendance_pct=pct,
        face_scan_count=face_cnt,
        qr_scan_count=qr_cnt,
        duration_minutes=dur
    )

    return SessionEndResponse(
        session=SessionResponse(**s_dict),
        present_students=[r for r in full_att.records if r.status == "present"],
        absent_students=[r for r in full_att.records if r.status == "absent"],
        summary=summary
    )


@router.delete("/{session_id}", summary="Delete Session")
async def delete_session(
    session_id: str,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Delete a session entirely."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    s = await db.scalar(select(Session).filter(Session.id == session_id))
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    if s.lecturer_id != lecturer_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Hard rule: only allowed if no attendance records exist
    res = await db.execute(select(func.count(AttendanceRecord.id)).filter(AttendanceRecord.session_id == s.id))
    cnt = res.scalar() or 0
    if cnt > 0:
        raise HTTPException(status_code=409, detail="Cannot delete session with attendance records. End the session instead.")
    if s.is_locked:
        raise HTTPException(status_code=409, detail="Cannot delete a locked session.")

    await db.delete(s)
    await db.commit()
    await NotificationService.log_audit_action(current_user.id, "session_deleted", "session", s.id, None, None, db)
    return {"message": "Session deleted successfully"}


@router.patch("/{session_id}", response_model=SessionResponse, summary="Update Session")
async def update_session(
    session_id: str,
    data: SessionUpdate,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Update session label or date (pre-session edit only)."""
    # Simply using the get_session logic to return, we just need to update it
    lecturer_id = await get_lecturer_id(current_user.id, db)
    s = await db.scalar(select(Session).filter(Session.id == session_id))
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    if s.lecturer_id != lecturer_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if s.is_locked:
        raise HTTPException(status_code=400, detail="Cannot update a locked session")

    if data.label is not None:
        s.label = data.label
    if data.session_date is not None:
        s.session_date = data.session_date
    await db.commit()

    await NotificationService.log_audit_action(current_user.id, "session_updated", "session", s.id, None, None, db)
    return await get_session(session_id, current_user, db)


@router.patch("/{session_id}/attendance/{student_id}", summary="Manual Attendance Override")
async def override_attendance(
    session_id: str,
    student_id: str,
    data: ManualSessionOverride,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Manual attendance override by lecturer for a single student."""
    # Ensure URL student_id matches body student_id if provided, or just use URL one
    lecturer_id = await get_lecturer_id(current_user.id, db)

    res = await db.execute(select(Session, Course).join(Course, Session.course_id == Course.id).filter(Session.id == session_id))
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    s, c = row

    if s.lecturer_id != lecturer_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not s.is_locked:
        raise HTTPException(status_code=400, detail="Session must be ended before overriding attendance.")

    sc = await db.scalar(select(StudentCourse).filter(StudentCourse.student_id == student_id, StudentCourse.course_id == c.id, StudentCourse.is_active == True))
    if not sc:
        raise HTTPException(status_code=400, detail="Student is not enrolled in this course")

    ar = await db.scalar(select(AttendanceRecord).filter(AttendanceRecord.session_id == s.id, AttendanceRecord.student_id == student_id))
    now = datetime.utcnow()
    
    if ar:
        ar.status = data.status
        ar.is_manual_override = True
        ar.override_reason = data.reason
        ar.override_by = current_user.id
        ar.override_at = now
    else:
        ar = AttendanceRecord(
            session_id=s.id,
            student_id=student_id,
            status=data.status,
            is_manual_override=True,
            override_reason=data.reason,
            override_by=current_user.id,
            override_at=now,
            method="manual",
            checked_in_at=now if data.status == "present" else None
        )
        db.add(ar)
        
    await db.commit()
    await db.refresh(ar)

    await NotificationService.check_and_send_threshold_alerts(student_id, c.id, db)

    st = await db.scalar(select(Student).filter(Student.id == student_id))
    
    await NotificationService.log_audit_action(
        current_user.id, "manual_attendance_override", "attendance_record", ar.id,
        {"student_name": st.name, "course": c.code, "session": s.label or s.session_code, "new_status": data.status, "reason": data.reason},
        None, db
    )

    await NotificationService.create_notification(
        user_id=st.user_id,
        type="attendance_adjusted",
        title="Attendance Record Updated",
        message=f"Your attendance for {s.label or s.session_code} in {c.title} has been updated to {data.status} by your lecturer.",
        db=db
    )

    await sio_server.emit('attendance_marked', {
        'session_id': str(s.id),
        'student_id': str(st.id),
        'student_name': st.name,
        'student_number': st.student_id,
        'method': "manual",
        'checked_in_at': ar.checked_in_at.isoformat() if ar.checked_in_at else None,
        'status': ar.status.value
    }, room=f"session_{s.id}")
    
    await sio_server.emit('global_update', {
        'type': 'attendance_marked',
        'student_id': str(st.id),
        'message': f"Attendance manually updated for {st.name} to {data.status}"
    })

    resp = AttendanceRecordResponse(
        id=ar.id,
        session_id=s.id,
        session_label=s.label or s.session_code,
        session_date=s.session_date,
        student_id=st.id,
        student_name=st.name,
        student_number=st.student_id,
        course_id=c.id,
        course_title=c.title,
        course_code=c.code,
        checked_in_at=ar.checked_in_at,
        method=ar.method.value if ar.method else None,
        status=ar.status.value,
        is_manual_override=ar.is_manual_override,
        override_reason=ar.override_reason,
        created_at=ar.created_at
    )

    return {"message": "Attendance updated", "record": resp}

@router.post("/{session_id}/attendance/bulk", summary="Bulk Manual Attendance Override")
async def bulk_override_attendance(
    session_id: str,
    data: BulkSessionOverride,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Manual attendance override by lecturer for multiple students at once."""
    lecturer_id = await get_lecturer_id(current_user.id, db)

    res = await db.execute(select(Session, Course).join(Course, Session.course_id == Course.id).filter(Session.id == session_id))
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    s, c = row

    if s.lecturer_id != lecturer_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not s.is_locked:
        raise HTTPException(status_code=400, detail="Session must be ended before overriding attendance.")

    now = datetime.utcnow()
    
    # Verify students are enrolled
    enrolled_res = await db.execute(select(StudentCourse.student_id).filter(
        StudentCourse.course_id == c.id, 
        StudentCourse.student_id.in_(data.student_ids),
        StudentCourse.is_active == True
    ))
    enrolled_ids = {str(r[0]) for r in enrolled_res.all()}
    
    for st_id in data.student_ids:
        st_id_str = str(st_id)
        if st_id_str not in enrolled_ids:
            continue
            
        ar = await db.scalar(select(AttendanceRecord).filter(AttendanceRecord.session_id == s.id, AttendanceRecord.student_id == st_id))
        
        if ar:
            ar.status = data.status
            ar.is_manual_override = True
            ar.override_reason = data.reason
            ar.override_by = current_user.id
            ar.override_at = now
        else:
            ar = AttendanceRecord(
                session_id=s.id,
                student_id=st_id,
                status=data.status,
                is_manual_override=True,
                override_reason=data.reason,
                override_by=current_user.id,
                override_at=now,
                method="manual",
                checked_in_at=now if data.status == "present" else None
            )
            db.add(ar)
            
        await db.flush()
        await NotificationService.check_and_send_threshold_alerts(st_id, c.id, db)

    await db.commit()
    await NotificationService.log_audit_action(
        current_user.id, "bulk_manual_attendance_override", "session", s.id,
        {"course": c.code, "session": s.label or s.session_code, "new_status": data.status, "student_count": len(enrolled_ids)},
        None, db
    )

    return {"message": f"Attendance overridden for {len(enrolled_ids)} students"}

@router.post("/{session_id}/export", summary="Export Session Attendance")
async def export_session_attendance(
    session_id: str,
    format: str = Query("csv", description="Export format: 'csv' or 'excel'"),
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    import io
    import csv
    from fastapi.responses import StreamingResponse
    from urllib.parse import quote

    lecturer_id = await get_lecturer_id(current_user.id, db)
    res = await db.execute(select(Session, Course).join(Course, Session.course_id == Course.id).filter(Session.id == session_id))
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    s, c = row

    if s.lecturer_id != lecturer_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Fetch attendance
    att_res = await db.execute(
        select(AttendanceRecord, Student)
        .join(Student, AttendanceRecord.student_id == Student.id)
        .filter(AttendanceRecord.session_id == s.id)
        .order_by(Student.name.asc())
    )
    records = att_res.all()

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Student ID", "Student Name", "Status", "Method", "Checked In At", "Manual Override", "Override Reason"])
        
        for r, st in records:
            checked_in = r.checked_in_at.strftime("%Y-%m-%d %H:%M:%S") if r.checked_in_at else "N/A"
            writer.writerow([
                st.student_id,
                st.name,
                r.status.value.upper(),
                r.method.value if r.method else "N/A",
                checked_in,
                "Yes" if r.is_manual_override else "No",
                r.override_reason or ""
            ])
            
        output.seek(0)
        filename = f"attendance_{c.code}_{s.session_date}.csv"
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename*=utf-8''{quote(filename)}"}
        )
    else:
        # Placeholder for excel
        raise HTTPException(status_code=400, detail="Excel export not yet implemented. Use format=csv.")
