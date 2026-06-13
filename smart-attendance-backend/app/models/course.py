import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    programme_id = Column(UUID(as_uuid=True), ForeignKey("programmes.id"), nullable=False)
    semester_id = Column(UUID(as_uuid=True), ForeignKey("semesters.id"), nullable=True)
    lecturer_id = Column(UUID(as_uuid=True), ForeignKey("lecturers.id"), nullable=True)
    title = Column(String(255), nullable=False)
    code = Column(String(20), nullable=False, unique=True)
    level = Column(Integer, nullable=False)  # 100, 200, 300...
    semester_number = Column(Integer, nullable=False)  # 1 or 2
    credit_hours = Column(Integer, default=3)
    threshold_pct = Column(Integer, default=75)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    programme = relationship("Programme")
    semester = relationship("Semester")
    lecturer = relationship("Lecturer", back_populates="courses")
    schedules = relationship("ClassSchedule", back_populates="course", cascade="all, delete-orphan")
