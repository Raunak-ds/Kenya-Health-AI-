"""FastAPI dependency: extract and validate the current user from JWT."""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.services.auth_service import decode_token, get_user_by_id
from backend.models import User, UserRole

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not credentials:
        raise exc
    payload = decode_token(credentials.credentials)
    if not payload:
        raise exc
    user_id: str = payload.get("sub")
    if not user_id:
        raise exc
    user = get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise exc
    return user


def get_current_active_farmer(user: User = Depends(get_current_user)) -> User:
    if user.role not in (UserRole.farmer, UserRole.extension_officer, UserRole.admin):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user


def get_extension_or_admin(user: User = Depends(get_current_user)) -> User:
    if user.role not in (UserRole.extension_officer, UserRole.admin):
        raise HTTPException(status_code=403, detail="Extension officer or admin required")
    return user


def get_admin_user(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return get_user_by_id(db, user_id)
