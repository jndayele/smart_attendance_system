"""
Attendance Pydantic schemas for the Lecturer Module.

Covers individual attendance records and paginated list responses.
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class AttendanceRecordResponse(BaseModel):
    """
    Detailed representation of a single attendance record, including
    joined course and student data.
    """

    id: UUID
    session_id: UUID
    session_label: Optional[str] = None
    session_date: datetime.date
    student_id: UUID
    student_name: str
    student_number: str
    course_id: UUID
    course_title: str
    course_code: str
    checked_in_at: Optional[datetime] = None
    method: Optional[str] = None
    status: str
    is_manual_override: bool
    override_reason: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AttendanceListResponse(BaseModel):
    """
    Paginated list of attendance records with aggregated summary statistics
    for the returned set.
    """

    records: List[AttendanceRecordResponse]
    total: int
    present_count: int
    absent_count: int
    attendance_pct: float
