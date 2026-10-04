"""Notifications router."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.dependencies import get_current_user
from backend.models import User, Notification
from backend.schemas import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=List[NotificationOut])
def list_notifications(
    unread_only: bool = False,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Notification).filter(Notification.user_id == user.id)
    if unread_only:
        q = q.filter(Notification.is_read == False)
    return q.order_by(Notification.created_at.desc()).limit(limit).all()


@router.post("/{notification_id}/read")
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    n = db.query(Notification).filter(
        Notification.id == notification_id, Notification.user_id == user.id
    ).first()
    if not n:
        raise HTTPException(404, "Notification not found")
    n.is_read = True
    db.commit()
    return {"message": "Marked as read"}


@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db.query(Notification).filter(
        Notification.user_id == user.id, Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.get("/count")
def unread_count(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    count = db.query(Notification).filter(
        Notification.user_id == user.id, Notification.is_read == False
    ).count()
    return {"unread_count": count}
