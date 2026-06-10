from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update

from app.database import get_db
from app.models.institution import Institution
from app.models.user import User, RoleEnum
from app.models.lecturer import Lecturer
from app.models.student import Student
from app.schemas.auth import (
    SetupRequest, SetupResponse, LoginRequest, LoginResponse, 
    ForgotPasswordRequest, ResetPasswordRequest, ActivateLecturerRequest,
    TokenResponse, UserProfileResponse
)
from app.utils.security import (
    hash_password, verify_password, create_access_token, 
    create_reset_token, decode_token
)
from app.services.face_service import FaceService
from app.dependencies import get_current_user
from app.config import get_settings

settings = get_settings()
router = APIRouter(tags=["auth"])

@router.post("/setup", response_model=SetupResponse, status_code=status.HTTP_201_CREATED)
async def setup_system(request: SetupRequest, db: AsyncSession = Depends(get_db)):
    """First-time system setup. Only works if institution not yet set up."""
    # Check if any institution exists and is setup
    result = await db.execute(select(Institution).filter(Institution.is_setup == True))
    if result.scalars().first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="System is already set up.")

    # Create institution
    institution = Institution(
        name=request.institution_name,
        admin_email=request.admin_email,
        is_setup=True
    )
    db.add(institution)
    await db.commit()
    await db.refresh(institution)

    # Create admin user
    admin_user = User(
        email=request.admin_email,
        password_hash=hash_password(request.admin_password),
        role=RoleEnum.admin,
        is_active=True,
        is_verified=True
    )
    db.add(admin_user)
    await db.commit()
    await db.refresh(admin_user)

    # Generate token
    access_token = create_access_token(data={"sub": str(admin_user.id), "role": admin_user.role.value})

    return SetupResponse(
        access_token=access_token,
        institution_id=str(institution.id)
    )

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT."""
    result = await db.execute(select(User).filter(User.email == request.email))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is suspended")

    # Check lockout
    if user.locked_until and user.locked_until > datetime.utcnow():
        delta = user.locked_until - datetime.utcnow()
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED, 
            detail=f"Account locked. Try again in {int(delta.total_seconds())} seconds."
        )

    # Verify password
    if not user.password_hash or not verify_password(request.password, user.password_hash):
        user.failed_attempts += 1
        if user.failed_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
        await db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Success
    user.failed_attempts = 0
    user.locked_until = None
    user.last_login = datetime.utcnow()
    await db.commit()

    # Get name
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
    
    return LoginResponse(
        access_token=access_token,
        role=user.role.value,
        user_id=str(user.id),
        name=name
    )

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Send password reset email."""
    result = await db.execute(select(User).filter(User.email == request.email))
    user = result.scalars().first()
    
    if user:
        token = create_reset_token(user.email)
        # In a real app, save hashed token to user or use stateless JWT reset.
        # Send email here (mocking for now)
        pass
        
    return {"message": "If that email exists, a password reset link has been sent."}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using token."""
    try:
        payload = decode_token(request.token)
        if payload.get("type") != "reset":
            raise HTTPException(status_code=400, detail="Invalid token type")
        email = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(request.new_password)
    user.failed_attempts = 0
    user.locked_until = None
    await db.commit()

    return {"message": "Password reset successfully"}

@router.post("/activate-lecturer", response_model=TokenResponse)
async def activate_lecturer(request: ActivateLecturerRequest, db: AsyncSession = Depends(get_db)):
    """Activate lecturer account from email link."""
    result = await db.execute(select(Lecturer).filter(Lecturer.activation_token == request.token))
    lecturer = result.scalars().first()
    
    if not lecturer or lecturer.activation_token_expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    result = await db.execute(select(User).filter(User.id == lecturer.user_id))
    user = result.scalars().first()

    user.password_hash = hash_password(request.password)
    user.is_verified = True
    user.is_active = True
    lecturer.activation_token = None
    lecturer.activation_token_expiry = None
    
    await db.commit()

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return TokenResponse(access_token=access_token)

@router.post("/register-student", response_model=TokenResponse)
async def register_student(
    token: str = Form(...),
    password: str = Form(...),
    face_photo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Register student account and encode face."""
    result = await db.execute(select(Student).filter(Student.invitation_token == token))
    student = result.scalars().first()
    
    if not student or student.invitation_token_expiry < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    # Read image
    image_bytes = await face_photo.read()
    
    # Validate photo requirements
    validation = FaceService.validate_photo_requirements(image_bytes)
    if not validation["valid"]:
        raise HTTPException(status_code=400, detail=validation["error"])

    try:
        # Extract face encoding
        encoding = FaceService.extract_face_encoding(image_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

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

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
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
