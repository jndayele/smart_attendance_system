import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    shortcode = Column(String(20), nullable=True)
    tagline = Column(String(500), nullable=True)
    country = Column(String(100), nullable=True)
    timezone = Column(String(100), nullable=True, default='Africa/Accra')
    accent_color = Column(String(10), nullable=True, default='#F59E0B')
    admin_name = Column(String(255), nullable=True)
    logo_url = Column(String(500), nullable=True)
    admin_email = Column(String(255), unique=True, nullable=False)
    is_setup = Column(Boolean, default=False)
    settings_data = Column(JSON, nullable=True, default={})
    notification_settings = Column(JSON, nullable=True, default={})
    smtp_settings = Column(JSON, nullable=True, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
