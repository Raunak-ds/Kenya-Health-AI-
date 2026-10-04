"""Analytics and dashboard router."""
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database import get_db
from backend.dependencies import get_current_user, get_admin_user, get_extension_or_admin
from backend.models import User, Farm, CropPlot, Scan, FollowUp, ExpertReview, FollowUpStatus, UserRole
from backend.schemas import DashboardStats, AdminStats

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=DashboardStats)
def farmer_dashboard(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    farms = db.query(func.count(Farm.id)).filter(Farm.owner_id == user.id).scalar() or 0
    plots = (
        db.query(func.count(CropPlot.id))
        .join(Farm, CropPlot.farm_id == Farm.id)
        .filter(Farm.owner_id == user.id)
        .scalar() or 0
    )
    scans_q = db.query(Scan).filter(Scan.farmer_id == user.id)
    total_scans = scans_q.count()
    healthy_scans = scans_q.filter(
        Scan.predicted_label.like("%_healthy")
    ).count()
    uncertain_scans = scans_q.filter(Scan.status == "uncertain").count()
    # Active issues = disease detections without completed follow-up
    disease_scans = db.query(Scan).filter(
        Scan.farmer_id == user.id,
        Scan.status == "ok",
        ~Scan.predicted_label.like("%_healthy"),
    ).all()
    active_issues = len(disease_scans)

    pending_fus = db.query(FollowUp).filter(
        FollowUp.farmer_id == user.id,
        FollowUp.status == FollowUpStatus.pending,
    ).count()

    needs_followup = db.query(FollowUp).filter(
        FollowUp.farmer_id == user.id,
        FollowUp.status == FollowUpStatus.pending,
        FollowUp.due_date <= datetime.utcnow(),
    ).count()

    from backend.models import Notification
    unread = db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.is_read == False,
    ).count()

    return DashboardStats(
        total_farms=farms,
        total_plots=plots,
        total_scans=total_scans,
        active_issues=active_issues,
        healthy_scans=healthy_scans,
        uncertain_scans=uncertain_scans,
        scans_requiring_followup=needs_followup,
        pending_follow_ups=pending_fus,
        unread_notifications=unread,
    )


