import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    student_id = Column(String(50), unique=True, nullable=False)
    programme_id = Column(UUID(as_uuid=True), ForeignKey("programmes.id"), nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=False)
    level = Column(Integer, nullable=False)
    semester_of_entry = Column(Integer, nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    
    # Stores ArcFace 512-dimensional float vector
    face_encoding = Column(Vector(512), nullable=True)
    face_registered = Column(Boolean, default=False)
    profile_picture_url = Column(String(500), nullable=True)
    
    invitation_token = Column(String(255), nullable=True)
    invitation_token_expiry = Column(DateTime, nullable=True)
    is_suspended = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User")
    programme = relationship("Programme")
    department = relationship("Department")
    enrolled_courses = relationship("StudentCourse", back_populates="student", cascade="all, delete-orphan")

class StudentCourse(Base):
    __tablename__ = "student_courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    __table_args__ = (
        UniqueConstraint('student_id', 'course_id', name='uq_student_course'),
    )

    # Relationships
    student = relationship("Student", back_populates="enrolled_courses")
    course = relationship("Course")
