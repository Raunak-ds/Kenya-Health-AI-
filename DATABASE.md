# Database Architecture & Schema Specification

The platform utilizes **SQLAlchemy 2.0 ORM** with native support for both **SQLite** (for zero-configuration local development on Windows/macOS/Linux) and **PostgreSQL** (for scalable production deployments).

---

## 1. Connection Configuration
Configured via `DATABASE_URL` in `.env`:
- **SQLite (Default):** `sqlite:///./crophealth.db`
- **PostgreSQL:** `postgresql://username:password@localhost:5432/crophealth`

---

## 2. Entity-Relationship Schema

```
+----------------+        +-----------------+        +---------------------+
|     users      | 1    N |      farms      | 1    N |     crop_plots      |
|----------------|<-------|-----------------|<-------|---------------------|
| id (PK)        |        | id (PK)         |        | id (PK)             |
| full_name      |        | owner_id (FK)   |        | farm_id (FK)        |
| phone_number   |        | name            |        | crop_type           |
| email          |        | county          |        | variety             |
| hashed_password|        | sub_county      |        | planting_date       |
| role           |        | approx_location |        | field_size_value    |
| county         |        | size_value      |        | growth_stage        |
| created_at     |        | created_at      |        | status              |
+----------------+        +-----------------+        +---------------------+
        |                                                       |
        | 1                                                     | 1
        |                                                       |
        | N                                                     | N
+-------v-------------------------------------------------------v-------------+
|                                    scans                                    |
|-----------------------------------------------------------------------------|
| id (PK)                    | farmer_id (FK to users.id)                     |
| farm_id (FK to farms.id)   | plot_id (FK to crop_plots.id)                  |
| model_version_id (FK)      | image_path (relative storage path)             |
| timestamp (indexed)        | status (ok, uncertain, invalid_image)          |
| predicted_label            | confidence (float)                             |
| entropy (float)            | threshold (float)                              |
| severity_category          | affected_percent (float)                       |
| recommendation_snapshot    | ground_truth_status (unverified/expert_verified)|
| verified_label             | verified_by_id (FK to users.id)                |
| verification_timestamp     | gradcam_path                                   |
| language                   | top3 (JSON)                                    |
+-----------------------------------------------------------------------------+
       | 1                           | 1                          | 1
       |                             |                            |
       | 1                           | 1                          | N
+------v-----------+        +--------v--------+        +----------v-----------+
|     feedback     |        |  expert_reviews |        |      follow_ups      |
|------------------|        |-----------------|        |----------------------|
| id (PK)          |        | id (PK)         |        | id (PK)              |
| scan_id (FK)     |        | scan_id (FK)    |        | scan_id (FK)         |
| farmer_id (FK)   |        | reviewed_by_id  |        | farmer_id (FK)       |
| helpful          |        | decision        |        | due_date (indexed)   |
| outcome          |        | corrected_label |        | status               |
| notes            |        | notes           |        | outcome              |
+------------------+        +-----------------+        +----------------------+
```

---

## 3. Immutability & Reproducibility
- **`recommendation_snapshot`**: Rather than saving recommendations by dynamic reference alone, a complete JSON snapshot of the generated advice, sources, and safety policy is permanently recorded at scan time. Even if guidelines evolve in future years, historical diagnoses remain exactly reproducible.
- **Auditing Integrity**: Extension officer reviews never overwrite `predicted_label` or `confidence`. The original model inference is preserved forever alongside the verified label.
