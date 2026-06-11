import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy.future import select
from app.database import async_session_maker
from app.models.course import Course
from app.models.lecturer import Lecturer
from app.models.user import User

logger = logging.getLogger(__name__)

async def run_scheduled_reports():
    """Generate and email scheduled weekly reports to lecturers."""
    logger.info("Starting Scheduled Reports task...")
    async with async_session_maker() as db:
        res = await db.execute(select(Course).filter(Course.is_active == True))
        courses = res.scalars().all()
        
        # Here we would normally aggregate and email using EmailService
        # For this scope, we just mock the aggregation log
        for c in courses:
            logger.info(f"Generating weekly report for course {c.code}...")
            
        logger.info("Scheduled Reports completed.")

async def start_report_scheduler():
    """Weekly background scheduler."""
    while True:
        try:
            await run_scheduled_reports()
        except Exception as e:
            logger.error(f"Error in report scheduler: {e}")
        # Run once a week
        await asyncio.sleep(604800)
