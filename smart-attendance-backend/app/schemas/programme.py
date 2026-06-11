from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class ProgrammeCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    code: str = Field(..., min_length=1, max_length=10)
    department_id: UUID
    duration_years: int = Field(..., ge=1, le=6)
    is_active: bool = True

    @field_validator('code')
    def uppercase_code(cls, v):
        return v.upper()

class ProgrammeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    code: Optional[str] = Field(None, min_length=1, max_length=10)
    department_id: Optional[UUID] = None
    duration_years: Optional[int] = Field(None, ge=1, le=6)
    is_active: Optional[bool] = None

    @field_validator('code')
    def uppercase_code(cls, v):
        if v is not None:
            return v.upper()
        return v

class ProgrammeResponse(BaseModel):
    id: UUID
    name: str
    code: str
    department_id: UUID
    department_name: str
    duration_years: int
    levels: List[int]
    is_active: bool
    student_count: int
    course_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProgrammeListResponse(BaseModel):
    programmes: List[ProgrammeResponse]
    total: int
