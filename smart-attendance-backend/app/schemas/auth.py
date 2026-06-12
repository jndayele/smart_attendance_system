from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional

class InstitutionSetupRequest(BaseModel):
    institution_name: str = Field(..., min_length=2, max_length=255)
    shortcode: str = Field(..., min_length=2, max_length=20)
    tagline: str = Field(..., min_length=5, max_length=500)
    country: str = Field(..., min_length=2, max_length=100)
    timezone: str = Field(default='Africa/Accra', max_length=100)
    accent_color: str = Field(default='#F59E0B', max_length=10)
    admin_name: str = Field(..., min_length=2, max_length=255)
    admin_email: EmailStr
    academic_year: str = Field(..., pattern=r'^\d{4}/\d{4}$')
    current_semester: str = Field(default='Semester 1',
                                   pattern=r'^Semester [12]$')

    @validator('shortcode')
    def uppercase_shortcode(cls, v):
        return v.upper().strip()

    @validator('academic_year')
    def validate_year_sequence(cls, v):
        parts = v.split('/')
        if int(parts[1]) != int(parts[0]) + 1:
            raise ValueError('Second year must be exactly one more than first year')
        return v

    @validator('accent_color')
    def validate_hex_color(cls, v):
        import re
        if not re.match(r'^#[0-9A-Fa-f]{6}$', v):
            raise ValueError('Must be a valid hex color e.g. #F59E0B')
        return v

class InstitutionSetupResponse(BaseModel):
    message: str
    institution_id: str
    admin_email: str
    setup_complete: bool = True

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    name: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ActivateLecturerRequest(BaseModel):
    token: str
    password: str

# Student registration uses form-data because of the photo upload, so no explicit pydantic schema for the body,
# but we can define the response schema
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserProfileResponse(BaseModel):
    user_id: str
    email: str
    role: str
    name: Optional[str] = None
