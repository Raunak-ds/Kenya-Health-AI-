"""Authentication router: register, login, logout, profile."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User
from backend.services.auth_service import (
    get_user_by_phone, authenticate_user, create_user, create_access_token,
    hash_password, verify_password
)
from backend.schemas import (
    RegisterRequest, LoginRequest, TokenResponse, UserOut,
    UserUpdateRequest, PasswordChangeRequest
)
from backend.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if get_user_by_phone(db, payload.phone_number):
        raise HTTPException(400, "Phone number already registered")
    if payload.email:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise HTTPException(400, "Email already registered")
    user = create_user(
        db=db,
        full_name=payload.full_name,
        phone_number=payload.phone_number,
        password=payload.password,
        role=payload.role,
        email=payload.email,
        preferred_language=payload.preferred_language,
        county=payload.county,
        sub_county=payload.sub_county,
    )
    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        role=user.role.value,
        full_name=user.full_name,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.phone_number, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password",
        )
    user.last_login = datetime.utcnow()
    db.commit()
    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        role=user.role.value,
        full_name=user.full_name,
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(
    payload: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/change-password")
def change_password(
    payload: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(400, "Current password is incorrect")
    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
