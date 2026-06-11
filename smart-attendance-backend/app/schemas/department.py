from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    code: str = Field(..., min_length=1, max_length=10)
    faculty: Optional[str] = None
    is_active: bool = True

    @field_validator('code')
    def uppercase_code(cls, v):
        return v.upper()

class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    code: Optional[str] = Field(None, min_length=1, max_length=10)
    faculty: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator('code')
    def uppercase_code(cls, v):
        if v is not None:
            return v.upper()
        return v

class DepartmentResponse(BaseModel):
    id: UUID
    name: str
    code: str
    faculty: Optional[str] = None
    is_active: bool
    institution_id: UUID
    programme_count: int
    student_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DepartmentListResponse(BaseModel):
    departments: List[DepartmentResponse]
    total: int
