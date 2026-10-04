# API Documentation: Kenya Crop Health Management Platform

The API is served with interactive Swagger UI docs available at `/docs` and ReDoc at `/redoc`.

All protected endpoints require an HTTP Bearer JWT token header:
```
Authorization: Bearer <access_token>
```

---

## 1. Authentication (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Register a new farmer or extension officer.
- **Request Body (JSON):**
  ```json
  {
    "full_name": "Wanjiku Mwangi",
    "phone_number": "+254712345678",
    "password": "SecurePassword123!",
    "email": "farmer@example.com",
    "role": "farmer",
    "county": "Nakuru",
    "sub_county": "Njoro",
    "preferred_language": "sw"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user_id": "uuid-...",
    "role": "farmer",
    "full_name": "Wanjiku Mwangi"
  }
  ```

### `POST /api/v1/auth/login`
Authenticate using registered phone number and password.
- **Request Body (JSON):**
  ```json
  {
    "phone_number": "+254712345678",
    "password": "SecurePassword123!"
  }
  ```
- **Response (200 OK):** `TokenResponse`

### `GET /api/v1/auth/me`
Retrieve currently authenticated user profile.

### `PUT /api/v1/auth/me`
Update profile fields (full name, email, preferred language, county, sub-county).

### `POST /api/v1/auth/me/change-password`
Change password securely with verification of current password.

---

## 2. Farm & Plot Management (`/api/v1/farms`)

### `POST /api/v1/farms`
Create a new farm under the authenticated farmer.
- **Request Body:**
  ```json
  {
    "name": "Green Ridge Farm",
    "county": "Nyandarua",
    "sub_county": "Kinangop",
    "approximate_location": "South Kinangop Valley",
    "size_value": 3.0,
    "size_unit": "acres",
    "notes": "Main potato plot"
  }
  ```

### `GET /api/v1/farms`
List all farms belonging to the current user with plot and scan counts.

### `POST /api/v1/farms/{farm_id}/plots`
Add a crop plot to a farm.
- **Request Body:**
  ```json
  {
    "crop_type": "potato",
    "variety": "Shangi",
    "planting_date": "2026-08-01T00:00:00",
    "field_size_value": 1.5,
    "growth_stage": "Tuber Bulking"
  }
  ```

### `GET /api/v1/farms/{farm_id}/plots`
List plots in a farm.

---

## 3. Disease Scans & Inferences (`/api/v1/scans`)

### `POST /api/v1/scans`
Upload and diagnose a crop leaf.
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `file`: Image file (JPEG, PNG, WebP up to 10MB)
  - `farm_id` (optional): Target farm ID
  - `plot_id` (optional): Target crop plot ID
  - `crop` (optional): "maize" | "potato" | "tomato"
  - `growth_stage` (optional): "Seedling" | "Vegetative" | "Flowering" | "Tuber Bulking"
  - `lang` (optional): "en" | "sw"
- **Response (201 Created):** `ScanOut` object containing prediction, confidence, severity, Grad-CAM path, and structured recommendation snapshot.

### `GET /api/v1/scans`
List scan history for the current farmer. Supports `?farm_id=...&plot_id=...&limit=50`.

### `GET /api/v1/scans/{scan_id}`
Retrieve complete diagnostic details.

### `GET /api/v1/scans/{scan_id}/gradcam`
Return JPEG image of the Grad-CAM saliency overlay.

### `GET /api/v1/scans/{scan_id}/report.pdf`
Download a formatted agricultural advisory PDF report.

### `GET /api/v1/scans/{scan_id}/image`
Authorized access to the original uploaded leaf image (farmer, extension officer, admin only).

### `POST /api/v1/scans/{scan_id}/feedback`
Submit farmer feedback:
```json
{
  "helpful": "yes",
  "outcome": "improved",
  "notes": "Pruned lower leaves; disease stopped spreading."
}
```

---

## 4. Extension Officer & Verification (`/api/v1/expert`)

*(Requires `extension_officer` or `admin` role)*

### `GET /api/v1/expert/pending`
Queue of scans pending expert verification (sorted by lowest confidence and severity).

### `GET /api/v1/expert/low-confidence`
Scans where AI confidence was below 0.80.

### `GET /api/v1/expert/severe`
Severe cases requiring urgent intervention.

### `POST /api/v1/expert/scans/{scan_id}/review`
Submit expert review:
```json
{
  "decision": "confirmed",
  "corrected_label": null,
  "notes": "Typical early blight concentric rings observed on lower canopy."
}
```

---

## 5. Analytics & Surveillance (`/api/v1/analytics`)

### `GET /api/v1/analytics/dashboard`
Farmer-specific real metrics (number of farms, plots, total scans, active issues, healthy scans, uncertain scans, follow-ups due).

### `GET /api/v1/analytics/public-stats`
Public counts derived strictly from the database:
```json
{
  "registered_farmers": 14,
  "total_scans": 42
}
```

### `GET /api/v1/analytics/surveillance`
Aggregated disease counts by county, crop, disease, and epidemiological week (no exact GPS coordinates exposed).

### `GET /api/v1/analytics/admin`
Platform administration statistics (requires `admin` role).

---

## 6. Legacy Backwards-Compatible Endpoint

### `POST /api/analyze`
Original project endpoint preserved for compatibility:
- Accepts `file`, `crop`, and `lang`.
- Returns prediction result with Grad-CAM and recommendations.
