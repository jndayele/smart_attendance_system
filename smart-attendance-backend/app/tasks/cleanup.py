import asyncio
import logging
from datetime import datetime
from sqlalchemy.future import select
from sqlalchemy import update
from app.database import AsyncSessionLocal
from app.models.session import Session
from app.models.session_code_attempt import SessionCodeAttempt

logger = logging.getLogger(__name__)

async def run_cleanup_tasks():
    """Clear expired QR codes and reset locked out sessions."""
    logger.info("Starting Background Cleanup Task...")
    async with AsyncSessionLocal() as db:
        now = datetime.utcnow()
        
        # Clear expired QR codes
        await db.execute(
            update(Session)
            .where(Session.qr_expires_at != None, Session.qr_expires_at < now)
            .values(qr_token=None, qr_expires_at=None)
        )
        
        # Optionally, unlock old session attempts
        # (e.g., reset lockouts after 24 hours)
        
        await db.commit()
        logger.info("Cleanup task completed.")

async def start_cleanup_scheduler():
    """Background scheduler for cleanup."""
    while True:
        try:
            await run_cleanup_tasks()
        except Exception as e:
            logger.error(f"Error in cleanup task: {e}")
        # Run every hour
        await asyncio.sleep(3600)
