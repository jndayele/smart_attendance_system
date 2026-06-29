import asyncio
import sys
from app.database import engine
from app.models.user import User
from app.models.institution import Institution
from app.models.academic_year import AcademicYear, Semester
from app.models.department import Department
from app.models.programme import Programme
from app.models.course import Course
from app.models.student import Student, StudentCourse
from app.models.lecturer import Lecturer
from app.models.session import Session
from app.models.attendance import AttendanceRecord
from app.models.session_code_attempt import SessionCodeAttempt
from app.models.notification import Notification
from app.models.class_schedule import ClassSchedule
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Import Base from the module that aggregates all models
from app.database import Base

async def reset_db():
    print("WARNING: This will DELETE ALL DATA from the database!")
    print("Connecting to database...")
    
    async with engine.begin() as conn:
        print("Dropping all tables...")
        await conn.run_sync(Base.metadata.drop_all)
        print("All tables dropped.")
        
        print("Recreating all tables from models...")
        await conn.run_sync(Base.metadata.create_all)
        print("All tables recreated.")
    
    print("\nDone! Database has been completely cleared and recreated.")
    print("You can now go through the initial institution setup on the frontend.")

if __name__ == "__main__":
    asyncio.run(reset_db())
