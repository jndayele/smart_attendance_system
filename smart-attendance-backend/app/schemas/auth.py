from pydantic import BaseModel, EmailStr
from typing import Optional

class SetupRequest(BaseModel):
    institution_name: str
    admin_name: str
    admin_email: EmailStr
    admin_password: str
    academic_year_format: str = "YYYY/YYYY"

class SetupResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    institution_id: str

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
