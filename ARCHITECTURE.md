# System Architecture: Kenya Crop Health Management Platform

The Kenya Crop Health Management Platform follows a modular, decoupled architecture providing high availability, privacy preservation, role-based authorization, and audited model inferences.

```
+-----------------------------------------------------------------------------------+
|                              Client Layer (PWA / Web)                             |
|  - Mobile-First Single-Page Application (HTML5, Vanilla ES6, Tailwind UI System)  |
|  - Offline PWA Shell (Service Worker + Manifest)                                  |
|  - Bilingual Localization (English / Kiswahili)                                   |
|  - Leaflet Kenya Disease Surveillance Map + Chart.js Analytics                    |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / REST APIs
+------------------------------------------v----------------------------------------+
|                             API Gateway & Backend                                 |
|  - FastAPI (Python 3.11+)                                                         |
|  - Modular Routers:                                                               |
|    * /api/v1/auth          : Registration, JWT Login, Profile                     |
|    * /api/v1/farms         : Farms & Crop Plots Hierarchy                         |
|    * /api/v1/scans         : Image Inference, Persistence, PDF Reports, Grad-CAM   |
|    * /api/v1/expert        : Extension Officer Verification Queue                 |
|    * /api/v1/follow-ups    : Post-Diagnosis Follow-up Tracker                     |
|    * /api/v1/analytics     : Real Dashboard Stats & Disease Surveillance          |
|    * /api/v1/admin         : Platform Administration & Model Registry             |
|    * /api/v1/notifications : In-App Alerts & Advisory Reminders                   |
|    * /api/analyze          : Legacy Endpoint (100% Backwards Compatible)          |
+--------------------+---------------------+--------------------+-------------------+
                     |                     |                    |
+--------------------v----+   +------------v--------+   +-------v-------------------+
|   Relational Database   |   |   Object Storage    |   |     ML Inference Core     |
| - SQLite (Zero-config)  |   | - Local /uploads/   |   | - EfficientNet-B0         |
| - PostgreSQL (Prod)     |   | - Upload isolation  |   | - Quality Validation      |
| - SQLAlchemy 2.0 ORM    |   | - Secure access via |   | - Uncertainty Gate        |
| - Alembic migrations    |   |   authorized routes |   | - Grad-CAM Visualizer     |
+-------------------------+   +---------------------+   | - HSV Severity Estimator  |
                                                        +---------------------------+
                                                                |
                                                        +-------v-------------------+
                                                        | Structured Knowledge Base |
                                                        | - KALRO / FAO Guidelines  |
                                                        | - Rules Engine            |
                                                        | - Chemical Safety Policy  |
                                                        | - English / Kiswahili     |
                                                        +---------------------------+
```

---

## Core Subsystems

### 1. Data Models (`backend/models/`)
- **`User`**: Farmers, Extension Officers, and Administrators with hashed credentials.
- **`Farm`**: Geographic property owned by farmer (county, sub-county, non-GPS approximate location).
- **`CropPlot`**: Individual crop parcel (crop type, variety, planting date, growth stage).
- **`Scan`**: Complete diagnostic record (image reference, predicted label, confidence, entropy, severity band, affected area, recommendation snapshot, ground-truth status).
- **`ModelVersion`**: Provenance registry recording model training date, benchmark accuracy, macro precision, recall, and specificity.
- **`FollowUp`**: Action timeline tracking plant recovery (Day 0, Day 2, Day 5).
- **`Feedback`**: Farmer helpfulness evaluation and outcome reporting.
- **`ExpertReview`**: Audited verification record by extension officers (Confirm, Correct, Request New Image).
- **`Notification`**: In-app operational alerts.

### 2. ML Inference Engine (`ml/`)
- **Quality Filter (`ml/preprocessing/quality.py`)**: Assesses image resolution (>=128px), blurriness (Laplacian variance >=45), dark threshold, and vegetation green fraction.
- **Backbone (`artifacts/best_model.pt`)**: Calibrated PyTorch EfficientNet-B0 with temperature scaling.
- **Uncertainty Gate (`ml/inference/predictor.py`)**: Requires confidence >= 0.70 and entropy <= 0.78.
- **Explainability (`ml/inference/gradcam.py`)**: Computes Grad-CAM gradients from the final convolutional layer (`features[-1]`).
- **Severity Estimator (`ml/inference/severity.py`)**: Non-green affected foliage percentage proxy (Mild <10%, Moderate 10-25%, Severe >25%).

### 3. Recommendation Engine (`backend/services/recommendation_service.py`)
- Deterministic, rule-based agronomic engine with zero LLM hallucination.
- Incorporates crop, disease, severity, growth stage, repeat occurrence, and weather risk.
- Strictly adheres to Kenya Pest Control Products Board (PCPB) guidelines (no speculative chemical dosages).
