import socketio
import logging
import os

logger = logging.getLogger(__name__)

# Build the allowed origins list.
# In production, set the CORS_ORIGINS env var to your actual Vercel frontend URLs.
# Locally, we allow all localhost Vite dev-server ports.
_cors_env = os.environ.get('CORS_ORIGINS', '')
_extra_origins = [o.strip() for o in _cors_env.split(',') if o.strip()]

ALLOWED_ORIGINS = list(set([
    # Local dev — Vite uses 5173 by default; 5174/5175 for parallel frontends
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    # Allow anything added via the CORS_ORIGINS env var (production Vercel URLs etc.)
    *_extra_origins,
]))

# Create the Socket.IO async server
sio_server = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=ALLOWED_ORIGINS,
    logger=False,
    engineio_logger=False,
)

@sio_server.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")

@sio_server.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")

@sio_server.event
async def join_session(sid, data):
    """
    Client requests to join a specific session room so it receives
    targeted events (attendance_marked, qr_refreshed, session_ended).
    """
    session_id = data.get("session_id")
    if session_id:
        room_name = f"session_{session_id}"
        await sio_server.enter_room(sid, room_name)
        logger.info(f"Client {sid} joined room {room_name}")

@sio_server.event
async def leave_session(sid, data):
    """
    Client requests to leave a specific session room.
    """
    session_id = data.get("session_id")
    if session_id:
        room_name = f"session_{session_id}"
        await sio_server.leave_room(sid, room_name)
        logger.info(f"Client {sid} left room {room_name}")
