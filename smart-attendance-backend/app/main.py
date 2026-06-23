import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.services.face_service import FaceService
from app.routers import auth
from app.routers.admin import (
    institution, departments, programmes, courses, 
    lecturers, students, academic_years, reports
)
from app.routers.lecturer import (
    dashboard as lecturer_dashboard,
    courses as lecturer_courses,
    sessions as lecturer_sessions,
    reports as lecturer_reports,
    profile as lecturer_profile,
)
from app.routers.student import (
    dashboard as student_dashboard,
    attendance as student_attendance,
    courses as student_courses,
    profile as student_profile,
)

settings = get_settings()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events: startup and shutdown.

    Note on background schedulers
    -------------------------------
    Periodic tasks (absence scanner, session checker, weekly reports, cleanup)
    are now managed by Celery Beat.  They have been removed from this lifespan
    to prevent duplicate execution across Uvicorn workers.

    To start the scheduler:
        celery -A app.celery_app beat --loglevel=info
    To start a worker:
        celery -A app.celery_app worker --concurrency=4 --pool=prefork
    """
    # Startup
    logger.info("Starting up Smart Attendance System...")

    # 1. Initialize database
    try:
        await init_db()
        logger.info("Database initialized.")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")

    # 2. Preload DeepFace model into the dedicated thread-pool executor
    FaceService.preload_model()

    yield

    # Shutdown
    logger.info("Shutting down Smart Attendance System...")



app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for Smart Attendance System using QR codes and Face Recognition.",
    version="1.0.0",
    lifespan=lifespan
)

import time
from starlette.middleware.base import BaseHTTPMiddleware

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    if process_time > 5.0:
        logger.warning(f"Slow request: {request.method} {request.url.path} took {process_time:.2f}s")
    return response

# CORS Middleware
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": exc.body},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    if settings.APP_ENV == "development":
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": str(exc)},
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )

# Include Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])

# Admin Routers
app.include_router(institution.router, prefix="/api/v1/admin/institution", tags=["admin-institution"])
app.include_router(departments.router, prefix="/api/v1/admin/departments", tags=["admin-departments"])
app.include_router(programmes.router, prefix="/api/v1/admin/programmes", tags=["admin-programmes"])
app.include_router(academic_years.router, prefix="/api/v1/admin/academic-years", tags=["admin-academic-years"])
app.include_router(courses.router, prefix="/api/v1/admin/courses", tags=["admin-courses"])
app.include_router(lecturers.router, prefix="/api/v1/admin/lecturers", tags=["admin-lecturers"])
app.include_router(students.router, prefix="/api/v1/admin/students", tags=["admin-students"])
app.include_router(reports.router, prefix="/api/v1/admin/reports", tags=["admin-reports"])

# Lecturer Routers
app.include_router(
    lecturer_dashboard.router,
    prefix="/api/v1/lecturer/dashboard",
    tags=["Lecturer — Dashboard"]
)
app.include_router(
    lecturer_courses.router,
    prefix="/api/v1/lecturer/courses",
    tags=["Lecturer — Courses"]
)
app.include_router(
    lecturer_sessions.router,
    prefix="/api/v1/lecturer/sessions",
    tags=["Lecturer — Sessions"]
)
app.include_router(
    lecturer_reports.router,
    prefix="/api/v1/lecturer/reports",
    tags=["Lecturer — Reports"]
)
app.include_router(
    lecturer_profile.router,
    prefix="/api/v1/lecturer/profile",
    tags=["Lecturer — Profile"]
)

# Student Routers
app.include_router(
    student_dashboard.router,
    prefix="/api/v1/student/dashboard",
    tags=["Student — Dashboard"]
)
app.include_router(
    student_attendance.router,
    prefix="/api/v1/student/attendance",
    tags=["Student — Attendance"]
)
app.include_router(
    student_courses.router,
    prefix="/api/v1/student/courses",
    tags=["Student — Courses"]
)
app.include_router(
    student_profile.router,
    prefix="/api/v1/student/profile",
    tags=["Student — Profile"]
)

@app.get("/health", tags=["system"])
async def health_check():
    """Health check endpoint to verify API, DB, and Redis status."""
    from sqlalchemy import text
    from app.database import engine
    from app.core.redis import health_check as redis_health

    db_status = "disconnected"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception as e:
        logger.error(f"Health check DB error: {e}")

    redis_status = "connected" if await redis_health() else "disconnected"

    return {
        "status": "ok",
        "version": app.version,
        "db": db_status,
        "redis": redis_status,
    }

@app.get("/", include_in_schema=False)
async def root():
    """Redirect to API documentation."""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")

import socketio
from app.socket_manager import sio_server

# Wrap FastAPI with Socket.IO ASGI app
# This handles websocket upgrades and falls back to HTTP long-polling if necessary
app = socketio.ASGIApp(sio_server, other_asgi_app=app)
