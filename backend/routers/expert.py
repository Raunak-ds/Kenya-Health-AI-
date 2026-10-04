"""Expert review router for extension officers."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.dependencies import get_extension_or_admin, get_current_user
from backend.models import User, Scan, ExpertReview, Notification, NotificationType, GroundTruthStatus
from backend.schemas import ExpertReviewCreate, ExpertReviewOut, ScanOut

router = APIRouter(prefix="/expert", tags=["expert"])


@router.get("/pending", response_model=List[ScanOut])
def pending_reviews(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    user: User = Depends(get_extension_or_admin),
):
    """Scans that have no expert review yet (prioritise low confidence + severe)."""
    reviewed_ids = [r.scan_id for r in db.query(ExpertReview.scan_id).all()]
    q = db.query(Scan).filter(
        ~Scan.id.in_(reviewed_ids),
        Scan.status.in_(["ok", "uncertain"])
    )
    return q.order_by(Scan.confidence.asc(), Scan.timestamp.desc()).offset(offset).limit(limit).all()


@router.get("/low-confidence", response_model=List[ScanOut])
def low_confidence_scans(
    threshold: float = 0.80,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_extension_or_admin),
):
    return (
        db.query(Scan)
        .filter(Scan.confidence < threshold, Scan.status == "ok")
        .order_by(Scan.confidence.asc())
        .limit(limit)
        .all()
    )


@router.get("/severe", response_model=List[ScanOut])
def severe_scans(
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_extension_or_admin),
):
    return (
        db.query(Scan)
        .filter(Scan.severity_category == "Severe")
        .order_by(Scan.timestamp.desc())
        .limit(limit)
        .all()
    )


@router.post("/scans/{scan_id}/review", response_model=ExpertReviewOut, status_code=201)
def submit_review(
    scan_id: str,
    payload: ExpertReviewCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_extension_or_admin),
):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(404, "Scan not found")
    existing = db.query(ExpertReview).filter(ExpertReview.scan_id == scan_id).first()
    if existing:
        raise HTTPException(409, "Review already submitted for this scan. Use PUT to update.")

    review = ExpertReview(
        scan_id=scan_id,
        reviewed_by_id=user.id,
        **payload.model_dump(),
    )
    db.add(review)

    # Update ground truth on scan
    if payload.corrected_label:
        scan.verified_label = payload.corrected_label
        scan.verified_by_id = user.id
        from datetime import datetime
        scan.verification_timestamp = datetime.utcnow()
        scan.ground_truth_status = GroundTruthStatus.expert_verified

    # Notify farmer
    action_map = {
        "confirmed": "Your AI diagnosis has been confirmed by an expert.",
        "corrected": f"An expert has reviewed your scan and suggests: {payload.corrected_label or 'see notes'}.",
        "inconclusive": "An expert reviewed your scan and found it inconclusive. Please try another image.",
        "needs_new_image": "An expert requests a clearer image for your scan.",
    }
    body = action_map.get(payload.decision.value, "An expert reviewed your scan.")
    n = Notification(
        user_id=scan.farmer_id,
        type=NotificationType.expert_reply,
        title="Expert review received",
        body=body,
        related_scan_id=scan_id,
    )
    db.add(n)

    db.commit()
    db.refresh(review)
    return review


@router.put("/scans/{scan_id}/review", response_model=ExpertReviewOut)
def update_review(
    scan_id: str,
    payload: ExpertReviewCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_extension_or_admin),
):
    review = db.query(ExpertReview).filter(ExpertReview.scan_id == scan_id).first()
    if not review:
        raise HTTPException(404, "No review found for this scan")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(review, field, value)
    review.reviewed_by_id = user.id
    db.commit()
    db.refresh(review)
    return review


@router.get("/scans/{scan_id}/review", response_model=ExpertReviewOut)
def get_review(
    scan_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    review = db.query(ExpertReview).filter(ExpertReview.scan_id == scan_id).first()
    if not review:
        raise HTTPException(404, "No review for this scan")
    return review
