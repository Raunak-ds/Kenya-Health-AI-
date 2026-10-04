"""ORM models for the Kenya Crop Health Management Platform."""
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text,
    ForeignKey, Enum as SAEnum, JSON
)
from sqlalchemy.orm import relationship
from backend.database import Base
import enum


def _uuid():
    return str(uuid.uuid4())


def _now():
    return datetime.utcnow()


# ──────────────────────────── Enumerations ────────────────────────────

class UserRole(str, enum.Enum):
    farmer = "farmer"
    extension_officer = "extension_officer"
    admin = "admin"


class GroundTruthStatus(str, enum.Enum):
    unverified = "unverified"
    farmer_reported = "farmer_reported"
    expert_verified = "expert_verified"


class FollowUpStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    missed = "missed"
    escalated = "escalated"


class FeedbackHelpful(str, enum.Enum):
    yes = "yes"
    no = "no"
    not_sure = "not_sure"


class FeedbackOutcome(str, enum.Enum):
    improved = "improved"
    unchanged = "unchanged"
    worsened = "worsened"


class ExpertDecision(str, enum.Enum):
    confirmed = "confirmed"
    corrected = "corrected"
    inconclusive = "inconclusive"
    needs_new_image = "needs_new_image"


class PlotStatus(str, enum.Enum):
    active = "active"
    harvested = "harvested"
    fallow = "fallow"
    abandoned = "abandoned"


# ──────────────────────────── User ────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    full_name = Column(String(200), nullable=False)
    phone_number = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(200), unique=True, nullable=True, index=True)
    hashed_password = Column(String(200), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.farmer, nullable=False)
    preferred_language = Column(String(5), default="en")
    county = Column(String(100), nullable=True)
    sub_county = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_now)
    last_login = Column(DateTime, nullable=True)

    farms = relationship("Farm", back_populates="owner", cascade="all, delete-orphan")
    scans = relationship("Scan", foreign_keys="Scan.farmer_id", back_populates="farmer")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    expert_reviews = relationship("ExpertReview", foreign_keys="ExpertReview.reviewed_by_id", back_populates="reviewer")


# ──────────────────────────── Farm ────────────────────────────

class Farm(Base):
    __tablename__ = "farms"

    id = Column(String, primary_key=True, default=_uuid)
    owner_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    county = Column(String(100), nullable=False)
    sub_county = Column(String(100), nullable=True)
    approximate_location = Column(String(200), nullable=True)  # free text, NOT exact GPS
    size_value = Column(Float, nullable=True)
    size_unit = Column(String(20), default="acres")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_now)

    owner = relationship("User", back_populates="farms")
    plots = relationship("CropPlot", back_populates="farm", cascade="all, delete-orphan")


# ──────────────────────────── Crop Plot ────────────────────────────

class CropPlot(Base):
    __tablename__ = "crop_plots"

    id = Column(String, primary_key=True, default=_uuid)
    farm_id = Column(String, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_type = Column(String(50), nullable=False)  # maize, potato, tomato
    variety = Column(String(100), nullable=True)
    planting_date = Column(DateTime, nullable=True)
    field_size_value = Column(Float, nullable=True)
    field_size_unit = Column(String(20), default="acres")
    growth_stage = Column(String(100), nullable=True)
    status = Column(SAEnum(PlotStatus), default=PlotStatus.active)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_now)

    farm = relationship("Farm", back_populates="plots")
    scans = relationship("Scan", back_populates="plot")


# ──────────────────────────── Model Version ────────────────────────────

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(String, primary_key=True, default=_uuid)
    model_name = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False)
    artifact_path = Column(String(500), nullable=False)
    classes = Column(JSON, nullable=True)
    confidence_threshold = Column(Float, nullable=True)
    test_accuracy = Column(Float, nullable=True)
    macro_precision = Column(Float, nullable=True)
    macro_recall = Column(Float, nullable=True)
    macro_specificity = Column(Float, nullable=True)
    macro_f1 = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_now)

    scans = relationship("Scan", back_populates="model_version_rel")


# ──────────────────────────── Scan ────────────────────────────

