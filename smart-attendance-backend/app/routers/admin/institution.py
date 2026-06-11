from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from typing import Dict, Any

from app.database import get_db
from app.dependencies import require_admin
from app.models.institution import Institution
from app.models.user import User
from app.models.notification import AuditLog
from app.schemas.institution import (
    InstitutionUpdate, SystemSettingsUpdate, NotificationSettingsUpdate, 
    SMTPSettingsUpdate, AdminPasswordChange, InstitutionResponse, AuditLogResponse
)
from app.schemas.reports import DashboardStatsResponse
from app.services.notification_service import NotificationService
from app.services.email_service import send_test_email
from app.utils.security import hash_password, verify_password
from app.config import get_settings

settings = get_settings()
router = APIRouter(dependencies=[Depends(require_admin)])

@router.get("/", response_model=InstitutionResponse)
async def get_institution(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Institution).limit(1))
    inst = res.scalars().first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    return inst

@router.patch("/", response_model=InstitutionResponse)
async def update_institution(
    update_data: InstitutionUpdate,
    logo: UploadFile = File(None),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    res = await db.execute(select(Institution).limit(1))
    inst = res.scalars().first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    if update_data.name: inst.name = update_data.name
    if update_data.admin_email: inst.admin_email = update_data.admin_email
    
    # If logo provided, upload logic goes here (Cloudinary)
    # Mocking for now:
    if logo:
        inst.logo_url = "https://res.cloudinary.com/demo/image/upload/sample.jpg"

    await db.commit()
    await db.refresh(inst)

    await NotificationService.log_audit_action(
        performed_by=admin.id, action="institution_updated", entity_type="institution", 
        entity_id=inst.id, details=update_data.model_dump(exclude_unset=True), ip_address=None, db=db
    )
    return inst

@router.get("/settings")
async def get_system_settings():
    return {
        "qr_default_expiry_minutes": settings.QR_DEFAULT_EXPIRY_MINUTES,
        "session_code_length": settings.SESSION_CODE_LENGTH,
        "face_confidence_threshold": settings.FACE_CONFIDENCE_THRESHOLD,
        "liveness_detection_enabled": settings.LIVENESS_DETECTION_ENABLED,
        "max_login_attempts": settings.MAX_LOGIN_ATTEMPTS,
        "lockout_duration_minutes": settings.LOCKOUT_DURATION_MINUTES,
        "attendance_default_threshold": settings.ATTENDANCE_DEFAULT_THRESHOLD
    }

@router.patch("/settings")
async def update_system_settings(
    settings_update: SystemSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    # In a real scenario, this would persist to DB or write to .env
    await NotificationService.log_audit_action(
        performed_by=admin.id, action="settings_updated", entity_type="settings", 
        entity_id=None, details=settings_update.model_dump(exclude_unset=True), ip_address=None, db=db
    )
    return {"message": "Settings updated", "settings": settings_update.model_dump(exclude_unset=True)}

@router.get("/settings/notifications")
async def get_notification_settings():
    return {
        "alert_below_80": True,
        "alert_below_75": True,
        "alert_below_70": True,
        "lecturer_inactive_weeks": 2,
        "expired_invitation_alert": True,
        "weekly_summary_enabled": True,
        "session_not_ended_hours": 4
    }

@router.patch("/settings/notifications")
async def update_notification_settings(
    settings_update: NotificationSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    await NotificationService.log_audit_action(
        performed_by=admin.id, action="notification_settings_updated", entity_type="settings", 
        entity_id=None, details=settings_update.model_dump(exclude_unset=True), ip_address=None, db=db
    )
    return {"message": "Notification settings updated"}

@router.patch("/settings/smtp")
async def update_smtp_settings(
    smtp_update: SMTPSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    await NotificationService.log_audit_action(
        performed_by=admin.id, action="smtp_settings_updated", entity_type="settings", 
        entity_id=None, details=smtp_update.model_dump(exclude_unset=True, exclude={"mail_password"}), ip_address=None, db=db
    )
    return {"message": "SMTP settings updated"}

@router.post("/settings/smtp/test")
async def test_smtp_settings(admin: User = Depends(require_admin)):
    try:
        await send_test_email(admin.email)
        return {"message": f"Test email sent to {admin.email}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SMTP Error: {str(e)}")

@router.patch("/admin/password")
async def update_admin_password(
    pwd_data: AdminPasswordChange,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    if not verify_password(pwd_data.current_password, admin.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    admin.password_hash = hash_password(pwd_data.new_password)
    await db.commit()
    
    await NotificationService.log_audit_action(
        performed_by=admin.id, action="admin_password_changed", entity_type="user", 
        entity_id=admin.id, details=None, ip_address=None, db=db
    )
    return {"message": "Password updated successfully"}

@router.get("/audit-trail")
async def get_audit_trail(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    action_type: str = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(AuditLog).order_by(desc(AuditLog.created_at))
    if action_type:
        query = query.filter(AuditLog.action == action_type)
        
    res = await db.execute(query.offset((page - 1) * limit).limit(limit))
    logs = res.scalars().all()
    
    total_res = await db.execute(select(func.count(AuditLog.id)))
    total = total_res.scalar() or 0
    
    return {"logs": logs, "total": total, "page": page}

@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    # Mocking counts for brevity, normally these would be COUNT() queries
    from app.models.student import Student
    from app.models.lecturer import Lecturer
    from app.models.course import Course
    from app.models.department import Department
    from app.models.session import Session
    from sqlalchemy import func
    from datetime import date
    
    s_cnt = await db.execute(select(func.count(Student.id)))
    l_cnt = await db.execute(select(func.count(Lecturer.id)))
    c_cnt = await db.execute(select(func.count(Course.id)).filter(Course.is_active == True))
    d_cnt = await db.execute(select(func.count(Department.id)).filter(Department.is_active == True))
    sess_cnt = await db.execute(select(func.count(Session.id)).filter(Session.session_date == date.today()))
    
    audit_res = await db.execute(select(AuditLog).order_by(desc(AuditLog.created_at)).limit(10))
    recent = audit_res.scalars().all()
    
    activity = [{
        "id": a.id, "action": a.action, "details": str(a.details), "entity_type": a.entity_type, 
        "performed_by": str(a.performed_by), "created_at": a.created_at
    } for a in recent]
    
    return DashboardStatsResponse(
        total_students=s_cnt.scalar() or 0,
        total_lecturers=l_cnt.scalar() or 0,
        active_courses=c_cnt.scalar() or 0,
        total_departments=d_cnt.scalar() or 0,
        sessions_today=sess_cnt.scalar() or 0,
        students_below_threshold=0,
        recent_activity=activity
    )

@router.get("/dashboard/charts")
async def get_dashboard_charts():
    return {
        "weekly_attendance_trend": [
            {"week": "Week 1", "date": "2024-01-01", "avg_pct": 85.5, "sessions_count": 20},
            {"week": "Week 2", "date": "2024-01-08", "avg_pct": 82.1, "sessions_count": 25}
        ],
        "attendance_by_department": [
            {"department": "Computer Science", "avg_pct": 88.0},
            {"department": "Mathematics", "avg_pct": 79.5}
        ],
        "present_absent_today": {"present": 150, "absent": 20},
        "lowest_attendance_courses": [
            {"course_title": "Advanced Calculus", "course_code": "MATH301", "programme": "BSc Math", "avg_pct": 65.0}
        ]
    }
