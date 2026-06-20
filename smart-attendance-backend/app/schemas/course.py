from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class CourseCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    code: str = Field(..., min_length=1, max_length=20)
    programme_id: UUID
    semester_id: Optional[UUID] = None
    level: int
    semester_number: int = Field(..., ge=1, le=2)
    credit_hours: int = Field(3, ge=1, le=6)
    threshold_pct: Optional[int] = Field(None, ge=50, le=100)
    lecturer_id: Optional[UUID] = None

    @field_validator('code')
    def uppercase_code(cls, v):
        return v.upper()

    @field_validator('level')
    def validate_level(cls, v):
        if v not in [100, 200, 300, 400, 500, 600]:
            raise ValueError('level must be one of 100, 200, 300, 400, 500, 600')
        return v

class CourseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    code: Optional[str] = Field(None, min_length=1, max_length=20)
    programme_id: Optional[UUID] = None
    semester_id: Optional[UUID] = None
    level: Optional[int] = None
    semester_number: Optional[int] = Field(None, ge=1, le=2)
    credit_hours: Optional[int] = Field(None, ge=1, le=6)
    threshold_pct: Optional[int] = Field(None, ge=50, le=100)
    lecturer_id: Optional[UUID] = None
    is_active: Optional[bool] = None

    @field_validator('code')
    def uppercase_code(cls, v):
        if v is not None:
            return v.upper()
        return v
        
    @field_validator('level')
    def validate_level(cls, v):
        if v is not None and v not in [100, 200, 300, 400, 500, 600]:
            raise ValueError('level must be one of 100, 200, 300, 400, 500, 600')
        return v

class BulkWarnRequest(BaseModel):
    student_ids: List[UUID]

class CourseResponse(BaseModel):
    id: UUID
    title: str
    code: str
    programme_id: UUID
    programme_name: str
    programme_code: str
    semester_id: Optional[UUID] = None
    level: int
    semester_number: int
    credit_hours: int
    threshold_pct: int
    is_active: bool
    lecturer_id: Optional[UUID] = None
    lecturer_name: Optional[str] = None
    enrolled_student_count: int
    session_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CourseCloneRequest(BaseModel):
    new_semester_id: UUID
    new_semester_number: int = Field(..., ge=1, le=2)

class CourseListResponse(BaseModel):
    courses: List[CourseResponse]
    total: int

from datetime import time

class ClassScheduleCreate(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    start_time: time
    end_time: time
    room: Optional[str] = None

class ClassScheduleResponse(ClassScheduleCreate):
    id: UUID
    course_id: UUID
    class Config:
        from_attributes = True
