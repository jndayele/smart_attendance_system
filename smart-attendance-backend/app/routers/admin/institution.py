from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, func, case
from typing import Dict, Any
import base64
from datetime import datetime, timedelta

from app.database import get_db
from app.dependencies import require_admin
from app.models.institution import Institution
from app.models.user import User
from app.models.notification import AuditLog
from app.models.session import Session
from app.models.attendance import AttendanceRecord
from app.models.course import Course
from app.schemas.institution import (
    InstitutionUpdate, SystemSettingsUpdate, NotificationSettingsUpdate, 
    SMTPSettingsUpdate, AdminPasswordChange, InstitutionResponse, AuditLogResponse
)
from app.schemas.reports import DashboardStatsResponse
from app.services.notification_service import NotificationService
from app.services.email_service import send_test_email
from app.services.cloudinary_service import upload_image
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
    request: Request,
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
    
    if logo:
        file_bytes = await logo.read()
        logo_url = await upload_image(file_bytes, folder="institution_logos", public_id=f"institution_{inst.id}")
        inst.logo_url = logo_url

    await db.commit()
    await db.refresh(inst)

    await NotificationService.log_audit_action(
        performed_by=admin.id, action="institution_updated", entity_type="institution", 
        entity_id=inst.id, details=update_data.model_dump(exclude_unset=True), 
        ip_address=request.client.host if request.client else None, db=db
    )
    return inst

@router.get("/settings")
async def get_system_settings(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Institution).limit(1))
    inst = res.scalars().first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    
    saved = inst.settings_data or {}
    return {
        "qr_default_expiry_minutes": saved.get("qr_default_expiry_minutes", settings.QR_DEFAULT_EXPIRY_MINUTES),
        "session_code_length": saved.get("session_code_length", settings.SESSION_CODE_LENGTH),
        "face_confidence_threshold": saved.get("face_confidence_threshold", settings.FACE_CONFIDENCE_THRESHOLD),
        "liveness_detection_enabled": saved.get("liveness_detection_enabled", settings.LIVENESS_DETECTION_ENABLED),
        "max_login_attempts": saved.get("max_login_attempts", settings.MAX_LOGIN_ATTEMPTS),
        "lockout_duration_minutes": saved.get("lockout_duration_minutes", settings.LOCKOUT_DURATION_MINUTES),
        "attendance_default_threshold": saved.get("attendance_default_threshold", settings.ATTENDANCE_DEFAULT_THRESHOLD)
    }

@router.patch("/settings")
async def update_system_settings(
    settings_update: SystemSettingsUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    res = await db.execute(select(Institution).limit(1))
    inst = res.scalars().first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
        
    current = inst.settings_data or {}
    current.update(settings_update.model_dump(exclude_unset=True))
    inst.settings_data = current
    await db.commit()
    
    await NotificationService.log_audit_action(
        performed_by=admin.id, action="settings_updated", entity_type="settings", 
        entity_id=None, details=settings_update.model_dump(exclude_unset=True), 
        ip_address=request.client.host if request.client else None, db=db
    )
    return {"message": "Settings updated", "settings": current}

@router.get("/settings/notifications")
async def get_notification_settings(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Institution).limit(1))
    inst = res.scalars().first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
        
    saved = inst.notification_settings or {}
    defaults = {
        "alert_below_80": True,
        "alert_below_75": True,
        "alert_below_70": True,
        "lecturer_inactive_weeks": 2,
        "expired_invitation_alert": True,
        "weekly_summary_enabled": True,
        "session_not_ended_hours": 4
    }
    return {**defaults, **saved}

