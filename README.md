# Crop Health AI — Kenya Crop Health Management Platform

A polished, Kenya-focused Crop Health Management Platform built on top of a calibrated EfficientNet-B0 computer vision model. Designed for smallholder and commercial farmers, agricultural extension officers, and county agricultural directors across Kenya.

Supports **Maize**, **Irish Potato**, and **Tomato** foliar disease screening with instant Grad-CAM explanations, HSV severity estimation, KALRO-aligned management recommendations, farmer follow-up tracking, extension officer review workflows, and disease surveillance mapping.

---

## 🎯 Target Supported Classes (11 Classes)

| Crop | Disease / Condition | Pathogen / Cause |
| :--- | :--- | :--- |
| **Maize** | Gray Leaf Spot | *Cercospora zeae-maydis* |
| **Maize** | Common Rust | *Puccinia sorghi* |
| **Maize** | Northern Leaf Blight | *Exserohilum turcicum* |
| **Maize** | Healthy | N/A |
| **Potato** | Early Blight | *Alternaria solani* |
| **Potato** | Late Blight | *Phytophthora infestans* |
| **Potato** | Healthy | N/A |
| **Tomato** | Bacterial Spot | *Xanthomonas spp.* |
| **Tomato** | Early Blight | *Alternaria solani* |
| **Tomato** | Late Blight | *Phytophthora infestans* |
| **Tomato** | Healthy | N/A |

*Note: Uncertain/low-confidence detection is an explicit inference outcome (confidence < 0.70 or entropy > 0.78); it is never forced into a wrong category.*

---

## 🚀 Quick Setup (Windows CMD / PowerShell)

### 1. Clone & Navigate
```cmd
cd crop-health-ai
```

### 2. Set Up Python Virtual Environment
Python 3.11 or 3.12 recommended:
```cmd
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Environment Configuration
Create or inspect `.env` (defaults to zero-config local SQLite):
```cmd
copy .env.example .env
```

### 4. Optional: Seed Development Demo Data
To test with sample farmers, farms, plots, and extension officer reviews (clearly labeled `DEMO DATA`):
```cmd
python scripts/seed_demo.py
```

*Demo Login Credentials:*
- **Farmer:** `+254700000003` / `FarmerPass123!`
- **Extension Officer:** `+254700000002` / `OfficerPass123!`
- **Administrator:** `+254700000001` / `AdminPass123!`

### 5. Launch Application
```cmd
python run.py
```
Open **`http://localhost:8000`** in your browser.

---

## 🧪 Automated Testing
Run the automated test suite (includes authentication, model loading, scan persistence, image quality checks, follow-ups, and PDF generation):
```cmd
.venv\Scripts\pytest -v
```

---

## 🏗️ Architecture & Platform Features

1. **Authentication & Role-Based Authorization**
   - Roles: `farmer`, `extension_officer`, `admin`.
   - Secure Argon2/bcrypt password hashing + JWT tokens.
   - Profile management and language preferences.
   - See [AUTHENTICATION.md](AUTHENTICATION.md).

2. **Farm & Plot Hierarchy**
   - Hierarchical data model: `Farmer → Farm → Crop Plot → Scan History → Disease Follow-up`.
   - Organizes fields by county, sub-county, crop variety, and planting stage.

3. **Inference & Explainability**
   - **Trained Model:** EfficientNet-B0 (`artifacts/best_model.pt`).
   - **Quality Check:** Laplacian variance blur filter, vegetation fraction proxy, and luminance validator.
   - **Grad-CAM:** Dynamic heatmap overlay highlighting lesions on the leaf.
   - **Severity Banding:** HSV-based leaf lesion area percentage heuristic (Mild, Moderate, Severe).

4. **Structured Kenya Recommendation Engine**
   - Grounded in authoritative research from **KALRO**, **FAO**, **CIMMYT**, and **CIP**.
   - Immediate Management (What To Do Now), Prevention, Monitoring, and Escalation Criteria.
   - Zero chemical dosages provided (strict PCPB compliance).
   - Full bilingual support in **English** and **Kiswahili** (`locales/`).

5. **Extension Officer Ground-Truth Verification**
   - Extension officers review pending, low-confidence, and severe scans.
   - Can confirm, correct labels, request new photos, or add agronomic notes.
   - Original AI prediction is permanently audited; verified labels feed into future datasets.
   - See [EXPERT_VERIFICATION.md](EXPERT_VERIFICATION.md).

6. **Field Dataset Export for Retraining**
   - Export expert-verified scans directly to `datasets/kenya_verified/` with `annotations.csv`:
   ```cmd
   python scripts/export_verified_dataset.py
   ```
   - See [KENYA_DATA_COLLECTION.md](KENYA_DATA_COLLECTION.md).

7. **Surveillance & Kenya Disease Map**
   - Aggregated county-level plant pathology counts without exposing private farmer GPS coordinates.
   - Interactive Leaflet map showing disease density across Kenyan agricultural basins.

8. **Diagnostic PDF Report**
   - Downloadable printable diagnosis advisory with full scan metadata, Grad-CAM details, and KALRO recommendations.

---

## ⚠️ Important Limitations & Disclaimers

1. **PlantVillage Benchmark Context:** The ~99.05% test accuracy metric is computed on the held-out test split of the PlantVillage-derived dataset (controlled background). **It must not be presented as "99% accurate on Kenyan smallholder fields."** Field conditions involve background soil, weeds, dual infections, and varying camera sensors.
2. **Decision Support Only:** This platform is an automated decision-support tool, not a certified agronomic laboratory diagnostic assay.
3. **No Chemical Dosages:** Agrochemical rates depend on soil moisture, formulation concentration, and local resistance patterns. Farmers must consult county extension officers and PCPB product labels.
4. **Privacy:** Farmer locations are kept private; only county-level aggregates are presented on public/surveillance dashboards.

See [LIMITATIONS.md](LIMITATIONS.md) and [PRIVACY.md](PRIVACY.md).
