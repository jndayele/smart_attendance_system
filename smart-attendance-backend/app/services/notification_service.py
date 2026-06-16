import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models.notification import Notification, AuditLog
from app.models.user import User, RoleEnum
from app.models.lecturer import Lecturer
from app.models.student import Student, StudentCourse
from app.models.course import Course
from app.models.session import Session
from app.models.attendance import AttendanceRecord
from app.services.email_service import send_attendance_warning_email, send_weekly_summary_email

class NotificationService:
    @staticmethod
    async def create_notification(
        user_id: uuid.UUID,
        type: str,
        title: str,
        message: str,
        db: AsyncSession
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message
        )
        db.add(notif)
        await db.commit()
        await db.refresh(notif)
        return notif

    @staticmethod
    async def log_audit_action(
        performed_by: Optional[uuid.UUID],
        action: str,
        entity_type: str,
        entity_id: Optional[uuid.UUID],
        details: Optional[Dict[str, Any]],
        ip_address: Optional[str],
        db: AsyncSession
    ) -> AuditLog:
        def sanitize(obj):
            if isinstance(obj, dict):
                return {k: sanitize(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [sanitize(v) for v in obj]
            elif isinstance(obj, uuid.UUID):
                return str(obj)
            elif hasattr(obj, "isoformat"):
                return obj.isoformat()
            return obj

        sanitized_details = sanitize(details) if details else None

        log = AuditLog(
            performed_by=performed_by,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=sanitized_details,
            ip_address=ip_address
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        return log

    @staticmethod
    async def compute_attendance_pct(
        student_id: uuid.UUID,
        course_id: uuid.UUID,
        db: AsyncSession
    ) -> float:
        """
        Computes the current attendance percentage for a student in a specific course.
        Counts only locked sessions. Returns 0.0 if no sessions exist yet.
        """
        res_sess = await db.execute(select(Session.id).filter(
            Session.course_id == course_id,
            Session.is_locked == True
        ))
        session_ids = [row[0] for row in res_sess.all()]
        
        if not session_ids:
            return 0.0
            
        res_pres = await db.execute(select(func.count(AttendanceRecord.id)).filter(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.session_id.in_(session_ids),
            AttendanceRecord.status == 'present'
        ))
        present_count = res_pres.scalar() or 0
        
        return (present_count / len(session_ids)) * 100.0

    @staticmethod
    async def check_and_send_threshold_alerts(
        student_id: uuid.UUID,
        course_id: uuid.UUID,
        db: AsyncSession
    ) -> None:
        """Calculate attendance % for the student and course, and trigger warnings if needed."""
        pct = await NotificationService.compute_attendance_pct(student_id, course_id, db)
        
        res = await db.execute(select(Course).filter(Course.id == course_id))
        course = res.scalars().first()
        if not course: return

        res_stu = await db.execute(select(Student, User).join(User, Student.user_id == User.id).filter(Student.id == student_id))
        row = res_stu.first()
        if not row: return
        student, user = row
        
        # Determine alert level
        alert_type = None
        if pct < 70:
            alert_type = "below_70"
        elif 70 <= pct < 75:
            alert_type = "below_75"
        elif 75 <= pct < 80:
            alert_type = "below_80"
            
        if not alert_type:
            return
            
        # Deduplication check (last 24 hours for same level and course)
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        res_dup = await db.execute(select(func.count(Notification.id)).filter(
            Notification.user_id == user.id,
            Notification.type == "threshold_alert",
            Notification.title.ilike(f"%{alert_type}%"),
            Notification.message.ilike(f"%{course.code}%"),
            Notification.created_at > twenty_four_hours_ago
        ))
        if (res_dup.scalar() or 0) > 0:
            # Already sent this level of alert in the last 24 hours. Skip email, but maybe log.
            return

        # Fetch admin
        res_admin = await db.execute(select(User).filter(User.role == RoleEnum.admin, User.is_active == True).limit(1))
        admin = res_admin.scalars().first()

        # In-app notification for student
        await NotificationService.create_notification(
            user_id=user.id,
            type="threshold_alert",
            title=f"Attendance Warning ({alert_type})",
            message=f"Your attendance for {course.code} is at {pct:.1f}%. Please improve your attendance.",
            db=db
        )

        # In-app notification for admin if critical
        if alert_type in ["below_70", "below_75"] and admin:
            await NotificationService.create_notification(
                user_id=admin.id,
                type="threshold_alert",
                title="Student Critical Attendance",
                message=f"Student {student.name} ({student.student_id}) is at {pct:.1f}% for {course.code}.",
                db=db
            )

        # Email notification
        from app.services.face_service import FaceService
        
        res_sess_count = await db.execute(select(func.count(Session.id)).filter(Session.course_id == course_id, Session.is_locked == True))
        tot_sess = res_sess_count.scalar() or 0
        
        res_pres_count = await db.execute(select(func.count(AttendanceRecord.id)).filter(
            AttendanceRecord.student_id == student.id,
            AttendanceRecord.session_id.in_(select(Session.id).filter(Session.course_id == course_id, Session.is_locked == True)),
            AttendanceRecord.status == 'present'
        ))
        pres_count = res_pres_count.scalar() or 0

        needed = FaceService.compute_sessions_needed(pres_count, tot_sess, course.threshold_pct)

        await send_attendance_warning_email(
            to_email=user.email,
            student_name=student.name,
            course_title=course.title,
            course_code=course.code,
            current_pct=pct,
            threshold_pct=course.threshold_pct,
            sessions_needed=needed
        )

    @staticmethod
    async def send_weekly_summaries(db: AsyncSession) -> None:
        """Called by chron job to send weekly reports."""
        # Find all admins
        res = await db.execute(select(User).filter(User.role == RoleEnum.admin, User.is_active == True))
        admins = res.scalars().all()

        # Dummy data for the example
        summary_data = {"courses": [{"course_code": "CS101", "attendance_rate": 85.5}]}

        for admin in admins:
            await send_weekly_summary_email(
                to_email=admin.email,
                recipient_name="Admin",
                summary_data=summary_data
            )

    @staticmethod
    async def check_inactive_lecturers(db: AsyncSession) -> None:
        """Finds lecturers with no sessions in the last 14 days and notifies admin."""
        fourteen_days_ago = datetime.utcnow().date() - timedelta(days=14)
        
        # Subquery for active sessions in last 14 days
        active_lecs_query = select(Session.lecturer_id).filter(Session.session_date >= fourteen_days_ago).distinct()
        res = await db.execute(active_lecs_query)
        active_ids = [row[0] for row in res.all()]

        # Find lecturers not in active list
        res = await db.execute(select(Lecturer).filter(~Lecturer.id.in_(active_ids)))
        inactive_lecs = res.scalars().all()

        if not inactive_lecs: return

        # Find admin to notify
        res = await db.execute(select(User).filter(User.role == RoleEnum.admin).limit(1))
        admin = res.scalars().first()
        if not admin: return

        for lec in inactive_lecs:
            await NotificationService.create_notification(
                user_id=admin.id,
                type="inactive_lecturer",
                title="Lecturer Inactive",
                message=f"Lecturer {lec.name} has not conducted any sessions in the last 14 days.",
                db=db
            )

    @staticmethod
    async def check_expired_invitations(db: AsyncSession) -> None:
        """Finds students with expired tokens and notifies admin."""
        res = await db.execute(select(Student).filter(
            Student.invitation_token_expiry < datetime.utcnow(),
            Student.face_registered == False
        ))
        expired_students = res.scalars().all()

        if not expired_students: return

        res = await db.execute(select(User).filter(User.role == RoleEnum.admin).limit(1))
        admin = res.scalars().first()
        if not admin: return

        for stu in expired_students:
            await NotificationService.create_notification(
                user_id=admin.id,
                type="expired_invitation",
                title="Student Invitation Expired",
                message=f"Invitation for student {stu.name} ({stu.student_id}) has expired.",
                db=db
            )

    @staticmethod
    async def notify_students_session_started(
        session_id: uuid.UUID,
        course_id: uuid.UUID,
        course_title: str,
        course_code: str,
        lecturer_name: str,
        db: AsyncSession
    ) -> int:
        """Bulk creates notifications for all enrolled students when a session starts."""
        # Find all active enrollments for this course
        res = await db.execute(select(StudentCourse.student_id).filter(
            StudentCourse.course_id == course_id,
            StudentCourse.is_active == True
        ))
        student_ids = [row[0] for row in res.all()]
        if not student_ids:
            return 0

        # Find corresponding user_ids
        res = await db.execute(select(Student.user_id).filter(Student.id.in_(student_ids)))
        user_ids = [row[0] for row in res.all()]
        if not user_ids:
            return 0

        now = datetime.utcnow()
        notifications_data = [
            {
                "id": uuid.uuid4(),
                "user_id": uid,
                "type": "session_started",
                "title": "Attendance Session Active",
                "message": f"{lecturer_name} has started an attendance session for {course_title} ({course_code}). Mark your attendance now.",
                "is_read": False,
                "created_at": now
            }
            for uid in user_ids
        ]

        await db.execute(Notification.__table__.insert().values(notifications_data))
        return len(notifications_data)

    @staticmethod
    async def notify_session_not_closed(db: AsyncSession) -> None:
        """Finds sessions open for >2 hours and notifies lecturers."""
        two_hours_ago = datetime.utcnow() - timedelta(hours=2)
        
        # Query sessions + course + lecturer + user
        stmt = select(Session, Course, Lecturer, User).join(Course, Session.course_id == Course.id).join(Lecturer, Session.lecturer_id == Lecturer.id).join(User, Lecturer.user_id == User.id).filter(
            Session.is_active == True,
            Session.is_locked == False,
            Session.started_at < two_hours_ago
        )
        res = await db.execute(stmt)
        records = res.all()
        
        from app.services.email_service import send_session_not_closed_email
        
        for session, course, lecturer, user in records:
            hours_open = (datetime.utcnow() - session.started_at).total_seconds() / 3600.0
            
            # Send email
            await send_session_not_closed_email(
                to_email=user.email,
                lecturer_name=lecturer.name,
                course_title=course.title,
                course_code=course.code,
                session_label=session.label,
                hours_open=hours_open
            )
            
            # Create in-app notification
            label_text = f"'{session.label}' " if session.label else ""
            await NotificationService.create_notification(
                user_id=user.id,
                type="session_reminder",
                title="Session Still Open",
                message=f"Your session {label_text}for {course.code} has been open for over 2 hours. Please end the session.",
                db=db
            )

