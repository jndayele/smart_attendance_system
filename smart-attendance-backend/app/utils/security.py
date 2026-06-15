import random
import string
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any

import bcrypt
from jose import jwt, JWTError
from fastapi import HTTPException, status

from app.config import get_settings

settings = get_settings()

def hash_password(plain: str) -> str:
    """Hash a password for storing."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(plain.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    """Verify a hashed password."""
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create a new JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def create_reset_token(email: str) -> str:
    """Create a token for password reset."""
    expire = datetime.utcnow() + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": email, "type": "reset", "exp": expire}
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def create_activation_token(email: str, name: str = None) -> str:
    """Create a token for lecturer activation."""
    expire = datetime.utcnow() + timedelta(hours=settings.ACTIVATION_TOKEN_EXPIRE_HOURS)
    to_encode = {"sub": email, "type": "activation", "exp": expire}
    if name:
        to_encode["name"] = name
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_invitation_token(email: str) -> str:
    """Create a token for student invitation."""
    expire = datetime.utcnow() + timedelta(hours=settings.INVITATION_TOKEN_EXPIRE_HOURS)
    to_encode = {"sub": email, "type": "invitation", "exp": expire}
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> Dict[str, Any]:
    """Decode a JWT token, verify it, and return its payload."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def generate_session_code(length: int = 6) -> str:
    """
    Generate a random alphanumeric uppercase code.
    Excludes ambiguous characters (0, O, 1, I).
    """
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return ''.join(random.choice(chars) for _ in range(length))

def generate_qr_token() -> str:
    """Generate a unique UUID-based token for QR codes."""
    return str(uuid.uuid4())

def generate_secure_password(length: int = 12) -> str:
    """
    Generate a cryptographically secure random password.
    Guarantees at least one uppercase, lowercase, digit, and
    special character. Default length: 12.
    """
    import secrets
    import string

    uppercase = string.ascii_uppercase
    lowercase = string.ascii_lowercase
    digits = string.digits
    special = "!@#$%^&*"

    password = [
        secrets.choice(uppercase),
        secrets.choice(lowercase),
        secrets.choice(digits),
        secrets.choice(special),
    ]

    all_chars = uppercase + lowercase + digits + special
    for _ in range(length - 4):
        password.append(secrets.choice(all_chars))

    secrets.SystemRandom().shuffle(password)
    return ''.join(password)
