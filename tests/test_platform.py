"""
Comprehensive integration and unit test suite for Kenya Crop Health Management Platform.
Tests: Auth, Authorization, Farms, Plots, Prediction, Quality, Uncertainty,
Recommendations, Follow-ups, Feedback, Expert Review, Analytics, Reports, Security.
"""
import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.main import app
from backend.database import Base, get_db
from backend.services.auth_service import hash_password, verify_password
from backend.services.recommendation_service import get_structured_recommendation
from backend.models import User, UserRole, Farm, CropPlot, Scan, FollowUp, Feedback, ExpertReview


from sqlalchemy.pool import StaticPool

# Setup in-memory SQLite DB for isolated test runs
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


# 1. Password Hashing & Security
def test_password_hashing():
    pwd = "SecureFarmerPass123!"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


# 2. Authentication: Register, Login, Me
def test_auth_workflow(client):
    # Register Farmer
    reg_data = {
        "full_name": "Test Farmer Kipchoge",
        "phone_number": "+254711999888",
        "password": "FarmerPassword123!",
        "county": "Uasin Gishu",
        "role": "farmer",
        "preferred_language": "en"
    }
    r = client.post("/api/v1/auth/register", json=reg_data)
    assert r.status_code == 201
    tok = r.json()
    assert "access_token" in tok
    token = tok["access_token"]

    # Login
    r_log = client.post("/api/v1/auth/login", json={
        "phone_number": "+254711999888",
        "password": "FarmerPassword123!"
    })
    assert r_log.status_code == 200
    assert "access_token" in r_log.json()

    # Get Current User
    headers = {"Authorization": f"Bearer {token}"}
    r_me = client.get("/api/v1/auth/me", headers=headers)
    assert r_me.status_code == 200
    me = r_me.json()
    assert me["full_name"] == "Test Farmer Kipchoge"
    assert me["county"] == "Uasin Gishu"


# 3. Farm & Crop Plot Management
def test_farm_and_plot_management(client):
    # Login as farmer
    r_log = client.post("/api/v1/auth/login", json={
        "phone_number": "+254711999888",
        "password": "FarmerPassword123!"
    })
    token = r_log.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Farm
    r_farm = client.post("/api/v1/farms", json={
        "name": "Eldoret Highland Shamba",
        "county": "Uasin Gishu",
        "sub_county": "Moiben",
        "size_value": 5.0,
        "size_unit": "acres"
    }, headers=headers)
    assert r_farm.status_code == 201
    farm = r_farm.json()
    farm_id = farm["id"]
    assert farm["name"] == "Eldoret Highland Shamba"

    # Create Crop Plot
    r_plot = client.post(f"/api/v1/farms/{farm_id}/plots", json={
        "crop_type": "maize",
        "variety": "H6213 Hybrid",
        "field_size_value": 3.0,
        "growth_stage": "Silking (R1)"
    }, headers=headers)
    assert r_plot.status_code == 201
    plot = r_plot.json()
    assert plot["crop_type"] == "maize"
    assert plot["variety"] == "H6213 Hybrid"

    # List Farms
    r_list = client.get("/api/v1/farms", headers=headers)
    assert r_list.status_code == 200
    assert len(r_list.json()) >= 1


# 4. Scan Workflow, AI Prediction, and Persistence
def test_scan_workflow(client):
    r_log = client.post("/api/v1/auth/login", json={
        "phone_number": "+254711999888",
        "password": "FarmerPassword123!"
    })
    token = r_log.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    from pathlib import Path
    sample_imgs = list(Path("data/plantvillage_selected/test/tomato_early_blight").glob("*.jpg"))
    if sample_imgs:
        buf = io.BytesIO(sample_imgs[0].read_bytes())
    else:
        import numpy as np
        arr = np.random.randint(30, 80, (224, 224, 3), dtype=np.uint8)
        arr[:, :, 1] = np.random.randint(100, 200, (224, 224), dtype=np.uint8)
        img = Image.fromarray(arr)
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        buf.seek(0)

    # Submit Scan
    r_scan = client.post(
        "/api/v1/scans",
        files={"file": ("leaf.jpg", buf, "image/jpeg")},
        data={"crop": "tomato", "lang": "en"},
        headers=headers,
    )
    assert r_scan.status_code == 201
    scan = r_scan.json()
    assert "id" in scan
    assert scan["status"] in ("ok", "uncertain")
    assert scan["farmer_id"] is not None

    # Get Scan by ID
    r_get = client.get(f"/api/v1/scans/{scan['id']}", headers=headers)
    assert r_get.status_code == 200
    assert r_get.json()["id"] == scan["id"]


