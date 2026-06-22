import socketio
import logging

logger = logging.getLogger(__name__)

# Create the Socket.IO async server
sio_server = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*'
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
    Client requests to join a specific session room.
    """
    session_id = data.get("session_id")
    if session_id:
        room_name = f"session_{session_id}"
        sio_server.enter_room(sid, room_name)
        logger.info(f"Client {sid} joined room {room_name}")

@sio_server.event
async def leave_session(sid, data):
    """
    Client requests to leave a specific session room.
    """
    session_id = data.get("session_id")
    if session_id:
        room_name = f"session_{session_id}"
        sio_server.leave_room(sid, room_name)
        logger.info(f"Client {sid} left room {room_name}")
