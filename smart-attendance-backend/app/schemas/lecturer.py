from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.schemas.course import CourseResponse

class LecturerCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    staff_id: str = Field(..., min_length=1, max_length=50)
    department_id: UUID
    phone: Optional[str] = None

class LecturerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = None
    department_id: Optional[UUID] = None

class SessionSummary(BaseModel):
    id: UUID
    course_id: UUID
    course_code: str
    session_date: datetime
    label: Optional[str]
    students_present: int
    students_absent: int
    
    class Config:
        from_attributes = True

class LecturerResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    email: str
    staff_id: str
    department_id: UUID
    department_name: str
    phone: Optional[str] = None
    is_suspended: bool
    is_active: bool
    is_verified: bool
    course_count: int
    session_count: int
    last_login: Optional[datetime] = None
    last_login_device: Optional[str] = None
    last_login_location: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    preferences: Optional[dict] = None
    notification_preferences: Optional[dict] = None

    class Config:
        from_attributes = True

class LecturerDetailResponse(LecturerResponse):
    total_students: int
    courses: List[CourseResponse]
    recent_sessions: List[SessionSummary]

class LecturerListResponse(BaseModel):
    lecturers: List[LecturerResponse]
    total: int


# ---------------------------------------------------------------------------
# Lecturer Module Specific Schemas
# ---------------------------------------------------------------------------

class LecturerStats(BaseModel):
    total_courses: int
    total_students: int
    sessions_this_week: int
    at_risk_count: int


class LecturerCourseCard(BaseModel):
    course_id: UUID
    course_title: str
    course_code: str
    programme_name: str
    level: int
    semester_number: int
    credit_hours: int
    threshold_pct: int
    enrolled_count: int
    sessions_held: int
    avg_attendance_pct: float
    below_threshold_count: int
    has_live_session: bool
    live_session_id: Optional[UUID] = None


class AtRiskStudent(BaseModel):
    student_id: UUID
    student_name: str
    student_number: str
    course_id: UUID
    course_title: str
    course_code: str
    current_pct: float
    threshold_pct: int
    shortfall: float


class LecturerDashboardResponse(BaseModel):
    lecturer_name: str
    department_name: str
    courses: List[LecturerCourseCard]
    recent_sessions: List[SessionSummary]
    at_risk_students: List[AtRiskStudent]
    stats: LecturerStats


class CourseStudentRow(BaseModel):
    student_id: UUID
    student_name: str
    student_number: str
    email: str
    sessions_present: int
    sessions_total: int
    attendance_pct: float
    status: str
    last_checkin: Optional[datetime] = None


class LecturerCourseDetailResponse(BaseModel):
    course_id: UUID
    course_title: str
    course_code: str
    programme_name: str
    programme_code: str
    level: int
    semester_number: int
    credit_hours: int
    threshold_pct: int
    is_active: bool
    enrolled_students: List[CourseStudentRow]
    session_count: int
    avg_attendance_pct: float
    below_threshold_count: int


class LecturerProfileUpdate(BaseModel):
    pass # No longer allowing updates to name/phone based on requirements

class LecturerPreferencesUpdate(BaseModel):
    qr_expiry_mode: str
    custom_qr_expiry_mins: int
    date_format: str

class LecturerNotificationPreferencesUpdate(BaseModel):
    alert_student_below_threshold: bool
    session_not_closed_reminder: bool
    weekly_summary: bool
    new_student_enrolled: bool

class LecturerPasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class NotificationResponse(BaseModel):
    id: UUID
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime


class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    total: int
    unread_count: int
