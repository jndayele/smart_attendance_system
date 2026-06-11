import uuid
from datetime import datetime

from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint, String
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base

class SessionCodeAttempt(Base):
    __tablename__ = "session_code_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    attempts = Column(Integer, default=0, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    verified = Column(Boolean, default=False, nullable=False)
    locked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('session_id', 'student_id', name='uq_session_student_attempt'),
    )
