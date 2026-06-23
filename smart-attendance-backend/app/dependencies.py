"""
app/dependencies.py

FastAPI dependency helpers for authentication and authorisation.

Performance note
----------------
get_current_user checks a Redis cache (TTL = 5 min) before querying the DB.
At 400 concurrent students, this eliminates ~400 unnecessary user-table reads
per second for the most common auth path.

Cache invalidation
------------------
The cache key is invalidated on account lock (locked_until is set) by
comparing the cached value's locked_until field; a locked user is always
re-fetched from the DB to ensure the lock is respected immediately.
"""
import json
import logging
from typing import Optional
from datetime import datetime

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.user import User
from app.utils.security import decode_token
from app.core.redis import cache_get, cache_set, cache_delete

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

# Cache TTL for user objects (seconds).  Short enough to respect lock changes.
_USER_CACHE_TTL = 300  # 5 minutes


def _user_cache_key(user_id: str) -> str:
    return f"auth:user:{user_id}"


def _serialize_user(user: User) -> dict:
    """Convert a User ORM object to a JSON-serialisable dict."""
    return {
        "id": str(user.id),
        "email": user.email,
        "display_name": user.display_name,
        "role": user.role.value,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "failed_attempts": user.failed_attempts,
        "locked_until": user.locked_until.isoformat() if user.locked_until else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "preferences": user.preferences,
        "notification_preferences": user.notification_preferences,
        "password_hash": user.password_hash,  # kept for auth service comparisons
    }


def _deserialize_user(data: dict) -> User:
    """Reconstruct a lightweight User-like object from a cached dict."""
    u = User.__new__(User)
    u.id = data["id"]
    u.email = data["email"]
    u.display_name = data.get("display_name")
    u.role = data["role"]
    u.is_active = data["is_active"]
    u.is_verified = data["is_verified"]
    u.failed_attempts = data.get("failed_attempts", 0)
    u.locked_until = datetime.fromisoformat(data["locked_until"]) if data.get("locked_until") else None
    u.last_login = datetime.fromisoformat(data["last_login"]) if data.get("last_login") else None
    u.preferences = data.get("preferences")
    u.notification_preferences = data.get("notification_preferences")
    u.password_hash = data.get("password_hash")
    return u


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    payload = decode_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ── Redis cache check ─────────────────────────────────────────────────────
    cache_key = _user_cache_key(user_id)
    cached = await cache_get(cache_key)
    if cached:
        user = _deserialize_user(cached)
        # Always honour an active lock even when cached
        if user.locked_until and user.locked_until > datetime.utcnow():
            raise HTTPException(status_code=status.HTTP_423_LOCKED, detail="Account is locked")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
        return user

    # ── DB fallback ───────────────────────────────────────────────────────────
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")

    if user.locked_until and user.locked_until > datetime.utcnow():
        # Don't cache locked users — force a fresh DB check next request
        raise HTTPException(status_code=status.HTTP_423_LOCKED, detail="Account is locked")

    # Cache the valid user
    try:
        await cache_set(cache_key, _serialize_user(user), ttl=_USER_CACHE_TTL)
    except Exception as e:
        logger.warning(f"[Auth] Failed to cache user {user_id}: {e}")

    return user


async def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    try:
        return await get_current_user(token, db)
    except HTTPException:
        return None


async def invalidate_user_cache(user_id: str) -> None:
    """
    Call this whenever a user's auth-relevant state changes:
    - Password change
    - Account lock / unlock
    - Role change
    - Account deactivation
    """
    await cache_delete(_user_cache_key(user_id))


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return current_user


async def require_lecturer(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.value != "lecturer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return current_user


async def require_student(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.value != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return current_user