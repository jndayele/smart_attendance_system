import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import enum

class RoleEnum(str, enum.Enum):
    admin = "admin"
    lecturer = "lecturer"
    student = "student"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    display_name = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=True)
    role = Column(Enum(RoleEnum), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    failed_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    last_login = Column(DateTime, nullable=True)
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expiry = Column(DateTime, nullable=True)
    notification_preferences = Column(
        JSON,
        nullable=True,
        default=lambda: {
            "alert_below_80": True,
            "alert_below_75": True,
            "alert_below_70": True,
            "session_started_alert": True,
            "session_ending_soon": True,
            "weekly_summary": False,
            "new_student_enrolled": False,
            "alert_student_below_threshold": True,
            "session_not_closed_reminder": True
        }
    )
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
