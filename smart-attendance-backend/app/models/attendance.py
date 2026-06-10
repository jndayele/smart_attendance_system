import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class AttendanceMethodEnum(str, enum.Enum):
    face = "face"
    qr = "qr"
    manual = "manual"

class AttendanceStatusEnum(str, enum.Enum):
    present = "present"
    absent = "absent"

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    checked_in_at = Column(DateTime, nullable=True)
    method = Column(Enum(AttendanceMethodEnum), nullable=True)
    status = Column(Enum(AttendanceStatusEnum), nullable=False)
    is_manual_override = Column(Boolean, default=False)
    override_reason = Column(String(500), nullable=True)
    override_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    override_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('session_id', 'student_id', name='uq_session_student'),
    )

    # Relationships
    session = relationship("Session")
    student = relationship("Student")
    overrider = relationship("User")
