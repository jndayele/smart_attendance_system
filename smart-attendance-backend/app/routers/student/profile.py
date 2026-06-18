"""
Student Profile Router.

Handles profile management, password updates, face photo registration, and notifications.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, update

from app.database import get_db
from app.dependencies import require_student
from app.models.user import User
from app.models.student import Student, StudentCourse
from app.models.department import Department
from app.models.programme import Programme
from app.models.notification import Notification
from app.models.course import Course
from app.models.session import Session
from app.models.attendance import AttendanceRecord
from app.utils.security import verify_password, hash_password
from app.services.face_service import FaceService
from app.services.notification_service import NotificationService
from app.schemas.student_portal import (
    StudentProfileResponse,
    StudentProfileUpdate,
    StudentPasswordChange,
    FacePhotoUpdateResponse,
    StudentNotificationPreferences,
    StudentDashboardStats,
    StudentCourseCard
)
from app.schemas.notification import NotificationListResponse, NotificationResponse

router = APIRouter(dependencies=[Depends(require_student)])


async def get_student(user_id, db: AsyncSession):
    res = await db.execute(select(Student).filter(Student.user_id == user_id))
    s = res.scalars().first()
    if not s:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return s


@router.get("/", response_model=StudentProfileResponse, summary="Get Full Profile")
async def get_profile(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    student = await get_student(current_user.id, db)
    
    res_details = await db.execute(
        select(Department.name, Programme.name)
        .join(Programme, Programme.department_id == Department.id)
        .filter(Programme.id == student.programme_id)
    )
    d_name, p_name = res_details.first() or ("Unknown", "Unknown")

    from app.routers.student.dashboard import get_dashboard
    dashboard_data = await get_dashboard(current_user, db)

    return StudentProfileResponse(
        id=student.id,
        user_id=student.user_id,
        name=student.name,
        student_number=student.student_id,
        email=current_user.email,
        department_name=d_name,
        programme_name=p_name,
        level=student.level,
        semester_of_entry=student.semester_of_entry,
        face_registered=student.face_registered,
        is_active=current_user.is_active,
        last_login=current_user.last_login,
        created_at=student.created_at,
        enrolled_courses=dashboard_data.enrolled_courses,
        overall_stats=dashboard_data.stats
    )


@router.patch("/", response_model=StudentProfileResponse, summary="Update Profile")
async def update_profile(
    updates: StudentProfileUpdate,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    student = await get_student(current_user.id, db)
    
    if updates.display_name is not None:
        student.name = updates.display_name
    if updates.phone is not None:
        student.phone = updates.phone
        
    await db.commit()
    await db.refresh(student)

    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="student_profile_updated",
        entity_type="student",
        entity_id=student.id,
        details=updates.model_dump(exclude_unset=True),
        ip_address=None,
        db=db
    )

    return await get_profile(current_user, db)


@router.post("/change-password", summary="Change Password")
async def change_password(
    req: StudentPasswordChange,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
        
    if req.new_password != req.confirm_password:
        raise HTTPException(status_code=422, detail="Passwords do not match.")
        
    if req.new_password == req.current_password:
        raise HTTPException(status_code=400, detail="New password must be different from your current password.")
        
    has_digit = any(char.isdigit() for char in req.new_password)
    has_special = any(not char.isalnum() for char in req.new_password)
    
    if not (has_digit and has_special):
        raise HTTPException(status_code=422, detail="Password must contain at least one number and one special character.")

    current_user.password_hash = hash_password(req.new_password)
    await db.commit()

    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="student_password_changed",
        entity_type="user",
        entity_id=current_user.id,
        details=None,
        ip_address=None,
        db=db
    )

    return {"message": "Password updated successfully."}


@router.post("/face-photo", response_model=FacePhotoUpdateResponse, summary="Register/Update Face Photo")
async def update_face_photo(
    face_photo: UploadFile = File(...),
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    student = await get_student(current_user.id, db)
    image_bytes = await face_photo.read()
    
    val_res = FaceService.validate_photo_requirements(image_bytes)
    if not val_res["valid"]:
        raise HTTPException(status_code=400, detail=val_res["error"])
        
    try:
        encoding = FaceService.extract_face_encoding(image_bytes)
        await FaceService.check_duplicate_face(db, encoding, exclude_student_id=student.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Face encoding failed. Please try again.")

    student.face_encoding = encoding
    student.face_registered = True
    
    import datetime
    student.updated_at = datetime.datetime.utcnow()
    await db.commit()

    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="student_face_updated",
        entity_type="student",
        entity_id=student.id,
        details=None,
        ip_address=None,
        db=db
    )

    await NotificationService.create_notification(
        user_id=current_user.id,
        type="face_updated",
        title="Face Photo Updated",
        message="Your face recognition data has been updated successfully. You can now use face scan for attendance.",
        db=db
    )

    return FacePhotoUpdateResponse(
        success=True,
        message="Face registered successfully.",
        face_registered=True,
        updated_at=student.updated_at
    )


@router.get("/notifications", response_model=NotificationListResponse, summary="Get Notifications")
async def get_notifications(
    is_read: Optional[bool] = None,
    type: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    query = select(Notification).filter(Notification.user_id == current_user.id)
    
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    if type:
        query = query.filter(Notification.type == type)
        
    query = query.order_by(Notification.created_at.desc())

    res_total = await db.execute(select(func.count(Notification.id)).select_from(query.subquery()))
    total = res_total.scalar() or 0

    res_unread = await db.execute(
        select(func.count(Notification.id))
        .filter(Notification.user_id == current_user.id, Notification.is_read == False)
    )
    unread_count = res_unread.scalar() or 0

    res = await db.execute(query.offset((page - 1) * limit).limit(limit))
    notifications = res.scalars().all()

    notif_list = [
        NotificationResponse(
            id=n.id,
            type=n.type,
            title=n.title,
            message=n.message,
            is_read=n.is_read,
            created_at=n.created_at
        ) for n in notifications
    ]

    return NotificationListResponse(notifications=notif_list, total=total, unread_count=unread_count)


@router.patch("/notifications/{notification_id}/read", response_model=NotificationResponse, summary="Mark Notification as Read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Notification).filter(Notification.id == notification_id))
    n = res.scalars().first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    if str(n.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    n.is_read = True
    await db.commit()
    await db.refresh(n)
    return NotificationResponse(
        id=n.id,
        type=n.type,
        title=n.title,
        message=n.message,
        is_read=n.is_read,
        created_at=n.created_at
    )


@router.post("/notifications/mark-all-read", summary="Mark All Notifications as Read")
async def mark_all_notifications_read(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id)
        .where(Notification.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
    return {"message": "All notifications marked as read."}


@router.delete("/notifications/{notification_id}", summary="Delete Notification")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Notification).filter(Notification.id == notification_id))
    n = res.scalars().first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    if str(n.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    await db.delete(n)
    await db.commit()
    return {"message": "Notification deleted."}


@router.get("/notification-preferences", response_model=StudentNotificationPreferences, summary="Get Notification Preferences")
async def get_notification_preferences(
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    # Fetch fresh user object with notification_preferences JSON field
    res = await db.execute(select(User).filter(User.id == current_user.id))
    user = res.scalars().first()
    prefs = (user.notification_preferences or {}) if user else {}

    defaults = {
        "alert_below_80": True,
        "alert_below_75": True,
        "alert_below_70": True,
        "session_started_alert": True,
        "session_ending_soon": True,
        "weekly_summary": False
    }
    merged = {**defaults, **prefs}
    # Institution policy — alert_below_75 is always True
    merged["alert_below_75"] = True
    return StudentNotificationPreferences(**merged)


@router.patch("/notification-preferences", response_model=StudentNotificationPreferences, summary="Update Notification Preferences")
async def update_notification_preferences(
    prefs: StudentNotificationPreferences,
    current_user: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(User).filter(User.id == current_user.id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = user.notification_preferences or {}
    incoming = prefs.model_dump()
    # Silently enforce institution policy
    incoming["alert_below_75"] = True
    updated = {**existing, **incoming}
    user.notification_preferences = updated
    await db.commit()

    await NotificationService.log_audit_action(
        performed_by=current_user.id,
        action="student_notification_preferences_updated",
        entity_type="student",
        entity_id=current_user.id,
        details=updated,
        ip_address=None,
        db=db
    )
    
    return StudentNotificationPreferences(**updated)
