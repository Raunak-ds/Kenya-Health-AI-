"""
Export expert-verified Kenyan field dataset for future model retraining.
Queries the database for scans where ground_truth_status == 'expert_verified'.
Copies verified leaf images and generates an annotations.csv.

Usage:
    python scripts/export_verified_dataset.py
    python scripts/export_verified_dataset.py --output-dir datasets/kenya_verified
"""
import sys
import shutil
import csv
import argparse
from pathlib import Path

# Add project root to sys.path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.database import SessionLocal
from backend.models import Scan, GroundTruthStatus, User


def export_verified_dataset(output_dir: Path):
    db = SessionLocal()
    try:
        query = db.query(Scan).filter(
            Scan.ground_truth_status == GroundTruthStatus.expert_verified,
            Scan.verified_label.isnot(None),
            Scan.image_path.isnot(None)
        )
        verified_scans = query.all()

        images_dir = output_dir / "images"
        images_dir.mkdir(parents=True, exist_ok=True)
        csv_path = output_dir / "annotations.csv"

        print(f"Found {len(verified_scans)} expert-verified scan(s) in database.")

        records = []
        exported_count = 0

        for scan in verified_scans:
            src_image = ROOT / scan.image_path
            if not src_image.exists():
                print(f"Warning: image file {src_image} does not exist, skipping.")
                continue

            # Determine crop
            crop = scan.crop_hint
            if not crop and scan.verified_label:
                crop = scan.verified_label.split("_")[0]

            dest_filename = f"{scan.id}_{src_image.name}"
            dest_image = images_dir / dest_filename
            shutil.copy2(src_image, dest_image)

            # Lookup verifier name
            verifier_name = "Extension Officer"
            if scan.verified_by_id:
                verifier = db.query(User).filter(User.id == scan.verified_by_id).first()
                if verifier:
                    verifier_name = verifier.full_name

            records.append({
                "image": dest_filename,
                "crop": crop or "unknown",
                "disease": scan.verified_label,
                "county": scan.county or "unspecified",
                "severity": scan.severity_category or "unknown",
                "verified_by": verifier_name,
                "verification_date": scan.verification_timestamp.strftime("%Y-%m-%d %H:%M:%S") if scan.verification_timestamp else "unknown"
            })
            exported_count += 1

        with open(csv_path, mode="w", newline="", encoding="utf-8") as f:
            fieldnames = ["image", "crop", "disease", "county", "severity", "verified_by", "verification_date"]
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for r in records:
                writer.writerow(r)

        print(f"Successfully exported {exported_count} verified record(s).")
        print(f"Images location: {images_dir}")
        print(f"Annotations CSV: {csv_path}")

    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export expert-verified Kenyan field dataset")
    parser.add_argument("--output-dir", type=str, default=str(ROOT / "datasets" / "kenya_verified"),
                        help="Target output directory")
    args = parser.parse_args()
    export_verified_dataset(Path(args.output_dir))
