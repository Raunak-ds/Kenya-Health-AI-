"""
OPTIONAL Development Seed Script.
DO NOT RUN IN PRODUCTION.
All created records are clearly marked: DEMO DATA.

Usage:
    python scripts/seed_demo.py
"""
import sys
from pathlib import Path
from datetime import datetime, timedelta
import io
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.database import SessionLocal, create_tables
from backend.models import (
    User, UserRole, Farm, CropPlot, PlotStatus, Scan,
    FollowUp, FollowUpStatus, Feedback, FeedbackHelpful,
    FeedbackOutcome, ExpertReview, ExpertDecision, GroundTruthStatus
)
from backend.services.auth_service import hash_password
from backend.services.recommendation_service import get_structured_recommendation


def seed_demo_data():
    create_tables()
    db = SessionLocal()
    try:
        print("Seeding development demo data... (ALL RECORDS LABELED: DEMO DATA)")

        # 1. Admin User
        admin = db.query(User).filter(User.phone_number == "+254700000001").first()
        if not admin:
            admin = User(
                full_name="DEMO DATA - System Administrator",
                phone_number="+254700000001",
                email="admin.demo@crophealth.kenya.example",
                hashed_password=hash_password("AdminPass123!"),
                role=UserRole.admin,
                preferred_language="en",
                county="Nairobi",
                sub_county="Westlands",
            )
            db.add(admin)

        # 2. Extension Officer
        officer = db.query(User).filter(User.phone_number == "+254700000002").first()
        if not officer:
            officer = User(
                full_name="DEMO DATA - Bwana Joseph Omondi (Extension Officer)",
                phone_number="+254700000002",
                email="officer.demo@crophealth.kenya.example",
                hashed_password=hash_password("OfficerPass123!"),
                role=UserRole.extension_officer,
                preferred_language="en",
                county="Nakuru",
                sub_county="Njoro",
            )
            db.add(officer)

        # 3. Farmer User
        farmer = db.query(User).filter(User.phone_number == "+254700000003").first()
        if not farmer:
            farmer = User(
                full_name="DEMO DATA - Mama Mary Wambui",
                phone_number="+254700000003",
                email="farmer.demo@crophealth.kenya.example",
                hashed_password=hash_password("FarmerPass123!"),
                role=UserRole.farmer,
                preferred_language="sw",
                county="Nakuru",
                sub_county="Njoro",
            )
            db.add(farmer)

        db.commit()
        db.refresh(admin)
        db.refresh(officer)
        db.refresh(farmer)

        # 4. Farms
        farm1 = db.query(Farm).filter(Farm.name == "DEMO DATA - Shamba La Wambui (Njoro)").first()
        if not farm1:
            farm1 = Farm(
                owner_id=farmer.id,
                name="DEMO DATA - Shamba La Wambui (Njoro)",
                county="Nakuru",
                sub_county="Njoro",
                approximate_location="Near Njoro Town, Mau Escarpment Slope",
                size_value=3.5,
                size_unit="acres",
                notes="DEMO DATA - Mixed smallholder farm producing maize and potato.",
            )
            db.add(farm1)

        farm2 = db.query(Farm).filter(Farm.name == "DEMO DATA - Kinangop Highland Farm").first()
        if not farm2:
            farm2 = Farm(
                owner_id=farmer.id,
                name="DEMO DATA - Kinangop Highland Farm",
                county="Nyandarua",
                sub_county="Kinangop",
                approximate_location="South Kinangop Basin",
                size_value=2.0,
                size_unit="acres",
                notes="DEMO DATA - Cool highland plot dedicated to Irish potato and greenhouse tomatoes.",
            )
            db.add(farm2)

        db.commit()
        db.refresh(farm1)
        db.refresh(farm2)

        # 5. Crop Plots
        plot_maize = db.query(CropPlot).filter(CropPlot.variety == "DEMO DATA - H6213 Hybrid").first()
        if not plot_maize:
            plot_maize = CropPlot(
                farm_id=farm1.id,
                crop_type="maize",
                variety="DEMO DATA - H6213 Hybrid",
                planting_date=datetime.utcnow() - timedelta(days=60),
                field_size_value=2.0,
                field_size_unit="acres",
                growth_stage="Silking (R1)",
                status=PlotStatus.active,
                notes="DEMO DATA - Main season maize crop.",
            )
            db.add(plot_maize)

        plot_potato = db.query(CropPlot).filter(CropPlot.variety == "DEMO DATA - Shangi Certified").first()
        if not plot_potato:
            plot_potato = CropPlot(
                farm_id=farm1.id,
                crop_type="potato",
                variety="DEMO DATA - Shangi Certified",
                planting_date=datetime.utcnow() - timedelta(days=45),
                field_size_value=1.5,
                field_size_unit="acres",
                growth_stage="Tuber Bulking",
                status=PlotStatus.active,
                notes="DEMO DATA - Certified seed from KALRO Tigoni.",
            )
            db.add(plot_potato)

        db.commit()
        db.refresh(plot_maize)
        db.refresh(plot_potato)

        # 6. Create synthetic demo scan images in uploads/
        upload_dir = ROOT / "uploads"
        upload_dir.mkdir(parents=True, exist_ok=True)

        demo_img_name = "demo_leaf_sample.jpg"
        demo_img_path = upload_dir / demo_img_name
        if not demo_img_path.exists():
            # Create a simple green image as placeholder
            img = Image.new("RGB", (224, 224), color=(34, 139, 34))
            img.save(demo_img_path, format="JPEG")

        # 7. Demo Scans
        scan1 = db.query(Scan).filter(Scan.crop_hint == "demo_seeded_scan1").first()
        if not scan1:
            recs = get_structured_recommendation("potato_late_blight", severity={"category": "Moderate", "affected_percent": 18.5})
            scan1 = Scan(
                farmer_id=farmer.id,
                farm_id=farm1.id,
                plot_id=plot_potato.id,
                image_path=f"uploads/{demo_img_name}",
                timestamp=datetime.utcnow() - timedelta(days=3),
                status="ok",
                predicted_label="potato_late_blight",
                confidence=0.985,
                entropy=0.12,
                threshold=0.70,
                is_accepted=True,
                severity_category="Moderate",
                affected_percent=18.5,
                recommendation_snapshot=recs,
                crop_hint="demo_seeded_scan1",
                county="Nakuru",
                growth_stage_at_scan="Tuber Bulking",
                ground_truth_status=GroundTruthStatus.expert_verified,
                verified_label="potato_late_blight",
                verified_by_id=officer.id,
                verification_timestamp=datetime.utcnow() - timedelta(days=2),
                language="sw",
            )
            db.add(scan1)
            db.flush()

            # Follow up for scan 1
            fu1 = FollowUp(
                scan_id=scan1.id,
                farmer_id=farmer.id,
                due_date=datetime.utcnow() + timedelta(days=1),
                status=FollowUpStatus.pending,
                notes="DEMO DATA - Check whether late blight lesions stopped expanding after rogueing infected lower leaves.",
            )
            db.add(fu1)

            # Feedback for scan 1
            fb1 = Feedback(
                scan_id=scan1.id,
                farmer_id=farmer.id,
                helpful=FeedbackHelpful.yes,
                outcome=FeedbackOutcome.improved,
                notes="DEMO DATA - Rogued affected leaves and followed extension advice; condition stabilized.",
            )
            db.add(fb1)

            # Expert review for scan 1
            rev1 = ExpertReview(
                scan_id=scan1.id,
                reviewed_by_id=officer.id,
                decision=ExpertDecision.confirmed,
                notes="DEMO DATA - Confirmed Phytophthora infestans symptoms. Recommended earthing up potatoes to protect tubers.",
            )
            db.add(rev1)

        scan2 = db.query(Scan).filter(Scan.crop_hint == "demo_seeded_scan2").first()
        if not scan2:
            recs2 = get_structured_recommendation("maize_healthy")
            scan2 = Scan(
                farmer_id=farmer.id,
                farm_id=farm1.id,
                plot_id=plot_maize.id,
                image_path=f"uploads/{demo_img_name}",
                timestamp=datetime.utcnow() - timedelta(days=1),
                status="ok",
                predicted_label="maize_healthy",
                confidence=0.994,
                entropy=0.08,
                threshold=0.70,
                is_accepted=True,
                severity_category="Healthy",
                affected_percent=0.0,
                recommendation_snapshot=recs2,
                crop_hint="demo_seeded_scan2",
                county="Nakuru",
                growth_stage_at_scan="Silking (R1)",
                ground_truth_status=GroundTruthStatus.unverified,
                language="en",
            )
            db.add(scan2)

        db.commit()
        print("DEMO DATA SEEDED SUCCESSFULLY!")
        print("Demo Credentials:")
        print("  Farmer:            +254700000003  /  FarmerPass123!")
        print("  Extension Officer: +254700000002  /  OfficerPass123!")
        print("  Administrator:     +254700000001  /  AdminPass123!")

    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
