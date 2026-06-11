from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Core Sub-shapes
# ---------------------------------------------------------------------------

class StudentDashboardStats(BaseModel):
    total_courses: int
    overall_avg_pct: float
    sessions_attended: int
    sessions_total: int
    at_risk_courses: int


class StudentCourseCard(BaseModel):
    course_id: UUID
    course_title: str
    course_code: str
    programme_name: str
    level: int
    semester_number: int
    lecturer_name: str
    sessions_present: int
    sessions_total: int
    attendance_pct: float
    threshold_pct: int
    status: str
    sessions_needed_to_pass: int
    has_live_session: bool
    live_session_id: Optional[UUID] = None


class LiveSessionAlert(BaseModel):
    session_id: UUID
    course_id: UUID
    course_title: str
    course_code: str
    lecturer_name: str
    started_at: datetime
    qr_expires_at: Optional[datetime] = None
    seconds_remaining: Optional[int] = None
    already_marked: bool


class StudentActivityItem(BaseModel):
    session_id: UUID
    course_title: str
    course_code: str
    session_date: date
    session_label: Optional[str] = None
    checked_in_at: Optional[datetime] = None
    method: Optional[str] = None
    status: str
    is_manual_override: bool


class UpcomingClass(BaseModel):
    course_id: UUID
    course_title: str
    course_code: str
    lecturer_name: str
    day_of_week: str
    scheduled_time: Optional[str] = None
    room: Optional[str] = None


# ---------------------------------------------------------------------------
# Dashboard Response
# ---------------------------------------------------------------------------

class StudentDashboardResponse(BaseModel):
    student_name: str
    student_number: str
    programme_name: str
    level: int
    academic_year: Optional[str] = None
    active_semester: Optional[str] = None
    enrolled_courses: List[StudentCourseCard]
    recent_activity: List[StudentActivityItem]
    upcoming_schedule: List[UpcomingClass]
    live_session: Optional[LiveSessionAlert] = None
    stats: StudentDashboardStats


# ---------------------------------------------------------------------------
# Attendance Marking Flow
# ---------------------------------------------------------------------------

class SessionCodeVerifyRequest(BaseModel):
    session_id: UUID
    code: str = Field(..., max_length=10)


class SessionCodeVerifyResponse(BaseModel):
    verified: bool
    session_id: UUID
    course_title: str
    course_code: str
    attempts_remaining: Optional[int] = None
    locked_out: bool
    message: str


class QRScanAttendanceRequest(BaseModel):
    session_id: UUID
    qr_data: str


class AttendanceMarkResponse(BaseModel):
    success: bool
    status: str
    message: str
    method: Optional[str] = None
    checked_in_at: Optional[datetime] = None
    course_title: Optional[str] = None
    course_code: Optional[str] = None
    session_label: Optional[str] = None
    updated_attendance_pct: Optional[float] = None
    updated_status: Optional[str] = None


class SessionCodeAttemptResponse(BaseModel):
    attempts: int
    is_locked: bool
    attempts_remaining: int
    max_attempts: int


# ---------------------------------------------------------------------------
# Attendance History
# ---------------------------------------------------------------------------

from app.schemas.attendance import AttendanceRecordResponse  # noqa: E402

class AttendanceTrendPoint(BaseModel):
    session_number: int
    session_date: date
    session_label: Optional[str] = None
    cumulative_pct: float
    status: str


class StudentAttendanceHistoryResponse(BaseModel):
    course_id: UUID
    course_title: str
    course_code: str
    programme_name: str
    level: int
    lecturer_name: str
    threshold_pct: int
    sessions_present: int
    sessions_total: int
    attendance_pct: float
    status: str
    sessions_needed_to_pass: int
    records: List[AttendanceRecordResponse]
    chart_data: List[AttendanceTrendPoint]
    warning_message: Optional[str] = None


class SessionSummaryForStudent(BaseModel):
    session_id: UUID
    label: Optional[str] = None
    session_date: date
    started_at: datetime
    ended_at: Optional[datetime] = None
    is_active: bool
    is_locked: bool
    student_status: Optional[str] = None
    checked_in_at: Optional[datetime] = None
    method: Optional[str] = None


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

class StudentProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    student_number: str
    email: str
    department_name: str
    programme_name: str
    level: int
    semester_of_entry: int
    face_registered: bool
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    enrolled_courses: List[StudentCourseCard]
    overall_stats: StudentDashboardStats


class StudentProfileUpdate(BaseModel):
    display_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = None


class StudentPasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str


class FacePhotoUpdateResponse(BaseModel):
    success: bool
    message: str
    face_registered: bool
    updated_at: datetime


class StudentNotificationPreferences(BaseModel):
    alert_below_80: bool
    alert_below_75: bool
    session_started_alert: bool
    session_ending_soon: bool
    weekly_summary: bool
