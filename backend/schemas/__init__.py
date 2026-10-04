"""Pydantic schemas for request/response validation."""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, field_validator, ConfigDict
from backend.models import (
    UserRole, FollowUpStatus, FeedbackHelpful, FeedbackOutcome,
    ExpertDecision, PlotStatus, GroundTruthStatus
)

# ──────────────────────────── Auth ────────────────────────────

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=200)
    phone_number: str = Field(..., min_length=8, max_length=20)
    password: str = Field(..., min_length=8)
    email: Optional[str] = None
    preferred_language: str = "en"
    county: Optional[str] = None
    sub_county: Optional[str] = None
    role: UserRole = UserRole.farmer


class LoginRequest(BaseModel):
    phone_number: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    full_name: str


class UserOut(BaseModel):
    id: str
    full_name: str
    phone_number: str
    email: Optional[str]
    role: UserRole
    preferred_language: str
    county: Optional[str]
    sub_county: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=200)
    email: Optional[str] = None
    preferred_language: Optional[str] = None
    county: Optional[str] = None
    sub_county: Optional[str] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


# ──────────────────────────── Farm ────────────────────────────

class FarmCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    county: str = Field(..., min_length=1, max_length=100)
    sub_county: Optional[str] = None
    approximate_location: Optional[str] = None
    size_value: Optional[float] = None
    size_unit: str = "acres"
    notes: Optional[str] = None


class FarmUpdate(BaseModel):
    name: Optional[str] = None
    county: Optional[str] = None
    sub_county: Optional[str] = None
    approximate_location: Optional[str] = None
    size_value: Optional[float] = None
    size_unit: Optional[str] = None
    notes: Optional[str] = None


class FarmOut(BaseModel):
    id: str
    name: str
    county: str
    sub_county: Optional[str]
    approximate_location: Optional[str]
    size_value: Optional[float]
    size_unit: str
    notes: Optional[str]
    created_at: datetime
    plot_count: int = 0
    scan_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# ──────────────────────────── Crop Plot ────────────────────────────

class PlotCreate(BaseModel):
    crop_type: str = Field(..., pattern="^(maize|potato|tomato)$")
    variety: Optional[str] = None
    planting_date: Optional[datetime] = None
    field_size_value: Optional[float] = None
    field_size_unit: str = "acres"
    growth_stage: Optional[str] = None
    status: PlotStatus = PlotStatus.active
    notes: Optional[str] = None


class PlotUpdate(BaseModel):
    crop_type: Optional[str] = None
    variety: Optional[str] = None
    planting_date: Optional[datetime] = None
    field_size_value: Optional[float] = None
    field_size_unit: Optional[str] = None
    growth_stage: Optional[str] = None
    status: Optional[PlotStatus] = None
    notes: Optional[str] = None


class PlotOut(BaseModel):
    id: str
    farm_id: str
    crop_type: str
    variety: Optional[str]
    planting_date: Optional[datetime]
    field_size_value: Optional[float]
    field_size_unit: str
    growth_stage: Optional[str]
    status: PlotStatus
    notes: Optional[str]
    created_at: datetime
    scan_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# ──────────────────────────── Scan ────────────────────────────

class ScanOut(BaseModel):
    id: str
    farmer_id: str
    farm_id: Optional[str]
    plot_id: Optional[str]
    timestamp: datetime
    status: str
    predicted_label: Optional[str]
    confidence: Optional[float]
    entropy: Optional[float]
    threshold: Optional[float]
    is_accepted: Optional[bool]
    severity_category: Optional[str]
    affected_percent: Optional[float]
    recommendation_snapshot: Optional[Dict[str, Any]]
    crop_hint: Optional[str]
    county: Optional[str]
    growth_stage_at_scan: Optional[str]
    ground_truth_status: GroundTruthStatus
    verified_label: Optional[str]
    language: str
    top3: Optional[List[Dict[str, Any]]]
    quality_info: Optional[Dict[str, Any]]
    gradcam_path: Optional[str]
    model_version_id: Optional[str]

    model_config = ConfigDict(from_attributes=True)


# ──────────────────────────── Follow-Up ────────────────────────────

class FollowUpCreate(BaseModel):
    scan_id: str
    due_date: datetime
    notes: Optional[str] = None


class FollowUpUpdate(BaseModel):
    status: Optional[FollowUpStatus] = None
    notes: Optional[str] = None
    outcome: Optional[str] = None


class FollowUpOut(BaseModel):
    id: str
    scan_id: str
    farmer_id: str
    due_date: datetime
    status: FollowUpStatus
    notes: Optional[str]
    outcome: Optional[str]
    completed_at: Optional[datetime]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ──────────────────────────── Feedback ────────────────────────────

class FeedbackCreate(BaseModel):
    helpful: Optional[FeedbackHelpful] = None
    outcome: Optional[FeedbackOutcome] = None
    notes: Optional[str] = None


class FeedbackOut(BaseModel):
    id: str
    scan_id: str
    helpful: Optional[FeedbackHelpful]
    outcome: Optional[FeedbackOutcome]
    notes: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ──────────────────────────── Expert Review ────────────────────────────

class ExpertReviewCreate(BaseModel):
    decision: ExpertDecision
    corrected_label: Optional[str] = None
    notes: Optional[str] = None


class ExpertReviewOut(BaseModel):
    id: str
    scan_id: str
    reviewed_by_id: str
    decision: ExpertDecision
    corrected_label: Optional[str]
    notes: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ──────────────────────────── Notification ────────────────────────────

class NotificationOut(BaseModel):
    id: str
    type: str
    title: str
    body: str
    is_read: bool
    related_scan_id: Optional[str]
    related_follow_up_id: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ──────────────────────────── Analytics ────────────────────────────

class DashboardStats(BaseModel):
    total_farms: int
    total_plots: int
    total_scans: int
    active_issues: int
    healthy_scans: int
    uncertain_scans: int
    scans_requiring_followup: int
    pending_follow_ups: int
    unread_notifications: int


class AdminStats(BaseModel):
    registered_farmers: int
    active_farmers_7d: int
    active_farmers_30d: int
    total_farms: int
    total_scans: int
    disease_detections: int
    low_confidence_scans: int
    expert_reviewed_scans: int
    follow_up_completion_rate: float
    scans_by_crop: Dict[str, int]
    scans_by_disease: Dict[str, int]
    scans_by_county: Dict[str, int]
    average_confidence: float