@router.get("/health-trend")
def health_trend(
    days: int = 30,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Weekly scan counts split by healthy vs disease."""
    since = datetime.utcnow() - timedelta(days=days)
    scans = db.query(Scan).filter(Scan.farmer_id == user.id, Scan.timestamp >= since).all()
    weeks: dict = defaultdict(lambda: {"healthy": 0, "disease": 0, "uncertain": 0})
    for s in scans:
        w = s.timestamp.strftime("%Y-W%W")
        if s.status == "uncertain":
            weeks[w]["uncertain"] += 1
        elif s.predicted_label and s.predicted_label.endswith("_healthy"):
            weeks[w]["healthy"] += 1
        else:
            weeks[w]["disease"] += 1
    return {"weeks": dict(sorted(weeks.items()))}


@router.get("/farm-timeline")
def farm_timeline(
    farm_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Scan).filter(Scan.farmer_id == user.id)
    if farm_id:
        q = q.filter(Scan.farm_id == farm_id)
    scans = q.order_by(Scan.timestamp.asc()).limit(limit).all()
    events = []
    for s in scans:
        events.append({
            "date": s.timestamp.isoformat(),
            "type": "scan",
            "label": s.predicted_label,
            "status": s.status,
            "severity": s.severity_category,
            "scan_id": s.id,
        })
        for fu in s.follow_ups:
            events.append({
                "date": fu.due_date.isoformat(),
                "type": "follow_up",
                "status": fu.status.value,
                "outcome": fu.outcome,
                "scan_id": s.id,
                "follow_up_id": fu.id,
            })
    events.sort(key=lambda e: e["date"])
    return {"events": events}


@router.get("/admin", response_model=AdminStats)
def admin_analytics(
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
):
    now = datetime.utcnow()
    registered = db.query(func.count(User.id)).filter(User.role == UserRole.farmer).scalar() or 0
    active_7d = (
        db.query(func.count(User.id))
        .filter(User.role == UserRole.farmer, User.last_login >= now - timedelta(days=7))
        .scalar() or 0
    )
    active_30d = (
        db.query(func.count(User.id))
        .filter(User.role == UserRole.farmer, User.last_login >= now - timedelta(days=30))
        .scalar() or 0
    )
    total_farms = db.query(func.count(Farm.id)).scalar() or 0
    total_scans = db.query(func.count(Scan.id)).scalar() or 0
    disease_detections = (
        db.query(func.count(Scan.id))
        .filter(Scan.status == "ok", ~Scan.predicted_label.like("%_healthy"))
        .scalar() or 0
    )
    low_confidence = (
        db.query(func.count(Scan.id))
        .filter(Scan.status == "uncertain")
        .scalar() or 0
    )
    expert_reviewed = db.query(func.count(ExpertReview.id)).scalar() or 0

    total_fus = db.query(func.count(FollowUp.id)).scalar() or 0
    completed_fus = (
        db.query(func.count(FollowUp.id))
        .filter(FollowUp.status == FollowUpStatus.completed)
        .scalar() or 0
    )
    completion_rate = (completed_fus / total_fus) if total_fus > 0 else 0.0

    # Aggregate by crop
    by_crop: dict = defaultdict(int)
    by_disease: dict = defaultdict(int)
    by_county: dict = defaultdict(int)
    conf_total = 0.0
    conf_count = 0

    for s in db.query(Scan).filter(Scan.status == "ok").all():
        if s.predicted_label:
            parts = s.predicted_label.split("_", 1)
            by_crop[parts[0]] += 1
            by_disease[s.predicted_label] += 1
        if s.county:
            by_county[s.county] += 1
        if s.confidence:
            conf_total += s.confidence
            conf_count += 1

    avg_conf = (conf_total / conf_count) if conf_count > 0 else 0.0

    return AdminStats(
        registered_farmers=registered,
        active_farmers_7d=active_7d,
        active_farmers_30d=active_30d,
        total_farms=total_farms,
        total_scans=total_scans,
        disease_detections=disease_detections,
        low_confidence_scans=low_confidence,
        expert_reviewed_scans=expert_reviewed,
        follow_up_completion_rate=round(completion_rate, 4),
        scans_by_crop=dict(by_crop),
        scans_by_disease=dict(by_disease),
        scans_by_county=dict(by_county),
        average_confidence=round(avg_conf, 4),
    )


@router.get("/surveillance")
def disease_surveillance(
    db: Session = Depends(get_db),
    user: User = Depends(get_extension_or_admin),
):
    """Aggregated disease surveillance by county, disease, week."""
    scans = db.query(Scan).filter(Scan.status == "ok", Scan.predicted_label.isnot(None)).all()
    by_county: dict = defaultdict(lambda: defaultdict(int))
    by_disease_week: dict = defaultdict(lambda: defaultdict(int))

    for s in scans:
        county = s.county or "Unknown"
        label = s.predicted_label or "unknown"
        by_county[county][label] += 1
        week = s.timestamp.strftime("%Y-W%W")
        by_disease_week[label][week] += 1

    return {
        "by_county": {c: dict(d) for c, d in by_county.items()},
        "by_disease_week": {d: dict(w) for d, w in by_disease_week.items()},
    }


@router.get("/public-stats")
def public_stats(db: Session = Depends(get_db)):
    """Public-facing stats: only real database counts."""
    registered = db.query(func.count(User.id)).filter(User.role == UserRole.farmer).scalar() or 0
    total_scans = db.query(func.count(Scan.id)).scalar() or 0
    return {
        "registered_farmers": registered,
        "total_scans": total_scans,
    }
