from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Smart Attendance System"
    APP_ENV: str = "development"
    APP_SECRET_KEY: str
    DEBUG: bool = True

    # Database
    DATABASE_URL: str
    DATABASE_SSL: bool = True

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    RESET_TOKEN_EXPIRE_MINUTES: int = 30
    ACTIVATION_TOKEN_EXPIRE_HOURS: int = 72
    INVITATION_TOKEN_EXPIRE_HOURS: int = 48

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    # Email
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_FROM_NAME: str = "Smart Attendance System"
    MAIL_SERVER: str
    MAIL_PORT: int = 587
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False

    # Face Recognition
    FACE_CONFIDENCE_THRESHOLD: int = 80
    FACE_MODEL: str = "ArcFace"
    FACE_DETECTOR: str = "opencv"
    FACE_DISTANCE_METRIC: str = "cosine"
    LIVENESS_DETECTION_ENABLED: bool = False

    # QR Code
    QR_DEFAULT_EXPIRY_MINUTES: int = 15
    QR_CODE_SIZE: int = 10
    SESSION_CODE_LENGTH: int = 6

    # System
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15
    ATTENDANCE_DEFAULT_THRESHOLD: int = 75
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"
    LECTURER_FRONTEND_URL: str = "http://localhost:5174"
    STUDENT_FRONTEND_URL: str = "http://localhost:5175"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    """
    return Settings()
