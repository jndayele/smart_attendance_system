from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
import re

class AcademicYearCreate(BaseModel):
    year_label: str
    set_as_active: bool = False

    @field_validator('year_label')
    def validate_year_label(cls, v):
        if not re.match(r'^\d{4}/\d{4}$', v):
            raise ValueError('year_label must be in format YYYY/YYYY')
        years = v.split('/')
        if int(years[1]) != int(years[0]) + 1:
            raise ValueError('Second year must be one year after the first year')
        return v

class AcademicYearUpdate(BaseModel):
    year_label: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator('year_label')
    def validate_year_label(cls, v):
        if v is not None:
            if not re.match(r'^\d{4}/\d{4}$', v):
                raise ValueError('year_label must be in format YYYY/YYYY')
            years = v.split('/')
            if int(years[1]) != int(years[0]) + 1:
                raise ValueError('Second year must be one year after the first year')
        return v

class SemesterCreate(BaseModel):
    academic_year_id: UUID
    name: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class SemesterUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None
    is_closed: Optional[bool] = None

class SemesterResponse(BaseModel):
    id: UUID
    academic_year_id: UUID
    name: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool
    is_closed: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AcademicYearResponse(BaseModel):
    id: UUID
    year_label: str
    is_active: bool
    semesters: List[SemesterResponse]
    created_at: datetime

    class Config:
        from_attributes = True

class AcademicYearListResponse(BaseModel):
    academic_years: List[AcademicYearResponse]
    total: int