class Scan(Base):
    __tablename__ = "scans"

    id = Column(String, primary_key=True, default=_uuid)
    farmer_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    farm_id = Column(String, ForeignKey("farms.id"), nullable=True, index=True)
    plot_id = Column(String, ForeignKey("crop_plots.id"), nullable=True, index=True)
    model_version_id = Column(String, ForeignKey("model_versions.id"), nullable=True)

    image_path = Column(String(500), nullable=True)
    timestamp = Column(DateTime, default=_now, index=True)

    # ML results
    status = Column(String(30), nullable=False)  # ok, uncertain, invalid_image, model_missing
    predicted_label = Column(String(100), nullable=True)
    confidence = Column(Float, nullable=True)
    entropy = Column(Float, nullable=True)
    threshold = Column(Float, nullable=True)
    is_accepted = Column(Boolean, nullable=True)

    # Severity
    severity_category = Column(String(50), nullable=True)
    affected_percent = Column(Float, nullable=True)

    # Recommendations snapshot (saved at scan time)
    recommendation_snapshot = Column(JSON, nullable=True)
    recommendation_version = Column(String(50), default="kb-1.0")

    # Field data collection
    crop_hint = Column(String(50), nullable=True)
    county = Column(String(100), nullable=True)
    growth_stage_at_scan = Column(String(100), nullable=True)

    # Ground truth
    ground_truth_status = Column(SAEnum(GroundTruthStatus), default=GroundTruthStatus.unverified)
    verified_label = Column(String(100), nullable=True)
    verified_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    verification_timestamp = Column(DateTime, nullable=True)

    # Gradcam stored?
    gradcam_path = Column(String(500), nullable=True)

    # Language used at scan time
    language = Column(String(5), default="en")

    # Top3 predictions
    top3 = Column(JSON, nullable=True)
    quality_info = Column(JSON, nullable=True)

    # Relationships
    farmer = relationship("User", foreign_keys=[farmer_id], back_populates="scans")
    farm = relationship("Farm")
    plot = relationship("CropPlot", back_populates="scans")
    model_version_rel = relationship("ModelVersion", back_populates="scans")
    follow_ups = relationship("FollowUp", foreign_keys="FollowUp.scan_id", back_populates="scan", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="scan", uselist=False, cascade="all, delete-orphan")
    expert_review = relationship("ExpertReview", back_populates="scan", uselist=False, cascade="all, delete-orphan")


# ──────────────────────────── Follow-Up ────────────────────────────

class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(String, primary_key=True, default=_uuid)
    scan_id = Column(String, ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, index=True)
    farmer_id = Column(String, ForeignKey("users.id"), nullable=False)
    due_date = Column(DateTime, nullable=False)
    status = Column(SAEnum(FollowUpStatus), default=FollowUpStatus.pending)
    notes = Column(Text, nullable=True)
    outcome = Column(String(50), nullable=True)  # improving, unchanged, worsening
    completed_at = Column(DateTime, nullable=True)
    follow_up_scan_id = Column(String, ForeignKey("scans.id"), nullable=True)
    created_at = Column(DateTime, default=_now)

    scan = relationship("Scan", foreign_keys=[scan_id], back_populates="follow_ups")
    farmer = relationship("User")


# ──────────────────────────── Feedback ────────────────────────────

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String, primary_key=True, default=_uuid)
    scan_id = Column(String, ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, unique=True)
    farmer_id = Column(String, ForeignKey("users.id"), nullable=False)
    helpful = Column(SAEnum(FeedbackHelpful), nullable=True)
    outcome = Column(SAEnum(FeedbackOutcome), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_now)

    scan = relationship("Scan", back_populates="feedback")
    farmer = relationship("User")


# ──────────────────────────── Expert Review ────────────────────────────

class ExpertReview(Base):
    __tablename__ = "expert_reviews"

    id = Column(String, primary_key=True, default=_uuid)
    scan_id = Column(String, ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, unique=True)
    reviewed_by_id = Column(String, ForeignKey("users.id"), nullable=False)
    decision = Column(SAEnum(ExpertDecision), nullable=False)
    corrected_label = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_now)

    scan = relationship("Scan", back_populates="expert_review")
    reviewer = relationship("User", foreign_keys=[reviewed_by_id], back_populates="expert_reviews")


# ──────────────────────────── Notification ────────────────────────────

class NotificationType(str, enum.Enum):
    follow_up_due = "follow_up_due"
    severe_diagnosis = "severe_diagnosis"
    expert_reply = "expert_reply"
    repeated_disease = "repeated_disease"
    needs_new_image = "needs_new_image"
    general = "general"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(SAEnum(NotificationType), default=NotificationType.general)
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    related_scan_id = Column(String, ForeignKey("scans.id"), nullable=True)
    related_follow_up_id = Column(String, ForeignKey("follow_ups.id"), nullable=True)
    created_at = Column(DateTime, default=_now)

    user = relationship("User", back_populates="notifications")
