# Kenyan Field-Data Collection & Retraining Roadmap

Rather than fabricating synthetic Kenyan field accuracy or hastily retraining on uncontrolled internet images, the platform establishes a structured, continuous pipeline for collecting **real, verified Kenyan smallholder field data**.

---

## 1. The Data Collection Pipeline

```
Farmer Submits Leaf Photo (Smartphone in Field)
                    ↓
Pre-inference Quality & Vegetation Validation
                    ↓
EfficientNet-B0 Screening & Grad-CAM Heatmap
                    ↓
Saved to Database (`ground_truth_status = 'unverified'`)
                    ↓
Sub-County Extension Officer Review Queue
                    ↓
Expert Validation (Confirm or Correct Disease Label + Agronomic Notes)
                    ↓
Status Updated to `expert_verified` with Timestamp & Officer ID
                    ↓
Approved for Retraining Dataset
```

---

## 2. Field Metadata Captured
For every scan, the platform captures:
- Leaf image (JPEG/PNG/WebP stored in isolated secure volume).
- Crop type (Maize, Potato, Tomato).
- Suspected condition.
- County & Sub-county.
- Growth stage at scan time (Seedling, Vegetative, Flowering, Tuber Bulking, Maturation).
- AI predicted label, confidence, entropy, and HSV severity estimate.
- Farmer feedback on treatment outcome after 3-5 days.
- Extension officer verified label, decision, and field notes.

---

## 3. Dataset Export Tool

The verified dataset can be exported at any time using:

```cmd
python scripts/export_verified_dataset.py --output-dir datasets/kenya_verified
```

### Export Format
```
datasets/kenya_verified/
  images/
    <scan_id>_<filename>.jpg
  annotations.csv
```

### `annotations.csv` Columns:
1. `image`: Relative filename in `images/` directory.
2. `crop`: Plant host species (maize, potato, tomato).
3. `disease`: Verified phytopathological label.
4. `county`: Kenyan county of origin.
5. `severity`: Observed severity category (Mild, Moderate, Severe).
6. `verified_by`: Name and title of certifying extension officer.
7. `verification_date`: ISO timestamp of validation.

---

## 4. Retraining Criteria
Retraining on Kenyan field imagery should commence once:
1. A minimum of 500 expert-verified images per class have been accumulated across diverse agro-ecological zones (Highlands, Rift Valley, Western, Eastern).
2. Images pass dual verification by senior research agronomists.
3. Out-of-distribution benchmark sets (e.g. PlantDoc) are evaluated to ensure no catastrophic forgetting.
