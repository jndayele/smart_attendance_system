"""
app/socket_manager.py

Socket.IO server backed by a Redis message-queue manager.

Why Redis?
----------
When Uvicorn runs with --workers N (N > 1), each worker is a separate OS
process with its own in-memory Socket.IO state.  A student on Worker-1 joins
the room "session_abc", but an attendance event emitted from Worker-2 only
reaches the in-process room map of Worker-2 — so the student never sees it.

By attaching an AsyncRedisManager the server publishes all emits through Redis
pub/sub, which every worker subscribes to.  A single emit from any worker is
fanned out to all connected clients regardless of which worker they're on.

Fallback
--------
If REDIS_URL is not set (e.g. during local dev without Redis), the server falls
back to the default in-memory manager with a warning.
"""
import logging
import os

import socketio

logger = logging.getLogger(__name__)

# ─── CORS origins ─────────────────────────────────────────────────────────────
_cors_env = os.environ.get("CORS_ORIGINS", "")
_extra_origins = [o.strip() for o in _cors_env.split(",") if o.strip()]

ALLOWED_ORIGINS = list(set([
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    *_extra_origins,
]))

# ─── Redis-backed message queue (multi-worker safe) ───────────────────────────
_redis_url = os.environ.get("REDIS_URL", "")

if _redis_url:
    logger.info(f"[SocketIO] Using AsyncRedisManager at {_redis_url}")
    _client_manager = socketio.AsyncRedisManager(_redis_url)
else:
    logger.warning(
        "[SocketIO] REDIS_URL not set — using in-memory manager. "
        "Socket.IO events will NOT be shared across multiple Uvicorn workers. "
        "Set REDIS_URL in .env before deploying to production."
    )
    _client_manager = None

# ─── Build the server ─────────────────────────────────────────────────────────
_server_kwargs = dict(
    async_mode="asgi",
    cors_allowed_origins=ALLOWED_ORIGINS,
    logger=False,
    engineio_logger=False,
)
if _client_manager is not None:
    _server_kwargs["client_manager"] = _client_manager

sio_server = socketio.AsyncServer(**_server_kwargs)


# ─── Events ───────────────────────────────────────────────────────────────────

@sio_server.event
async def connect(sid, environ):
    logger.info(f"[SocketIO] Client connected: {sid}")


@sio_server.event
async def disconnect(sid):
    logger.info(f"[SocketIO] Client disconnected: {sid}")


@sio_server.event
async def join_session(sid, data):
    """
    Client joins a session room to receive targeted real-time events:
    attendance_marked, qr_refreshed, session_ended.
    """
    session_id = data.get("session_id")
    if session_id:
        room_name = f"session_{session_id}"
        await sio_server.enter_room(sid, room_name)
        logger.info(f"[SocketIO] Client {sid} joined room {room_name}")


@sio_server.event
async def leave_session(sid, data):
    """
    Client leaves a session room.
    """
    session_id = data.get("session_id")
    if session_id:
        room_name = f"session_{session_id}"
        await sio_server.leave_room(sid, room_name)
        logger.info(f"[SocketIO] Client {sid} left room {room_name}")

