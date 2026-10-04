"""Scan router: upload image, run AI prediction, save to DB."""
import io
import os
import uuid
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
from PIL import Image, UnidentifiedImageError

from backend.config import settings
from backend.database import get_db
from backend.dependencies import get_current_user
from backend.models import (
    User, Farm, CropPlot, Scan, FollowUp, Feedback,
    ModelVersion, Notification, NotificationType,
    FollowUpStatus, GroundTruthStatus
)
from backend.schemas import (
    ScanOut, FollowUpCreate, FollowUpUpdate, FollowUpOut,
    FeedbackCreate, FeedbackOut
)
from backend.recommendations import get_recommendations

# Lazy-load predictor at module level (shared instance)
_predictor = None

def _get_predictor():
    global _predictor
    if _predictor is None:
        from ml.inference.predictor import Predictor
        _predictor = Predictor(settings.model_path)
    return _predictor


UPLOAD_DIR = Path(settings.upload_dir)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(prefix="/scans", tags=["scans"])


def _get_or_create_model_version(db: Session) -> Optional[str]:
    """Register the current model version in DB if not already there."""
    mv = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
    if mv:
        return mv.id
    # Load from artifacts
    metrics_path = Path(__file__).resolve().parents[2] / "artifacts" / "test_metrics.json"
    if metrics_path.exists():
        m = json.loads(metrics_path.read_text())
    else:
        m = {}
    pred = _get_predictor()
    mv = ModelVersion(
        model_name="efficientnet_b0",
        version="1.0.0",
        artifact_path=settings.model_path,
        classes=pred.classes if pred.ready else [],
        confidence_threshold=pred.threshold if pred.ready else 0.7,
        test_accuracy=m.get("accuracy"),
        macro_precision=m.get("macro_precision"),
        macro_recall=m.get("macro_recall_sensitivity"),
        macro_specificity=m.get("macro_specificity"),
        macro_f1=m.get("macro_f1"),
        notes="EfficientNet-B0 trained on PlantVillage-derived dataset. See MODEL.md for limitations.",
        is_active=True,
    )
    db.add(mv)
    db.commit()
    db.refresh(mv)
    return mv.id


def _notify(db: Session, user_id: str, ntype: NotificationType, title: str, body: str,
            scan_id: Optional[str] = None, follow_up_id: Optional[str] = None):
    n = Notification(
        user_id=user_id,
        type=ntype,
        title=title,
        body=body,
        related_scan_id=scan_id,
        related_follow_up_id=follow_up_id,
    )
    db.add(n)


