from datetime import datetime, timedelta
import re
from typing import Optional
import logging
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.lecturer import Lecturer
from app.models.student import Student
from app.models.institution import Institution
from app.models.academic_year import AcademicYear, Semester
from app.schemas.auth import (
    InstitutionSetupResponse, LoginRequest, LoginResponse, 
    ForgotPasswordRequest, ResetPasswordRequest, ActivateLecturerRequest,
    TokenResponse, UserProfileResponse
)
from app.services.auth_service import AuthService
from app.services.cloudinary_service import upload_image
from app.services.email_service import send_admin_welcome_email
from app.services.notification_service import NotificationService
from app.utils.security import create_access_token, generate_secure_password, hash_password
from app.dependencies import get_current_user
from app.config import get_settings

router = APIRouter(tags=["auth"])
logger = logging.getLogger(__name__)
settings = get_settings()

@router.get("/setup-status")
async def check_setup_status(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Institution).limit(1))
    inst = result.scalars().first()
    
    # Try to find active academic year and semester
    acad_res = await db.execute(select(AcademicYear).filter(AcademicYear.is_active == True))
    active_year = acad_res.scalars().first()
    
    active_sem = None
    if active_year:
        sem_res = await db.execute(select(Semester).filter(Semester.academic_year_id == active_year.id, Semester.is_active == True))
        active_sem = sem_res.scalars().first()

    return {
        "is_setup": bool(inst and inst.is_setup),
        "institution_name": inst.name if inst else None,
        "shortcode": inst.shortcode if inst else None,
        "tagline": inst.tagline if inst else None,
        "logo_url": inst.logo_url if inst else None,
        "accent_color": inst.accent_color if inst else "#F59E0B",
        "academic_year": active_year.year_label if active_year else None,
        "current_semester": active_sem.name if active_sem else None,
    }

@router.post("/setup", status_code=status.HTTP_201_CREATED, response_model=InstitutionSetupResponse)
async def setup_institution(
    institution_name: str = Form(...),
    shortcode: str = Form(...),
    tagline: str = Form(...),
    country: str = Form(...),
    timezone: str = Form(default='Africa/Accra'),
    accent_color: str = Form(default='#F59E0B'),
    admin_name: str = Form(...),
    admin_email: str = Form(...),
    academic_year: Optional[str] = Form(default=None),
    current_semester: Optional[str] = Form(default=None),
    logo: Optional[UploadFile] = File(default=None),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Institution).filter(Institution.is_setup == True))
    if result.scalars().first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Institution has already been set up. Please log in instead.")

    shortcode_clean = shortcode.upper().strip()
    if not (2 <= len(shortcode_clean) <= 20):
        raise HTTPException(status_code=422, detail="Shortcode must be between 2 and 20 characters.")
    
    if academic_year is not None:
        if not re.match(r'^\d{4}/\d{4}$', academic_year):
            raise HTTPException(status_code=422, detail="Academic year must match YYYY/YYYY.")
        parts = academic_year.split('/')
        if int(parts[1]) != int(parts[0]) + 1:
            raise HTTPException(status_code=422, detail="Second year must be exactly one more than first year")

    if not re.match(r'^#[0-9A-Fa-f]{6}$', accent_color):
        raise HTTPException(status_code=422, detail="Must be a valid hex color e.g. #F59E0B")

    if not re.match(r'^[^@]+@[^@]+\.[^@]+$', admin_email):
        raise HTTPException(status_code=422, detail="Invalid email format.")

    if current_semester is not None and current_semester not in ["Semester 1", "Semester 2"]:
        raise HTTPException(status_code=422, detail="current_semester must be 'Semester 1' or 'Semester 2'")

    logo_url = None
    if logo:
        if logo.content_type not in ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']:
            raise HTTPException(status_code=400, detail="Invalid file type. Use PNG, JPG, or SVG")
        logo_bytes = await logo.read()
        if len(logo_bytes) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Logo file too large. Maximum 5MB")
        try:
            logo_url = await upload_image(logo_bytes, folder="institution_logos", public_id=f"logo_{shortcode_clean.lower()}")
        except Exception as e:
            logger.warning(f"Failed to upload logo: {e}")

    raw_password = generate_secure_password(length=12)
    hashed_pwd = hash_password(raw_password)

    institution = Institution(
        name=institution_name,
        shortcode=shortcode_clean,
        tagline=tagline,
        country=country,
        timezone=timezone,
        logo_url=logo_url,
        accent_color=accent_color,
        admin_name=admin_name,
        admin_email=admin_email,
        is_setup=True
    )
    db.add(institution)
    await db.flush()

    admin_user = User(
        email=admin_email,
        password_hash=hashed_pwd,
        role=RoleEnum.admin,
        is_active=True,
        is_verified=True,
        display_name=admin_name,
        failed_attempts=0
    )
    db.add(admin_user)
    await db.flush()

    # Only create academic year/semester if provided during setup
    if academic_year:
        acad_year = AcademicYear(
            institution_id=institution.id,
            year_label=academic_year,
            is_active=True
        )
        db.add(acad_year)
        await db.flush()

        sem_name = current_semester or "Semester 1"
        semester = Semester(
            academic_year_id=acad_year.id,
            name=sem_name,
            is_active=True,
            is_closed=False
        )
        db.add(semester)

    await db.commit()
    await db.refresh(institution)

    login_url = f"{settings.FRONTEND_URL}/login"
    try:
        await send_admin_welcome_email(
            to_email=admin_email,
            admin_name=admin_name,
            institution_name=institution_name,
            generated_password=raw_password,
            login_url=login_url
        )
    except Exception as e:
        logger.warning(f"Failed to send welcome email: {e}")

    try:
        await NotificationService.log_audit_action(
            performed_by=admin_user.id,
            action="System Setup",
            entity_type="Institution",
            entity_id=institution.id,
            details={"action": "Initial system setup"},
            ip_address=None,
            db=db
        )
    except Exception as e:
        logger.warning(f"Failed to log audit action: {e}")

    return InstitutionSetupResponse(
        message=f"Institution setup complete. Your login credentials have been sent to {admin_email}",
        institution_id=str(institution.id),
        admin_email=admin_email,
        setup_complete=True
    )

