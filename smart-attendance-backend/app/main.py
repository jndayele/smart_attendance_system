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
# from app.routers.admin import institution, departments, programmes, courses, lecturers, students, academic_years, reports
# from app.routers.lecturer import dashboard, courses as lec_courses, sessions, reports as lec_reports
# from app.routers.student import dashboard as stu_dashboard, attendance, profile

settings = get_settings()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events: startup and shutdown.
    """
    # Startup
    logger.info("Starting up Smart Attendance System...")
    
    # 1. Initialize database (create tables if using run_sync create_all)
    # In production, alembic migrations should be used instead.
    try:
        await init_db()
        logger.info("Database initialized.")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")

    # 2. Preload DeepFace model
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
app.include_router(auth.router, prefix="/api/v1/auth")

# Stubs for other routers (to be implemented)
# app.include_router(admin_router, prefix="/api/v1/admin")
# app.include_router(lecturer_router, prefix="/api/v1/lecturer")
# app.include_router(student_router, prefix="/api/v1/student")

@app.get("/health", tags=["system"])
async def health_check():
    """Health check endpoint to verify API and DB status."""
    from sqlalchemy import text
    from app.database import engine
    
    db_status = "disconnected"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception as e:
        logger.error(f"Health check DB error: {e}")
        
    return {
        "status": "ok",
        "version": app.version,
        "db": db_status
    }

@app.get("/", include_in_schema=False)
async def root():
    """Redirect to API documentation."""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")
