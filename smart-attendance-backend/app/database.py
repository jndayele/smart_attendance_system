from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import get_settings

settings = get_settings()

from sqlalchemy.pool import AsyncAdaptedQueuePool

# ─── Connection pool sizing ───────────────────────────────────────────────────
# IMPORTANT — multi-worker math:
#
#   Total DB connections = pool_size × max_overflow × num_uvicorn_workers
#   Example: 5 × 2 × 4 workers = max 40 connections per deploy
#
# Supabase free tier  → 60 connection limit
# Supabase Pro tier   → 200 connection limit
# If you exceed the limit you will get "remaining connection slots are reserved"
#
# PRODUCTION RECOMMENDATION:
#   Route all connections through PgBouncer in transaction mode.
#   Then pool_size can be 20 per worker because PgBouncer multiplexes them
#   into far fewer actual PostgreSQL connections.
#
# Engine configuration for Supabase with SSL required and connection pooling
engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args={"ssl": "require"},
    echo=settings.DEBUG,
    poolclass=AsyncAdaptedQueuePool,
    pool_size=5,          # per-worker — multiply by num workers for total
    max_overflow=5,       # burst headroom per worker
    pool_timeout=30,
    pool_recycle=1800,    # recycle connections after 30 min (avoids stale TCP)
    pool_pre_ping=True,   # detect dead connections before use
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
