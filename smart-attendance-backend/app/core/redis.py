"""
app/core/redis.py

Central Redis connection pool.
All modules that need Redis should import `get_redis` and use it as a
FastAPI dependency or call `redis_client()` for direct access.

Usage in FastAPI routes:
    from app.core.redis import get_redis
    redis = Depends(get_redis)

Usage in Celery tasks or background code:
    from app.core.redis import redis_client
    r = await redis_client()
"""
import json
import logging
from contextlib import asynccontextmanager
from typing import Any, Optional

import redis.asyncio as aioredis

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# ─── Module-level pool (created once, shared across all requests) ─────────────
_redis_pool: Optional[aioredis.ConnectionPool] = None


def _get_pool() -> aioredis.ConnectionPool:
    """Return (or lazily create) the module-level connection pool."""
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = aioredis.ConnectionPool.from_url(
            settings.REDIS_URL,
            max_connections=50,
            decode_responses=True,
        )
    return _redis_pool


async def redis_client() -> aioredis.Redis:
    """Return a Redis client backed by the shared pool."""
    return aioredis.Redis(connection_pool=_get_pool())


async def get_redis() -> aioredis.Redis:
    """FastAPI dependency that yields a Redis client."""
    client = await redis_client()
    try:
        yield client
    finally:
        # Pool manages connections; individual clients don't need explicit close.
        pass


# ─── Convenience helpers ──────────────────────────────────────────────────────

async def cache_get(key: str) -> Optional[Any]:
    """Get a JSON-decoded value from the cache. Returns None on miss."""
    r = await redis_client()
    try:
        raw = await r.get(key)
        return json.loads(raw) if raw else None
    except Exception as e:
        logger.warning(f"[Redis] cache_get failed for key={key}: {e}")
        return None


async def cache_set(key: str, value: Any, ttl: int = 300) -> None:
    """Serialize value as JSON and store with a TTL (seconds)."""
    r = await redis_client()
    try:
        await r.setex(key, ttl, json.dumps(value, default=str))
    except Exception as e:
        logger.warning(f"[Redis] cache_set failed for key={key}: {e}")


async def cache_delete(key: str) -> None:
    """Delete a cache entry."""
    r = await redis_client()
    try:
        await r.delete(key)
    except Exception as e:
        logger.warning(f"[Redis] cache_delete failed for key={key}: {e}")


async def cache_delete_pattern(pattern: str) -> None:
    """Delete all keys matching a pattern (use sparingly — O(N) scan)."""
    r = await redis_client()
    try:
        keys = await r.keys(pattern)
        if keys:
            await r.delete(*keys)
    except Exception as e:
        logger.warning(f"[Redis] cache_delete_pattern failed for pattern={pattern}: {e}")


async def health_check() -> bool:
    """Return True if Redis is reachable."""
    try:
        r = await redis_client()
        return await r.ping()
    except Exception:
        return False
