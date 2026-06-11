import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy.future import select
from sqlalchemy import func
from app.database import AsyncSessionLocal
from app.models.course import Course
from app.models.student import Student, StudentCourse
from app.models.session import Session
from app.models.attendance import AttendanceRecord
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)

async def run_daily_absence_scanner():
    """Check for students who missed X sessions and need alerting."""
    logger.info("Starting Daily Absence Scanner...")
    async with AsyncSessionLocal() as db:
        # Fetch all active courses
        res_courses = await db.execute(select(Course).filter(Course.is_active == True))
        courses = res_courses.scalars().all()
        
        for c in courses:
            # For each course, fetch enrolled students
            res_sc = await db.execute(select(StudentCourse.student_id).filter(StudentCourse.course_id == c.id, StudentCourse.is_active == True))
            student_ids = [r[0] for r in res_sc.all()]
            
            if not student_ids:
                continue
                
            # For each student, check their threshold
            for sid in student_ids:
                # This already exists in NotificationService
                await NotificationService.check_and_send_threshold_alerts(sid, c.id, db)
                
        logger.info("Daily Absence Scanner completed.")

async def start_scheduler():
    """Simple background scheduler."""
    while True:
        try:
            await run_daily_absence_scanner()
        except Exception as e:
            logger.error(f"Error in scanner: {e}")
        # Run once a day
        await asyncio.sleep(86400)