@router.post("", response_model=ScanOut, status_code=201)
async def create_scan(
    file: UploadFile = File(...),
    farm_id: Optional[str] = Form(None),
    plot_id: Optional[str] = Form(None),
    crop: Optional[str] = Form(None),
    lang: str = Form("en"),
    growth_stage: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Validate file type
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(415, "Unsupported image format. Use JPEG, PNG, or WebP.")

    data = await file.read()
    if len(data) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(413, f"Image too large (max {settings.max_upload_size_mb} MB).")

    # Validate farm ownership
    if farm_id:
        farm = db.query(Farm).filter(Farm.id == farm_id, Farm.owner_id == user.id).first()
        if not farm:
            raise HTTPException(404, "Farm not found")
        county = farm.county
    else:
        county = user.county

    if plot_id:
        plot = db.query(CropPlot).filter(CropPlot.id == plot_id).first()
        if not plot or (farm_id and plot.farm_id != farm_id):
            raise HTTPException(404, "Plot not found")
        if not crop:
            crop = plot.crop_type

    # Parse image
    try:
        image = Image.open(io.BytesIO(data)).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(400, "Invalid image file.")

    # Run ML prediction (preserving existing pipeline)
    predictor = _get_predictor()
    result = predictor.predict(image, crop=crop)
    if result.get("status") == "ok":
        recs = get_recommendations(result["label"], lang)
        result["recommendations"] = recs
    else:
        recs = None

    # Save image to disk
    ext = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}.get(file.content_type, ".jpg")
    fname = f"{uuid.uuid4()}{ext}"
    img_path = UPLOAD_DIR / fname
    img_path.write_bytes(data)

    # Save Grad-CAM if present (optional)
    gradcam_path = None
    if result.get("gradcam"):
        import base64
        gc_fname = f"gradcam_{fname}"
        gc_path = UPLOAD_DIR / gc_fname
        gc_data = result["gradcam"].split(",", 1)[-1]
        gc_path.write_bytes(base64.b64decode(gc_data))
        gradcam_path = str(gc_path.relative_to(Path(settings.upload_dir).parent))

    # Get or create model version record
    model_version_id = _get_or_create_model_version(db)

    # Build scan record
    scan = Scan(
        farmer_id=user.id,
        farm_id=farm_id,
        plot_id=plot_id,
        model_version_id=model_version_id,
        image_path=str(img_path.relative_to(Path(settings.upload_dir).parent)),
        status=result.get("status", "unknown"),
        predicted_label=result.get("label"),
        confidence=result.get("confidence"),
        entropy=result.get("entropy"),
        threshold=result.get("threshold"),
        is_accepted=(result.get("status") == "ok"),
        severity_category=result.get("severity", {}).get("category") if result.get("severity") else None,
        affected_percent=result.get("severity", {}).get("affected_percent") if result.get("severity") else None,
        recommendation_snapshot=recs,
        crop_hint=crop,
        county=county,
        growth_stage_at_scan=growth_stage,
        ground_truth_status=GroundTruthStatus.unverified,
        language=lang,
        top3=result.get("top3"),
        quality_info=result.get("quality"),
        gradcam_path=gradcam_path,
    )
    db.add(scan)
    db.flush()

    # Auto-create follow-up for disease detections
    if result.get("status") == "ok" and result.get("label") and not result["label"].endswith("_healthy"):
        severity_cat = scan.severity_category or "Unknown"
        days = 2 if severity_cat == "Severe" else 5
        fu = FollowUp(
            scan_id=scan.id,
            farmer_id=user.id,
            due_date=datetime.utcnow() + timedelta(days=days),
            notes=f"Auto-created: check {result['label'].replace('_', ' ')} progress",
        )
        db.add(fu)
        db.flush()

        # Notify severe cases
        if severity_cat == "Severe":
            _notify(
                db, user.id, NotificationType.severe_diagnosis,
                "Severe disease detected",
                f"Severe {result['label'].replace('_', ' ')} found. Please contact an extension officer.",
                scan_id=scan.id,
            )

    db.commit()
    db.refresh(scan)
    return scan


@router.get("", response_model=List[ScanOut])
def list_scans(
    farm_id: Optional[str] = None,
    plot_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Scan).filter(Scan.farmer_id == user.id)
    if farm_id:
        q = q.filter(Scan.farm_id == farm_id)
    if plot_id:
        q = q.filter(Scan.plot_id == plot_id)
    return q.order_by(Scan.timestamp.desc()).offset(offset).limit(limit).all()


