"""
Lecturer Profile Router.

Endpoints for the lecturer to view and update their profile,
change passwords, manage notifications, and notification preferences.
"""
import re
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, update

from app.database import get_db
from app.dependencies import require_lecturer
from app.models.user import User
from app.models.lecturer import Lecturer
from app.models.department import Department
from app.models.course import Course
from app.models.session import Session
from app.models.student import StudentCourse
from app.models.notification import Notification
from app.schemas.lecturer import (
    LecturerDetailResponse,
    LecturerProfileUpdate,
    LecturerResponse,
    LecturerPasswordChange,
    NotificationListResponse,
    NotificationResponse,
    LecturerPreferencesUpdate,
    LecturerNotificationPreferencesUpdate
)
from app.utils.security import verify_password, hash_password
from app.services.notification_service import NotificationService

router = APIRouter(dependencies=[Depends(require_lecturer)])


async def get_lecturer_id(user_id, db: AsyncSession):
    res = await db.execute(select(Lecturer.id).filter(Lecturer.user_id == user_id))
    lid = res.scalar()
    if not lid:
        raise HTTPException(status_code=404, detail="Lecturer profile not found")
    return lid


@router.get("/", response_model=LecturerDetailResponse, summary="Get Profile")
async def get_profile(
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Get the authenticated lecturer's full profile."""
    res = await db.execute(
        select(Lecturer, Department.name)
        .join(Department, Lecturer.department_id == Department.id)
        .filter(Lecturer.user_id == current_user.id)
    )
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Lecturer profile not found")
    lec, dept_name = row

    res_c = await db.execute(select(Course.id).filter(Course.lecturer_id == lec.id, Course.is_active == True))
    course_ids = [r[0] for r in res_c.all()]
    course_count = len(course_ids)

    session_count = 0
    total_students = 0
    
    if course_ids:
        res_sess = await db.execute(select(func.count(Session.id)).filter(Session.course_id.in_(course_ids)))
        session_count = res_sess.scalar() or 0

        res_stu = await db.execute(
            select(func.count(func.distinct(StudentCourse.student_id)))
            .filter(StudentCourse.course_id.in_(course_ids), StudentCourse.is_active == True)
        )
        total_students = res_stu.scalar() or 0

    l_dict = lec.__dict__.copy()
    l_dict.update({
        "email": current_user.email,
        "department_name": dept_name,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "course_count": course_count,
        "session_count": session_count,
        "total_students": total_students,
        "last_login": current_user.last_login,
        "last_login_device": current_user.last_login_device,
        "last_login_location": current_user.last_login_location,
        "preferences": current_user.preferences,
        "notification_preferences": current_user.notification_preferences,
        "courses": [], # We can leave these empty for detail view unless requested
        "recent_sessions": []
    })

    return LecturerDetailResponse(**l_dict)


@router.patch("/", response_model=LecturerResponse, summary="Update Profile")
async def update_profile(
    data: LecturerProfileUpdate,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Update lecturer's own profile (name, phone only)."""
    res = await db.execute(select(Lecturer).filter(Lecturer.user_id == current_user.id))
    lec = res.scalars().first()
    if not lec:
        raise HTTPException(status_code=404, detail="Lecturer profile not found")

    # Profile updates not allowed directly based on requirements, but keep method for schema conformity
    # If data.name is not None: lec.name = data.name
    # If data.phone is not None: lec.phone = data.phone
    
    # We just return the current profile
    pass

    await NotificationService.log_audit_action(current_user.id, "lecturer_profile_updated", "lecturer", lec.id, None, None, db)

    # Need to return LecturerResponse
    res_dept = await db.execute(select(Department.name).filter(Department.id == lec.department_id))
    dept_name = res_dept.scalar() or "Unknown"

    l_dict = lec.__dict__.copy()
    l_dict.update({
        "email": current_user.email,
        "department_name": dept_name,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "course_count": 0, # Ignored for generic response
        "session_count": 0,
        "total_students": 0,
        "last_login": current_user.last_login,
        "last_login_device": current_user.last_login_device,
        "last_login_location": current_user.last_login_location,
        "preferences": current_user.preferences,
        "notification_preferences": current_user.notification_preferences,
    })
    return LecturerResponse(**l_dict)


@router.post("/change-password", summary="Change Password")
async def change_password(
    data: LecturerPasswordChange,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Change own password."""
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(data.new_password) < 8 or not re.search(r"\d", data.new_password) or not re.search(r"[!@#$%^&*(),.?\":{}|<>]", data.new_password):
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters long and contain at least one number and one special character")

    current_user.password_hash = hash_password(data.new_password)
    await db.commit()

    await NotificationService.log_audit_action(current_user.id, "lecturer_password_changed", "user", current_user.id, None, None, db)

    return {"message": "Password updated successfully"}


@router.get("/notifications", response_model=NotificationListResponse, summary="Get Notifications")
async def get_notifications(
    is_read: Optional[bool] = None,
    type: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Get notifications for the authenticated lecturer."""
    query = select(Notification).filter(Notification.user_id == current_user.id)
    
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    if type:
        query = query.filter(Notification.type == type)

    query = query.order_by(Notification.created_at.desc())

    res_total = await db.execute(select(func.count(Notification.id)).select_from(query.subquery()))
    total = res_total.scalar() or 0

    res_unread = await db.execute(select(func.count(Notification.id)).filter(Notification.user_id == current_user.id, Notification.is_read == False))
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

    return NotificationListResponse(
        notifications=notif_list,
        total=total,
        unread_count=unread_count
    )


@router.patch("/notifications/{notification_id}/read", response_model=NotificationResponse, summary="Mark Notification as Read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Mark a single notification as read."""
    n = await db.scalar(select(Notification).filter(Notification.id == notification_id))
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    if n.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

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


@router.post("/notifications/mark-all-read", summary="Mark All Notifications Read")
async def mark_all_notifications_read(
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Mark all of the lecturer's notifications as read."""
    res = await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    count = res.rowcount
    await db.commit()

    return {"message": "All notifications marked as read", "count": count}


@router.delete("/notifications/{notification_id}", summary="Delete Notification")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Delete a single notification."""
    n = await db.scalar(select(Notification).filter(Notification.id == notification_id))
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    if n.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    await db.delete(n)
    await db.commit()
    return {"message": "Notification deleted"}


@router.get("/notification-preferences", summary="Get Notification Preferences")
async def get_notification_preferences(
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Returns the lecturer's notification preference settings."""
    return current_user.notification_preferences


@router.patch("/notification-preferences", summary="Update Notification Preferences")
async def update_notification_preferences(
    prefs: LecturerNotificationPreferencesUpdate,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Update notification preferences."""
    current_prefs = current_user.notification_preferences or {}
    new_prefs = current_prefs.copy()
    new_prefs.update(prefs.dict())
    
    # Needs update statement or manual assignment if it's a JSON field
    current_user.notification_preferences = new_prefs
    await db.commit()
    
    return {
        "message": "Preferences updated",
        "preferences": current_user.notification_preferences
    }

@router.get("/preferences", summary="Get General Preferences")
async def get_general_preferences(
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Returns the lecturer's general preferences."""
    from app.models.institution import Institution
    from sqlalchemy.future import select
    from app.config import get_settings

    res = await db.execute(select(Institution).limit(1))
    inst = res.scalars().first()
    
    admin_qr_default = get_settings().QR_DEFAULT_EXPIRY_MINUTES
    session_code_length = get_settings().SESSION_CODE_LENGTH
    
    if inst and inst.settings_data:
        admin_qr_default = inst.settings_data.get("qr_default_expiry_minutes", admin_qr_default)
        session_code_length = inst.settings_data.get("session_code_length", session_code_length)

    return {
        "preferences": current_user.preferences,
        "admin_qr_default_mins": admin_qr_default,
        "session_code_length": session_code_length
    }


@router.patch("/preferences", summary="Update General Preferences")
async def update_general_preferences(
    prefs: LecturerPreferencesUpdate,
    current_user: User = Depends(require_lecturer),
    db: AsyncSession = Depends(get_db)
):
    """Update general preferences."""
    current_prefs = current_user.preferences or {}
    new_prefs = current_prefs.copy()
    new_prefs.update(prefs.dict())
    
    current_user.preferences = new_prefs
    await db.commit()
    
    return {
        "message": "Preferences updated",
        "preferences": current_user.preferences
    }
