"""
Session Pydantic schemas for the Lecturer Module.

Covers session creation, update, live-session state, end-of-session
summary, QR refresh, manual override, and every response shape
consumed by the lecturer UI.
"""
from __future__ import annotations

import base64
from datetime import date, datetime, time
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Inbound – create / update
# ---------------------------------------------------------------------------

class SessionCreate(BaseModel):
    """
    Body sent by the lecturer when starting a new attendance session.

    ``qr_expiry_minutes`` must be between 5 and 30.  When omitted the
    server falls back to ``settings.QR_DEFAULT_EXPIRY_MINUTES``.
    """

    course_id: UUID
    label: Optional[str] = Field(None, max_length=255)
    session_date: date = Field(default_factory=date.today)
    session_time: time = Field(default_factory=lambda: datetime.utcnow().time())
    qr_expiry_minutes: int = Field(15, ge=5, le=30)


class SessionUpdate(BaseModel):
    """Partial update for a session that has not yet been locked."""

    label: Optional[str] = Field(None, max_length=255)
    session_date: Optional[date] = None


class ManualSessionOverride(BaseModel):
    """
    Lecturer-submitted manual attendance override for a single student.

    ``status`` must be ``"present"`` or ``"absent"``.
    ``reason`` must be at least 10 characters to force meaningful notes.
    """

    student_id: UUID
    status: str = Field(..., description="'present' or 'absent'")
    reason: str = Field(..., min_length=10)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in {"present", "absent"}:
            raise ValueError("status must be 'present' or 'absent'")
        return v


# ---------------------------------------------------------------------------
# Sub-shapes used inside response bodies
# ---------------------------------------------------------------------------

class CheckedInStudent(BaseModel):
    """One student who has already checked in during an active session."""

    student_id: UUID
    student_name: str
    student_number: str
    method: str  # "face" | "qr"
    checked_in_at: datetime

    model_config = {"from_attributes": True}


class SessionSummary(BaseModel):
    """
    Condensed per-session statistics used in dashboard and end-of-session
    response bodies.
    """

    session_id: UUID
    course_title: str
    course_code: str
    label: Optional[str] = None
    session_date: date
    total_enrolled: int
    present_count: int
    absent_count: int
    attendance_pct: float
    face_scan_count: int
    qr_scan_count: int
    duration_minutes: Optional[int] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Primary session response
# ---------------------------------------------------------------------------

class SessionResponse(BaseModel):
    """
    Full session record with all computed statistics.  Returned by most
    GET endpoints that return a single session.
    """

    id: UUID
    course_id: UUID
    course_title: str
    course_code: str
    lecturer_id: UUID
    lecturer_name: str
    label: Optional[str] = None
    session_date: date
    started_at: datetime
    ended_at: Optional[datetime] = None
    qr_expires_at: Optional[datetime] = None
    session_code: str
    is_active: bool
    is_locked: bool
    duration_minutes: Optional[int] = None
    present_count: int
    absent_count: int
    total_enrolled: int
    attendance_pct: float
    face_scan_count: int
    qr_scan_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ActiveSessionResponse(SessionResponse):
    """
    Extended session response returned while a session is live.

    Adds the current QR token, a base64-encoded PNG QR image, the full
    list of students who have already checked in, and the number of
    seconds left before the QR code expires.
    """

    qr_token: Optional[str] = None
    qr_image_base64: Optional[str] = None
    checked_in_students: List[CheckedInStudent] = Field(default_factory=list)
    not_checked_in_count: int = 0
    seconds_until_qr_expiry: int = 0
    qr_expired: bool = False


# ---------------------------------------------------------------------------
# End-of-session response
# ---------------------------------------------------------------------------

class SessionEndResponse(BaseModel):
    """
    Returned immediately after ``POST /sessions/{id}/end``.

    Includes the finalised session record, two lists (present / absent
    students), and a concise summary.
    """

    # Import here to avoid circular dependency at module level
    session: SessionResponse
    present_students: List["AttendanceRecordResponse"]
    absent_students: List["AttendanceRecordResponse"]
    summary: SessionSummary


# ---------------------------------------------------------------------------
# QR refresh response
# ---------------------------------------------------------------------------

class QRRefreshResponse(BaseModel):
    """Returned after ``POST /sessions/{id}/refresh-qr``."""

    qr_token: str
    qr_image_base64: str
    qr_expires_at: datetime
    seconds_until_expiry: int


# ---------------------------------------------------------------------------
# History list response
# ---------------------------------------------------------------------------

class CourseSessionGroup(BaseModel):
    """One course's worth of sessions inside the history response."""

    course_id: UUID
    course_title: str
    course_code: str
    session_count: int
    avg_attendance_pct: float
    sessions: List[SessionResponse]


class SessionHistoryResponse(BaseModel):
    """Paginated session history with an optional course-grouped view."""

    sessions: List[SessionResponse]
    total: int
    page: int
    grouped_by_course: List[CourseSessionGroup]


# Resolve forward reference
from app.schemas.attendance import AttendanceRecordResponse  # noqa: E402
SessionEndResponse.model_rebuild()
