from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class StudentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    student_id: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    department_id: UUID
    programme_id: UUID
    level: int
    semester_of_entry: int = Field(..., ge=1, le=2)

    @field_validator('level')
    def validate_level(cls, v):
        if v not in [100, 200, 300, 400, 500, 600]:
            raise ValueError('level must be one of 100, 200, 300, 400, 500, 600')
        return v

class StudentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    department_id: Optional[UUID] = None
    programme_id: Optional[UUID] = None
    level: Optional[int] = None

    @field_validator('level')
    def validate_level(cls, v):
        if v is not None and v not in [100, 200, 300, 400, 500, 600]:
            raise ValueError('level must be one of 100, 200, 300, 400, 500, 600')
        return v

class StudentBulkImportRow(BaseModel):
    name: str
    student_id: str
    email: str
    department_code: str
    programme_code: str
    level: int
    semester_of_entry: int

class StudentBulkImportRequest(BaseModel):
    students: List[StudentBulkImportRow]

class StudentBulkImportResponse(BaseModel):
    total_submitted: int
    total_created: int
    total_failed: int
    errors: List[dict]
    created_student_ids: List[UUID]

class StudentMoveLevel(BaseModel):
    new_level: int
    
    @field_validator('new_level')
    def validate_new_level(cls, v):
        if v not in [100, 200, 300, 400, 500, 600]:
            raise ValueError('level must be one of 100, 200, 300, 400, 500, 600')
        return v

class ManualAttendanceOverride(BaseModel):
    session_id: UUID
    student_id: UUID
    status: str
    reason: str = Field(..., min_length=10)

    @field_validator('status')
    def validate_status(cls, v):
        if v not in ['present', 'absent']:
            raise ValueError('status must be present or absent')
        return v

class StudentResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    student_id: str
    email: str
    department_id: UUID
    department_name: str
    programme_id: UUID
    programme_name: str
    level: int
    semester_of_entry: int
    face_registered: bool
    is_suspended: bool
    is_active: bool
    is_verified: bool
    invitation_status: str
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AttendanceRecordResponse(BaseModel):
    id: UUID
    session_id: UUID
    course_id: UUID
    course_code: str
    session_date: datetime
    status: str
    method: Optional[str] = None
    is_manual_override: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CourseAttendanceSummary(BaseModel):
    course_id: UUID
    course_title: str
    course_code: str
    sessions_present: int
    sessions_total: int
    attendance_pct: float
    threshold_pct: int
    status: str  # "good" | "at_risk" | "defaulter"

    class Config:
        from_attributes = True

class StudentDetailResponse(StudentResponse):
    enrolled_courses: List[CourseAttendanceSummary]
    recent_attendance: List[AttendanceRecordResponse]

class StudentListResponse(BaseModel):
    students: List[StudentResponse]
    total: int
