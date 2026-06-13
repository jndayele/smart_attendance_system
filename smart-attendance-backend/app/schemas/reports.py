from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID

class AttendanceReportFilter(BaseModel):
    department_id: Optional[UUID] = None
    programme_id: Optional[UUID] = None
    course_id: Optional[UUID] = None
    student_id: Optional[UUID] = None
    academic_year_id: Optional[UUID] = None
    semester_id: Optional[UUID] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None

class ActivityItem(BaseModel):
    id: UUID
    action: str
    details: str
    entity_type: str
    performed_by: str
    created_at: datetime

class DashboardStatsResponse(BaseModel):
    total_students: int
    total_lecturers: int
    active_courses: int
    total_departments: int
    sessions_today: int
    students_below_threshold: int
    recent_activity: List[ActivityItem]
    quick_actions: List[dict] = []

class DefaulterResponse(BaseModel):
    student_id: UUID
    student_name: str
    student_number: str
    course_id: UUID
    course_title: str
    course_code: str
    programme_name: str
    current_pct: float
    threshold_pct: int
    shortfall: float
    last_checkin: Optional[datetime] = None
