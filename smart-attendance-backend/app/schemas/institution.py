from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID

class InstitutionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    admin_name: Optional[str] = None
    admin_email: Optional[EmailStr] = None

class SystemSettingsUpdate(BaseModel):
    qr_default_expiry_minutes: Optional[int] = Field(None, ge=5, le=60)
    session_code_length: Optional[int] = Field(None, ge=4, le=8)
    face_confidence_threshold: Optional[int] = Field(None, ge=60, le=99)
    liveness_detection_enabled: Optional[bool] = None
    max_login_attempts: Optional[int] = Field(None, ge=3, le=10)
    lockout_duration_minutes: Optional[int] = Field(None, ge=5, le=60)
    attendance_default_threshold: Optional[int] = Field(None, ge=50, le=100)

class NotificationSettingsUpdate(BaseModel):
    alert_below_80: Optional[bool] = None
    alert_below_75: Optional[bool] = None
    alert_below_70: Optional[bool] = None
    lecturer_inactive_weeks: Optional[int] = None
    expired_invitation_alert: Optional[bool] = None
    weekly_summary_enabled: Optional[bool] = None
    session_not_ended_hours: Optional[int] = None

class AdminPasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

class SMTPSettingsUpdate(BaseModel):
    mail_server: str
    mail_port: int
    mail_username: str
    mail_password: str
    mail_from: EmailStr
    mail_from_name: str
    mail_starttls: bool
    mail_ssl_tls: bool

class InstitutionResponse(BaseModel):
    id: UUID
    name: str
    logo_url: Optional[str] = None
    admin_email: str
    is_setup: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: UUID
    performed_by: Optional[UUID] = None
    performed_by_name: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[UUID] = None
    details: Optional[dict] = None
    ip_address: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
