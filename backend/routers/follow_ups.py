"""Follow-ups top-level router (cross-scan)."""
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.dependencies import get_current_user
from backend.models import User, FollowUp, FollowUpStatus
from backend.schemas import FollowUpOut

router = APIRouter(prefix="/follow-ups", tags=["follow-ups"])


@router.get("", response_model=List[FollowUpOut])
def list_my_follow_ups(
    status: str = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(FollowUp).filter(FollowUp.farmer_id == user.id)
    if status:
        q = q.filter(FollowUp.status == status)
    return q.order_by(FollowUp.due_date.asc()).all()


@router.get("/overdue", response_model=List[FollowUpOut])
def overdue_follow_ups(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(FollowUp)
        .filter(
            FollowUp.farmer_id == user.id,
            FollowUp.status == FollowUpStatus.pending,
            FollowUp.due_date < datetime.utcnow(),
        )
        .order_by(FollowUp.due_date.asc())
        .all()
    )
