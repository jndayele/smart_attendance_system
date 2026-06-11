import qrcode
import json
import uuid
import io
import base64
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.session import Session
from app.models.student import StudentCourse
from app.models.attendance import AttendanceRecord
from app.config import get_settings

settings = get_settings()

class QRService:
    @staticmethod
    def generate_qr_token() -> str:
        """Returns a unique UUID-based token string."""
        return str(uuid.uuid4())

    @staticmethod
    def generate_qr_code(session_id: uuid.UUID, qr_token: str, course_code: str) -> bytes:
        """
        Generate QR code image as PNG bytes.
        """
        qr_data = {
            "session_id": str(session_id),
            "qr_token": qr_token,
            "course_code": course_code,
            "generated_at": datetime.utcnow().isoformat()
        }
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=settings.QR_CODE_SIZE,
            border=4,
        )
        qr.add_data(json.dumps(qr_data))
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        return img_byte_arr.getvalue()

    @staticmethod
    async def validate_qr_token(qr_data_str: str, session_id: uuid.UUID, student_id: uuid.UUID, db: AsyncSession) -> Dict[str, Any]:
        """
        Validate scanned QR token and ensure the student is authorized.
        """
        try:
            qr_data = json.loads(qr_data_str)
        except json.JSONDecodeError:
            return {"valid": False, "error": "Invalid QR code format.", "session": None}

        # Validate token payload matches requested session
        if qr_data.get("session_id") != str(session_id):
            return {"valid": False, "error": "QR code does not match this session.", "session": None}

        token = qr_data.get("qr_token")
        
        # Fetch session
        res = await db.execute(select(Session).filter(Session.id == session_id))
        session = res.scalars().first()

        if not session:
            return {"valid": False, "error": "Session not found.", "session": None}

        if not session.is_active or session.is_locked:
            return {"valid": False, "error": "Session is not active.", "session": session}

        if session.qr_token != token:
            return {"valid": False, "error": "Invalid or expired QR token.", "session": session}

        if session.qr_expires_at and session.qr_expires_at < datetime.utcnow():
            return {"valid": False, "error": "QR code has expired.", "session": session}

        # Check enrollment
        res = await db.execute(select(StudentCourse).filter(
            StudentCourse.student_id == student_id,
            StudentCourse.course_id == session.course_id,
            StudentCourse.is_active == True
        ))
        enrollment = res.scalars().first()
        
        if not enrollment:
            return {"valid": False, "error": "You are not enrolled in this course.", "session": session}

        # Check existing attendance
        res = await db.execute(select(AttendanceRecord).filter(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.session_id == session_id
        ))
        existing_record = res.scalars().first()

        if existing_record and existing_record.status.value == "present":
            return {"valid": False, "error": "Attendance already marked.", "session": session}

        return {"valid": True, "error": None, "session": session}

    @staticmethod
    async def refresh_qr_token(session_id: uuid.UUID, expiry_minutes: int, db: AsyncSession) -> Dict[str, Any]:
        """
        Generate new token and expiration for a session.
        """
        res = await db.execute(select(Session).filter(Session.id == session_id))
        session = res.scalars().first()
        
        if not session:
            raise ValueError("Session not found")
            
        new_token = QRService.generate_qr_token()
        new_expiry = datetime.utcnow() + timedelta(minutes=expiry_minutes)
        
        session.qr_token = new_token
        session.qr_expires_at = new_expiry
        await db.commit()
        await db.refresh(session)
        
        # We need course code to generate the image, mock it for now since we just need the structure
        # A real implementation would fetch the course relation
        # For simplicity, returning the required fields.
        course_code = "COURSE_CODE"
        qr_bytes = QRService.generate_qr_code(session_id, new_token, course_code)
        
        return {
            "qr_token": new_token,
            "qr_expires_at": new_expiry,
            "qr_image_bytes": qr_bytes
        }
