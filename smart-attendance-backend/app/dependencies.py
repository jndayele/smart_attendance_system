from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.user import User
from app.utils.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Decode JWT, fetch user from DB, raise 401 if invalid/inactive/locked.
    """
    payload = decode_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
        
    if user.locked_until and user.locked_until > user.updated_at: # actually need current time check
        from datetime import datetime
        if user.locked_until > datetime.utcnow():
            raise HTTPException(status_code=status.HTTP_423_LOCKED, detail="Account is locked")
            
    return user

async def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Like get_current_user but returns None if no token provided."""
    if not token:
        return None
    try:
        return await get_current_user(token, db)
    except HTTPException:
        return None

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to enforce admin role."""
    if current_user.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return current_user

async def require_lecturer(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to enforce lecturer role."""
    if current_user.role.value != "lecturer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return current_user

async def require_student(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to enforce student role."""
    if current_user.role.value != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return current_user