@router.patch("/settings/notifications")
async def update_notification_settings(
    settings_update: NotificationSettingsUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    res = await db.execute(select(Institution).limit(1))
    inst = res.scalars().first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
        
    current = inst.notification_settings or {}
    current.update(settings_update.model_dump(exclude_unset=True))
    inst.notification_settings = current
    await db.commit()
    
    await NotificationService.log_audit_action(
        performed_by=admin.id, action="notification_settings_updated", entity_type="settings", 
        entity_id=None, details=settings_update.model_dump(exclude_unset=True), 
        ip_address=request.client.host if request.client else None, db=db
    )
    return {"message": "Notification settings updated"}

@router.patch("/settings/smtp")
async def update_smtp_settings(
    smtp_update: SMTPSettingsUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    res = await db.execute(select(Institution).limit(1))
    inst = res.scalars().first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
        
    current = inst.smtp_settings or {}
    update_dict = smtp_update.model_dump(exclude_unset=True)
    if "mail_password" in update_dict and update_dict["mail_password"]:
        # Obfuscating the password
        update_dict["mail_password"] = base64.b64encode(update_dict["mail_password"].encode('utf-8')).decode('utf-8')
        
    current.update(update_dict)
    inst.smtp_settings = current
    await db.commit()
    
    await NotificationService.log_audit_action(
        performed_by=admin.id, action="smtp_settings_updated", entity_type="settings", 
        entity_id=None, details=smtp_update.model_dump(exclude_unset=True, exclude={"mail_password"}), 
        ip_address=request.client.host if request.client else None, db=db
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
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    if not verify_password(pwd_data.current_password, admin.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    admin.password_hash = hash_password(pwd_data.new_password)
    await db.commit()
    
    await NotificationService.log_audit_action(
        performed_by=admin.id, action="admin_password_changed", entity_type="user", 
        entity_id=admin.id, details=None, 
        ip_address=request.client.host if request.client else None, db=db
    )
    return {"message": "Password updated successfully"}

@router.get("/audit-trail")
async def get_audit_trail(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    action_type: str = None,
    date_from: datetime = None,
    date_to: datetime = None,
    db: AsyncSession = Depends(get_db)
):
    skip = (page - 1) * limit
    query = select(AuditLog).order_by(AuditLog.created_at.desc())
    if action_type:
        query = query.where(AuditLog.action == action_type)
    if date_from:
        query = query.where(AuditLog.created_at >= date_from)
    if date_to:
        query = query.where(AuditLog.created_at <= date_to)
        
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    results = await db.execute(query.offset(skip).limit(limit))
    logs = results.scalars().all()
    
    return {"logs": logs, "total": total, "page": page}

@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    from app.models.student import Student, StudentCourse
    from app.models.lecturer import Lecturer
    from app.models.course import Course
    from app.models.department import Department
    from app.models.session import Session
    from app.models.attendance import AttendanceRecord
    from datetime import date, timedelta
    from sqlalchemy import cast, Float
    
    s_cnt = await db.scalar(select(func.count(Student.id))) or 0
    l_cnt = await db.scalar(select(func.count(Lecturer.id))) or 0
    c_cnt = await db.scalar(select(func.count(Course.id)).filter(Course.is_active == True)) or 0
    d_cnt = await db.scalar(select(func.count(Department.id)).filter(Department.is_active == True)) or 0
    sess_cnt = await db.scalar(select(func.count(Session.id)).filter(Session.session_date == date.today())) or 0
    
    week_ago = datetime.utcnow() - timedelta(days=7)
    yesterday = date.today() - timedelta(days=1)
    
    s_week = await db.scalar(select(func.count(Student.id)).where(Student.created_at >= week_ago)) or 0
    l_week = await db.scalar(select(func.count(Lecturer.id)).where(Lecturer.created_at >= week_ago)) or 0
    sess_yesterday = await db.scalar(select(func.count(Session.id)).filter(Session.session_date == yesterday)) or 0
    
    students_trend = f"+{s_week} this week" if s_week > 0 else "no change"
    lecturers_trend = f"+{l_week} this week" if l_week > 0 else "no change"
    
    if sess_cnt > sess_yesterday:
        sessions_trend = f"+{sess_cnt - sess_yesterday} today"
    elif sess_cnt < sess_yesterday:
        sessions_trend = f"{sess_cnt - sess_yesterday} today"
    else:
        sessions_trend = "same as yesterday"

    subq = (
        select(
            StudentCourse.id,
            (
                cast(func.sum(case((AttendanceRecord.status == "present", 1), else_=0)), Float) 
                / func.nullif(cast(func.count(func.distinct(Session.id)), Float), 0) 
                * 100
            ).label('att_pct'),
            Course.threshold_pct
        )
        .join(Course, Course.id == StudentCourse.course_id)
        .join(Session, Session.course_id == Course.id)
        .outerjoin(AttendanceRecord, (AttendanceRecord.session_id == Session.id) & (AttendanceRecord.student_id == StudentCourse.student_id))
        .group_by(StudentCourse.id, Course.threshold_pct)
    ).subquery()

    below_threshold_cnt = await db.scalar(
        select(func.count(subq.c.id)).where(subq.c.att_pct < subq.c.threshold_pct)
    ) or 0
    
    audit_res = await db.execute(select(AuditLog).order_by(desc(AuditLog.created_at)).limit(10))
    recent = audit_res.scalars().all()
    
    activity = [{
        "id": a.id, "action": a.action, "details": str(a.details), "entity_type": a.entity_type, 
        "performed_by": str(a.performed_by), "created_at": a.created_at
    } for a in recent]
    
    return DashboardStatsResponse(
        total_students=s_cnt,
        total_lecturers=l_cnt,
        active_courses=c_cnt,
        total_departments=d_cnt,
        sessions_today=sess_cnt,
        students_below_threshold=below_threshold_cnt,
        total_students_trend=students_trend,
        total_lecturers_trend=lecturers_trend,
        sessions_today_trend=sessions_trend,
        students_below_threshold_trend="updated today",
        recent_activity=activity,
        quick_actions=[
            {"label": "Add Lecturer", "action": "add_lecturer", "path": "/admin/lecturers/new"},
            {"label": "Add Student", "action": "add_student", "path": "/admin/students/new"},
            {"label": "Create Course", "action": "create_course", "path": "/admin/courses/new"},
            {"label": "View Reports", "action": "view_reports", "path": "/admin/reports"}
        ]
    )

@router.get("/dashboard/charts")
async def get_dashboard_charts(db: AsyncSession = Depends(get_db)):
    weeks = []
    for i in range(7, -1, -1):
        week_start = datetime.utcnow() - timedelta(weeks=i+1)
        week_end = datetime.utcnow() - timedelta(weeks=i)
        
        total = await db.scalar(
            select(func.count(AttendanceRecord.id))
            .join(Session).where(Session.session_date.between(week_start, week_end))
        )
        present = await db.scalar(
            select(func.count(AttendanceRecord.id))
            .join(Session).where(
                Session.session_date.between(week_start, week_end),
                AttendanceRecord.status == "present"
            )
        )
        sessions_count = await db.scalar(
            select(func.count(func.distinct(Session.id)))
            .where(Session.session_date.between(week_start, week_end))
        )
        pct = round((present / total * 100) if total else 0, 1)
        weeks.append({
            "week": f"Week {8-i}", 
            "attendance_pct": pct,
            "sessions_count": sessions_count or 0
        })
        
    from app.models.department import Department
    from app.models.programme import Programme
    
    dept_res = await db.execute(
        select(Department.name, func.count(AttendanceRecord.id), func.sum(case((AttendanceRecord.status == "present", 1), else_=0)))
        .select_from(Department)
        .join(Programme, Programme.department_id == Department.id)
        .join(Course, Course.programme_id == Programme.id)
        .join(Session, Session.course_id == Course.id)
        .join(AttendanceRecord, AttendanceRecord.session_id == Session.id)
        .group_by(Department.name)
    )
    
    dept_data = []
    for dept_name, tot, pres in dept_res.all():
        pct = round((pres / tot * 100) if tot else 0, 1)
        dept_data.append({"department": dept_name, "avg_pct": pct})
        
    today = datetime.utcnow().date()
    today_pres = await db.scalar(select(func.count(AttendanceRecord.id)).join(Session).where(Session.session_date == today, AttendanceRecord.status == "present"))
    today_abs = await db.scalar(select(func.count(AttendanceRecord.id)).join(Session).where(Session.session_date == today, AttendanceRecord.status == "absent"))
    
    lowest_res = await db.execute(
        select(Course.title, Course.code, Programme.name, func.count(AttendanceRecord.id), func.sum(case((AttendanceRecord.status == "present", 1), else_=0)))
        .select_from(Course)
        .join(Programme, Course.programme_id == Programme.id)
        .join(Session, Session.course_id == Course.id)
        .join(AttendanceRecord, AttendanceRecord.session_id == Session.id)
        .group_by(Course.id, Programme.id)
    )
    
    lowest_data = []
    for c_title, c_code, p_name, c_tot, c_pres in lowest_res.all():
        if c_tot and c_tot > 0:
            c_pct = round((c_pres / c_tot * 100), 1)
            
            # Use 'Warning' if < 75, else 'Approaching'
            status = 'Warning' if c_pct < 75 else 'Approaching'
            
            lowest_data.append({
                "course": f"{c_code} \u2014 {c_title}",
                "programme": p_name,
                "rate": c_pct,
                "status": status
            })
            
    lowest_data.sort(key=lambda x: x["avg_pct"])
    lowest_data = lowest_data[:10]

    return {
        "weekly_attendance_trend": weeks,
        "attendance_by_department": dept_data,
        "present_absent_today": {"present": today_pres or 0, "absent": today_abs or 0},
        "lowest_attendance_courses": lowest_data
    }