@router.get("/public-settings")
async def get_public_settings(db: AsyncSession = Depends(get_db)):
    """Get public institution settings for the frontend (logo, name, colors)."""
    res = await db.execute(select(Institution).limit(1))
    inst = res.scalars().first()
    if not inst:
        return {
            "institutionName": "University Portal",
            "shortCode": "UNI",
            "logoUrl": "",
            "accentColor": "#F59E0B"
        }
    return {
        "institutionName": inst.name,
        "shortCode": inst.shortcode,
        "tagline": inst.tagline,
        "logoUrl": inst.logo_url,
        "accentColor": inst.accent_color
    }

@router.post("/login", response_model=LoginResponse)
async def login(request: Request, body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT."""
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")
    access_token, role, user_id, name = await AuthService.login_user(db, body.email, body.password, ip_address, user_agent)
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

@router.get("/validate-student-invitation")
async def validate_student_invitation(token: str, db: AsyncSession = Depends(get_db)):
    """Validate student invitation token and return pre-filled details."""
    data = await AuthService.validate_student_invitation(db, token)
    return data

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
    student_id = None
    programme_name = None
    level = None
    profile_picture_url = None

    if current_user.role == RoleEnum.lecturer:
        res = await db.execute(select(Lecturer).filter(Lecturer.user_id == current_user.id))
        lec = res.scalars().first()
        if lec: name = lec.name
    elif current_user.role == RoleEnum.student:
        res = await db.execute(select(Student).filter(Student.user_id == current_user.id))
        stu = res.scalars().first()
        if stu: 
            name = stu.name
            student_id = stu.student_id
            level = stu.level
            profile_picture_url = stu.profile_picture_url
            from app.models.programme import Programme
            prog_res = await db.execute(select(Programme).filter(Programme.id == stu.programme_id))
            prog = prog_res.scalars().first()
            if prog: programme_name = prog.name
    else:
        name = current_user.display_name if current_user.display_name else "Administrator"

    return UserProfileResponse(
        user_id=str(current_user.id),
        email=current_user.email,
        role=current_user.role.value,
        name=name,
        student_id=student_id,
        programme=programme_name,
        level=level,
        profile_picture_url=profile_picture_url
    )