# 5. Invalid Image Handling
def test_invalid_image_handling(client):
    r_log = client.post("/api/v1/auth/login", json={
        "phone_number": "+254711999888",
        "password": "FarmerPassword123!"
    })
    token = r_log.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Too small / blank white image (fails vegetation threshold)
    img = Image.new("RGB", (64, 64), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    r_scan = client.post(
        "/api/v1/scans",
        files={"file": ("tiny_blank.jpg", buf, "image/jpeg")},
        data={"crop": "potato"},
        headers=headers,
    )
    assert r_scan.status_code == 201
    scan = r_scan.json()
    assert scan["status"] == "invalid_image"


# 6. Structured Recommendation Engine Rules
def test_recommendation_engine_rules():
    # Test Severe Late Blight escalation
    r_severe = get_structured_recommendation(
        "potato_late_blight",
        lang="en",
        severity={"category": "Severe", "affected_percent": 32.0}
    )
    assert r_severe["is_urgent"] is True
    assert r_severe["follow_up_days"] == 2
    assert any("URGENT" in m for m in r_severe["management"])
    assert "https://cipotato.org/crop-protection/late-blight/" in r_severe["sources"]

    # Test Swahili translation
    r_sw = get_structured_recommendation(
        "potato_late_blight",
        lang="sw",
        severity={"category": "Severe", "affected_percent": 32.0}
    )
    assert "PCPB" in r_sw["safety"]
    assert "HARAKA" in r_sw["management"][0] or "HATUA" in r_sw["management"][0]


# 7. Farmer Feedback Workflow
def test_feedback_workflow(client):
    r_log = client.post("/api/v1/auth/login", json={
        "phone_number": "+254711999888",
        "password": "FarmerPassword123!"
    })
    token = r_log.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get a scan id from scans list
    r_scans = client.get("/api/v1/scans", headers=headers)
    scan_id = r_scans.json()[0]["id"]

    # Submit Feedback
    r_fb = client.post(f"/api/v1/scans/{scan_id}/feedback", json={
        "helpful": "yes",
        "outcome": "improved",
        "notes": "Followed KALRO pruning guidelines, healthy new foliage sprouted."
    }, headers=headers)
    assert r_fb.status_code == 201
    fb = r_fb.json()
    assert fb["helpful"] == "yes"
    assert fb["outcome"] == "improved"


# 8. Follow-up Tracking Workflow
def test_follow_up_workflow(client):
    r_log = client.post("/api/v1/auth/login", json={
        "phone_number": "+254711999888",
        "password": "FarmerPassword123!"
    })
    token = r_log.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Check follow-ups
    r_fus = client.get("/api/v1/follow-ups", headers=headers)
    assert r_fus.status_code == 200
    fus = r_fus.json()
    if fus:
        fu_id = fus[0]["id"]
        scan_id = fus[0]["scan_id"]
        r_update = client.put(f"/api/v1/scans/{scan_id}/follow-ups/{fu_id}", json={
            "status": "completed",
            "outcome": "improved",
            "notes": "Lesion expansion stopped."
        }, headers=headers)
        assert r_update.status_code == 200
        assert r_update.json()["status"] == "completed"


# 9. Expert Review & Ground Truth Workflow
def test_expert_review_workflow(client):
    # Register Extension Officer
    r_officer = client.post("/api/v1/auth/register", json={
        "full_name": "Afisa Agronomist Jane",
        "phone_number": "+254722111000",
        "password": "OfficerPass123!",
        "county": "Nakuru",
        "role": "extension_officer"
    })
    assert r_officer.status_code == 201
    officer_token = r_officer.json()["access_token"]
    officer_headers = {"Authorization": f"Bearer {officer_token}"}

    # View pending reviews
    r_pending = client.get("/api/v1/expert/pending", headers=officer_headers)
    assert r_pending.status_code == 200
    pending_list = r_pending.json()
    if pending_list:
        scan_id = pending_list[0]["id"]
        r_rev = client.post(f"/api/v1/expert/scans/{scan_id}/review", json={
            "decision": "confirmed",
            "notes": "Symptoms consistent with field observations in Rift Valley."
        }, headers=officer_headers)
        assert r_rev.status_code == 201
        assert r_rev.json()["decision"] == "confirmed"


# 10. PDF Report Download
def test_pdf_report_generation(client):
    r_log = client.post("/api/v1/auth/login", json={
        "phone_number": "+254711999888",
        "password": "FarmerPassword123!"
    })
    token = r_log.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    r_scans = client.get("/api/v1/scans", headers=headers)
    scan_id = r_scans.json()[0]["id"]

    r_pdf = client.get(f"/api/v1/scans/{scan_id}/report.pdf", headers=headers)
    assert r_pdf.status_code == 200
    assert r_pdf.headers["content-type"] == "application/pdf"
    assert r_pdf.content.startswith(b"%PDF")


# 11. Public Stats (Strictly database-derived)
def test_public_stats(client):
    r = client.get("/api/v1/analytics/public-stats")
    assert r.status_code == 200
    data = r.json()
    assert "registered_farmers" in data
    assert "total_scans" in data
    assert isinstance(data["registered_farmers"], int)
    assert isinstance(data["total_scans"], int)
