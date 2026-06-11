from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.lecturer import Lecturer
from app.models.student import Student
from app.schemas.auth import (
    SetupRequest, SetupResponse, LoginRequest, LoginResponse, 
    ForgotPasswordRequest, ResetPasswordRequest, ActivateLecturerRequest,
    TokenResponse, UserProfileResponse
)
from app.services.auth_service import AuthService
from app.utils.security import create_access_token
from app.dependencies import get_current_user

router = APIRouter(tags=["auth"])

@router.post("/setup", response_model=SetupResponse, status_code=status.HTTP_201_CREATED)
async def setup_system(request: SetupRequest, db: AsyncSession = Depends(get_db)):
    """First-time system setup. Only works if institution not yet set up."""
    access_token, institution_id = await AuthService.setup_institution(db, request)
    return SetupResponse(
        access_token=access_token,
        institution_id=institution_id
    )

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT."""
    # Note: Request IP might be added if needed
    access_token, role, user_id, name = await AuthService.login_user(db, request.email, request.password)
    return LoginResponse(
        access_token=access_token,
        role=role,
        user_id=user_id,
        name=name
    )

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Send password reset email."""
    await AuthService.forgot_password(db, request.email)
    return {"message": "If that email exists, a password reset link has been sent."}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using token."""
    await AuthService.reset_password(db, request.token, request.new_password)
    return {"message": "Password reset successfully"}

@router.post("/activate-lecturer", response_model=TokenResponse)
async def activate_lecturer(request: ActivateLecturerRequest, db: AsyncSession = Depends(get_db)):
    """Activate lecturer account from email link."""
    access_token = await AuthService.activate_lecturer(db, request.token, request.password)
    return TokenResponse(access_token=access_token)

@router.post("/register-student", response_model=TokenResponse)
async def register_student(
    token: str = Form(...),
    password: str = Form(...),
    face_photo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Register student account and encode face."""
    image_bytes = await face_photo.read()
    access_token = await AuthService.register_student(db, token, password, image_bytes)
    return TokenResponse(access_token=access_token)

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(current_user: User = Depends(get_current_user)):
    """Refresh JWT token."""
    access_token = create_access_token(data={"sub": str(current_user.id), "role": current_user.role.value})
    return TokenResponse(access_token=access_token)

@router.get("/me", response_model=UserProfileResponse)
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get current user basic profile."""
    name = None
    if current_user.role == RoleEnum.lecturer:
        res = await db.execute(select(Lecturer).filter(Lecturer.user_id == current_user.id))
        lec = res.scalars().first()
        if lec: name = lec.name
    elif current_user.role == RoleEnum.student:
        res = await db.execute(select(Student).filter(Student.user_id == current_user.id))
        stu = res.scalars().first()
        if stu: name = stu.name
    else:
        name = "Administrator"

    return UserProfileResponse(
        user_id=str(current_user.id),
        email=current_user.email,
        role=current_user.role.value,
        name=name
    )

