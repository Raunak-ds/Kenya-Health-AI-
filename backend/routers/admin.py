"""Admin router: user management, system info, follow-ups management."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.dependencies import get_admin_user
from backend.models import User, Scan, Farm, FollowUp, ModelVersion
from backend.schemas import UserOut, ScanOut, FollowUpOut

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=List[UserOut])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
):
    return db.query(User).offset(skip).limit(limit).all()


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: str, db: Session = Depends(get_db), user: User = Depends(get_admin_user)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    return u


@router.post("/users/{user_id}/deactivate")
def deactivate_user(user_id: str, db: Session = Depends(get_db), user: User = Depends(get_admin_user)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    u.is_active = False
    db.commit()
    return {"message": f"User {u.full_name} deactivated"}


@router.get("/scans", response_model=List[ScanOut])
def list_all_scans(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
):
    return db.query(Scan).order_by(Scan.timestamp.desc()).offset(skip).limit(limit).all()


@router.get("/model-versions")
def list_model_versions(db: Session = Depends(get_db), user: User = Depends(get_admin_user)):
    return db.query(ModelVersion).all()


@router.get("/follow-ups", response_model=List[FollowUpOut])
def list_all_follow_ups(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
):
    return db.query(FollowUp).order_by(FollowUp.due_date.desc()).offset(skip).limit(limit).all()
