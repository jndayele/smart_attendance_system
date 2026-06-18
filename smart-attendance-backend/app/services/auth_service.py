from datetime import datetime, timedelta
from typing import Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status

from app.models.institution import Institution
from app.models.user import User, RoleEnum
from app.models.lecturer import Lecturer
from app.models.student import Student, StudentCourse
from app.models.programme import Programme
from app.models.course import Course
from app.services.cloudinary_service import upload_image
from app.utils.security import (
    hash_password, verify_password, create_access_token, 
    create_reset_token, decode_token
)
from app.services.face_service import FaceService
from app.config import get_settings

settings = get_settings()

class AuthService:

    @staticmethod
    async def login_user(db: AsyncSession, email: str, password: str, ip_address: Optional[str] = None) -> Tuple[str, str, str, Optional[str]]:
        result = await db.execute(select(User).filter(User.email == email))
        user = result.scalars().first()

        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is suspended")

        if user.locked_until and user.locked_until > datetime.utcnow():
            delta = user.locked_until - datetime.utcnow()
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED, 
                detail=f"Account locked. Try again in {int(delta.total_seconds())} seconds."
            )

        if not user.password_hash or not verify_password(password, user.password_hash):
            user.failed_attempts += 1
            if user.failed_attempts >= settings.MAX_LOGIN_ATTEMPTS:
                user.locked_until = datetime.utcnow() + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
            await db.commit()
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        user.failed_attempts = 0
        user.locked_until = None
        user.last_login = datetime.utcnow()
        await db.commit()

        name = None
        if user.role == RoleEnum.lecturer:
            res = await db.execute(select(Lecturer).filter(Lecturer.user_id == user.id))
            lec = res.scalars().first()
            if lec: name = lec.name
        elif user.role == RoleEnum.student:
            res = await db.execute(select(Student).filter(Student.user_id == user.id))
            stu = res.scalars().first()
            if stu: name = stu.name
        else:
            name = "Administrator"

        access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
        return access_token, user.role.value, str(user.id), name

    @staticmethod
    async def forgot_password(db: AsyncSession, email: str) -> None:
        result = await db.execute(select(User).filter(User.email == email))
        user = result.scalars().first()
        if user:
            token = create_reset_token(user.email)
            user.password_reset_token = token
            user.password_reset_expiry = datetime.utcnow() + timedelta(hours=1)
            await db.commit()
            # Send email here
            from app.services.email_service import send_password_reset_email
            
            # Fetch name
            name = "User"
            if user.role == RoleEnum.lecturer:
                res = await db.execute(select(Lecturer).filter(Lecturer.user_id == user.id))
                lec = res.scalars().first()
                if lec: name = lec.name
            elif user.role == RoleEnum.student:
                res = await db.execute(select(Student).filter(Student.user_id == user.id))
                stu = res.scalars().first()
                if stu: name = stu.name
                
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
            import asyncio
            asyncio.create_task(send_password_reset_email(user.email, name, reset_url))

    @staticmethod
    async def reset_password(db: AsyncSession, token: str, new_password: str) -> None:
        try:
            payload = decode_token(token)
            if payload.get("type") != "reset":
                raise HTTPException(status_code=400, detail="Invalid token type")
            email = payload.get("sub")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid or expired token")

        result = await db.execute(select(User).filter(User.email == email, User.password_reset_token == token))
        user = result.scalars().first()
        if not user or not user.password_reset_expiry or user.password_reset_expiry < datetime.utcnow():
            raise HTTPException(status_code=404, detail="Invalid or expired token")

        user.password_hash = hash_password(new_password)
        user.failed_attempts = 0
        user.locked_until = None
        user.password_reset_token = None
        user.password_reset_expiry = None
        await db.commit()

    @staticmethod
    async def activate_lecturer(db: AsyncSession, token: str, password: str) -> str:
        result = await db.execute(select(Lecturer).filter(Lecturer.activation_token == token))
        lecturer = result.scalars().first()
        
        if not lecturer or not lecturer.activation_token_expiry or lecturer.activation_token_expiry < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Invalid or expired token")

        result = await db.execute(select(User).filter(User.id == lecturer.user_id))
        user = result.scalars().first()

        user.password_hash = hash_password(password)
        user.is_verified = True
        user.is_active = True
        lecturer.activation_token = None
        lecturer.activation_token_expiry = None
        
        await db.commit()

        return create_access_token(data={"sub": str(user.id), "role": user.role.value})

    @staticmethod
    async def validate_student_invitation(db: AsyncSession, token: str) -> dict:
        result = await db.execute(select(Student).filter(Student.invitation_token == token))
        student = result.scalars().first()
        
        if not student or not student.invitation_token_expiry or student.invitation_token_expiry < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Invalid or expired token")

        # Get User email
        user_res = await db.execute(select(User).filter(User.id == student.user_id))
        user = user_res.scalars().first()

        # Get Programme
        prog_res = await db.execute(select(Programme).filter(Programme.id == student.programme_id))
        prog = prog_res.scalars().first()

        # Get Enrolled Courses
        sc_res = await db.execute(
            select(Course)
            .join(StudentCourse, StudentCourse.course_id == Course.id)
            .filter(StudentCourse.student_id == student.id)
        )
        courses = sc_res.scalars().all()

        return {
            "name": student.name,
            "student_id": student.student_id,
            "email": user.email if user else "",
            "programme": prog.name if prog else "",
            "level": student.level,
            "courses": [{"code": c.code, "name": c.title} for c in courses]
        }

    @staticmethod
    async def register_student(db: AsyncSession, token: str, password: str, image_bytes: bytes) -> str:
        result = await db.execute(select(Student).filter(Student.invitation_token == token))
        student = result.scalars().first()
        
        if not student or not student.invitation_token_expiry or student.invitation_token_expiry < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Invalid or expired token")

        validation = FaceService.validate_photo_requirements(image_bytes)
        if not validation["valid"]:
            raise HTTPException(status_code=400, detail=validation["error"])

        try:
            encoding = FaceService.extract_face_encoding(image_bytes)
            await FaceService.check_duplicate_face(db, encoding)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        # Upload to Cloudinary for profile picture
        try:
            profile_url = await upload_image(image_bytes, folder="students/profiles")
            student.profile_picture_url = profile_url
        except Exception as e:
            # We don't fail registration if profile upload fails, but we log it
            print(f"Cloudinary upload failed: {str(e)}")

        student.face_encoding = encoding
        student.face_registered = True
        student.invitation_token = None
        student.invitation_token_expiry = None

        result = await db.execute(select(User).filter(User.id == student.user_id))
        user = result.scalars().first()

        user.password_hash = hash_password(password)
        user.is_verified = True
        user.is_active = True
        
        await db.commit()

        return create_access_token(data={"sub": str(user.id), "role": user.role.value})