@router.get("/{scan_id}", response_model=ScanOut)
def get_scan(
    scan_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(404, "Scan not found")
    # Owners, extension officers, and admins may view
    from backend.models import UserRole
    if scan.farmer_id != user.id and user.role not in (UserRole.extension_officer, UserRole.admin):
        raise HTTPException(403, "Access denied")
    return scan


@router.get("/{scan_id}/gradcam")
def get_gradcam(
    scan_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return Grad-CAM image if available."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(404, "Scan not found")
    if scan.farmer_id != user.id:
        from backend.models import UserRole
        if user.role not in (UserRole.extension_officer, UserRole.admin):
            raise HTTPException(403, "Access denied")
    if not scan.gradcam_path:
        raise HTTPException(404, "No Grad-CAM available for this scan")
    from fastapi.responses import FileResponse
    full_path = Path(__file__).resolve().parents[2] / scan.gradcam_path
    if not full_path.exists():
        raise HTTPException(404, "Grad-CAM file not found")
    return FileResponse(str(full_path), media_type="image/jpeg")


# ──────────────────────────── Follow-Ups ────────────────────────────

@router.post("/{scan_id}/follow-ups", response_model=FollowUpOut, status_code=201)
def create_follow_up(
    scan_id: str,
    payload: FollowUpCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.farmer_id == user.id).first()
    if not scan:
        raise HTTPException(404, "Scan not found")
    fu = FollowUp(
        scan_id=scan_id,
        farmer_id=user.id,
        due_date=payload.due_date,
        notes=payload.notes,
    )
    db.add(fu)
    db.commit()
    db.refresh(fu)
    return fu


@router.get("/{scan_id}/follow-ups", response_model=List[FollowUpOut])
def list_follow_ups(
    scan_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.farmer_id == user.id).first()
    if not scan:
        raise HTTPException(404, "Scan not found")
    return db.query(FollowUp).filter(FollowUp.scan_id == scan_id).all()


@router.put("/{scan_id}/follow-ups/{fu_id}", response_model=FollowUpOut)
def update_follow_up(
    scan_id: str,
    fu_id: str,
    payload: FollowUpUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    fu = db.query(FollowUp).filter(FollowUp.id == fu_id, FollowUp.farmer_id == user.id).first()
    if not fu:
        raise HTTPException(404, "Follow-up not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(fu, field, value)
    if payload.status == FollowUpStatus.completed:
        fu.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(fu)
    return fu


# ──────────────────────────── Feedback ────────────────────────────

@router.post("/{scan_id}/feedback", response_model=FeedbackOut, status_code=201)
def save_feedback(
    scan_id: str,
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.farmer_id == user.id).first()
    if not scan:
        raise HTTPException(404, "Scan not found")
    existing = db.query(Feedback).filter(Feedback.scan_id == scan_id).first()
    if existing:
        # Update existing feedback
        for field, value in payload.model_dump(exclude_none=True).items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing
    fb = Feedback(scan_id=scan_id, farmer_id=user.id, **payload.model_dump())
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return fb


@router.get("/{scan_id}/feedback", response_model=FeedbackOut)
def get_feedback(
    scan_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.farmer_id == user.id).first()
    if not scan:
        raise HTTPException(404, "Scan not found")
    fb = db.query(Feedback).filter(Feedback.scan_id == scan_id).first()
    if not fb:
        raise HTTPException(404, "No feedback yet")
    return fb


# ──────────────────────────── Report PDF & Secure Image ────────────────────────────

@router.get("/{scan_id}/report.pdf")
def download_scan_report(
    scan_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Generate and return downloadable diagnostic PDF report."""
    from fastapi import Response
    from backend.models import UserRole
    from backend.services.report_service import generate_scan_pdf_report

    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(404, "Scan not found")
    if scan.farmer_id != user.id and user.role not in (UserRole.extension_officer, UserRole.admin):
        raise HTTPException(403, "Access denied")

    farmer = db.query(User).filter(User.id == scan.farmer_id).first()
    farmer_name = farmer.full_name if farmer else "Farmer"
    farm_name = scan.farm.name if scan.farm else None
    plot_crop = scan.plot.crop_type.title() if scan.plot else (scan.crop_hint.title() if scan.crop_hint else "Leaf Sample")

    expert_data = None
    if scan.expert_review:
        expert_data = {
            "decision": scan.expert_review.decision.value,
            "corrected_label": scan.expert_review.corrected_label,
            "notes": scan.expert_review.notes,
        }

    pdf_bytes = generate_scan_pdf_report(
        farmer_name=farmer_name,
        farm_name=farm_name,
        county=scan.county,
        plot_crop=plot_crop,
        scan_date=scan.timestamp,
        prediction_label=scan.predicted_label or scan.status,
        confidence=scan.confidence,
        severity_category=scan.severity_category,
        affected_percent=scan.affected_percent,
        recommendations=scan.recommendation_snapshot,
        expert_verification=expert_data,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="crop_report_{scan_id[:8]}.pdf"'
        }
    )


@router.get("/{scan_id}/image")
def get_scan_image(
    scan_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Secure image retrieval: only authorized farmer, extension officer, or admin."""
    from fastapi.responses import FileResponse
    from backend.models import UserRole

    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(404, "Scan not found")
    if scan.farmer_id != user.id and user.role not in (UserRole.extension_officer, UserRole.admin):
        raise HTTPException(403, "Access denied")
    if not scan.image_path:
        raise HTTPException(404, "No image associated with this scan")

    full_path = Path(__file__).resolve().parents[2] / scan.image_path
    if not full_path.exists():
        raise HTTPException(404, "Image file not found on disk")
    return FileResponse(str(full_path))

