from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import get_settings

settings = get_settings()

import sys
from sqlalchemy.pool import AsyncAdaptedQueuePool, NullPool

is_celery = "celery" in sys.argv[0] or "celery" in sys.modules

if is_celery:
    pool_class = NullPool
    pool_kwargs = {}
else:
    pool_class = AsyncAdaptedQueuePool
    pool_kwargs = {
        "pool_size": 5,
        "max_overflow": 5,
        "pool_timeout": 30,
        "pool_recycle": 1800,
        "pool_pre_ping": True,
    }

engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args={"ssl": "require"},
    echo=settings.DEBUG,
    poolclass=pool_class,
    **pool_kwargs
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine, 
    class_=AsyncSession, 
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to yield an async database session.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db() -> None:
    """
    Initialize database, create tables if they don't exist.
    In production, use Alembic migrations instead.
    """
    import app.models.user
    import app.models.institution
    import app.models.academic_year
    import app.models.department
    import app.models.programme
    import app.models.course
    import app.models.student
    import app.models.lecturer
    import app.models.session
    import app.models.attendance
    import app.models.session_code_attempt
    import app.models.class_schedule
    import app.models.notification

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
