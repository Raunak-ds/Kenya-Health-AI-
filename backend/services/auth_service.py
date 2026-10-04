"""Authentication service: password hashing and JWT tokens."""
from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from backend.config import settings
from backend.models import User, UserRole


# ──────────────────────────── Password ────────────────────────────

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(rounds=12)).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ──────────────────────────── JWT ────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        return None


# ──────────────────────────── User helpers ────────────────────────────

def get_user_by_phone(db: Session, phone: str) -> Optional[User]:
    return db.query(User).filter(User.phone_number == phone).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def authenticate_user(db: Session, phone: str, password: str) -> Optional[User]:
    user = get_user_by_phone(db, phone)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def create_user(
    db: Session,
    full_name: str,
    phone_number: str,
    password: str,
    role: UserRole = UserRole.farmer,
    email: Optional[str] = None,
    preferred_language: str = "en",
    county: Optional[str] = None,
    sub_county: Optional[str] = None,
) -> User:
    user = User(
        full_name=full_name,
        phone_number=phone_number,
        hashed_password=hash_password(password),
        role=role,
        email=email,
        preferred_language=preferred_language,
        county=county,
        sub_county=sub_county,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
