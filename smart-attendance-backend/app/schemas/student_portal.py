from datetime import date, datetime, time
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
    credit_hours: Optional[int] = None
    lecturer_name: str
    lecturer_email: Optional[str] = None
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
    code_length: int = 6


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


# FIX: course_id was required but dashboard never had it in some code paths.
# Made optional with a default so existing callers that omit it don't crash.
# Also added day_of_week and scheduled_time as proper fields.
class UpcomingClass(BaseModel):
    course_id: Optional[UUID] = None
    course_title: str
    course_code: str
    lecturer_name: str
    day_of_week: Optional[str] = None
    time_until: Optional[str] = None      # human-readable e.g. "In 2 days at 09:00"
    scheduled_time: Optional[str] = None  # "HH:MM"
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
    live_session: Optional[LiveSessionAlert] = None
    stats: StudentDashboardStats

class CourseTrendPoint(BaseModel):
    week_label: str
    attendance_pct: float

class CourseAttendanceTrend(BaseModel):
    course_code: str
    course_title: str
    trend: List[CourseTrendPoint]

class AttendanceTrendResponse(BaseModel):
    courses: List[CourseAttendanceTrend]


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
    liveness_failed: Optional[bool] = None


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
    last_login_device: Optional[str] = None
    last_login_location: Optional[str] = None
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
    task_id: Optional[str] = None
    profile_picture_url: Optional[str] = None
    updated_at: Optional[datetime] = None


# FIX: added missing alert_below_70 field that was in defaults dict but not the schema
class StudentNotificationPreferences(BaseModel):
    alert_below_80: bool = True
    alert_below_75: bool = True
    alert_below_70: bool = True
    session_started_alert: bool = True
    session_ending_soon: bool = True
    weekly_summary: bool = False