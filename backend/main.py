"""
Kenya Crop Health Management Platform — FastAPI application factory.

Backward-compatible: the legacy /api/analyze endpoint is preserved.
New API routes are under /api/v1/.
"""
from pathlib import Path
import io
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError

from backend.config import settings
from backend.database import create_tables
from backend.recommendations import get_recommendations

ROOT = Path(__file__).resolve().parents[1]


# ──────────────────────────── Lifespan ────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables on startup
    create_tables()
    # Warm-up model (fail silently if artifact missing)
    try:
        from ml.inference.predictor import Predictor
        _ = Predictor(settings.model_path)
    except Exception:
        pass
    yield


# ──────────────────────────── App Factory ────────────────────────────

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────── Register Routers ────────────────────────────

from backend.routers.auth import router as auth_router
from backend.routers.farms import router as farms_router
from backend.routers.scans import router as scans_router
from backend.routers.expert import router as expert_router
from backend.routers.analytics import router as analytics_router
from backend.routers.admin import router as admin_router
from backend.routers.notifications import router as notifications_router
from backend.routers.follow_ups import router as follow_ups_router

PREFIX = "/api/v1"
app.include_router(auth_router, prefix=PREFIX)
app.include_router(farms_router, prefix=PREFIX)
app.include_router(scans_router, prefix=PREFIX)
app.include_router(expert_router, prefix=PREFIX)
app.include_router(analytics_router, prefix=PREFIX)
app.include_router(admin_router, prefix=PREFIX)
app.include_router(notifications_router, prefix=PREFIX)
app.include_router(follow_ups_router, prefix=PREFIX)


# ──────────────────────────── Legacy endpoints (backward compat) ────────────────────────────

_legacy_predictor = None

def _get_legacy_predictor():
    global _legacy_predictor
    if _legacy_predictor is None:
        from ml.inference.predictor import Predictor
        _legacy_predictor = Predictor(settings.model_path)
    return _legacy_predictor


@app.get("/health")
def health():
    p = _get_legacy_predictor()
    return {"status": "ok", "model_ready": p.ready, "version": settings.app_version}


@app.post("/api/analyze")
async def analyze_legacy(
    file: UploadFile = File(...),
    crop: str | None = Form(None),
    lang: str = Form("en"),
):
    """Legacy endpoint — preserved for backward compatibility."""
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(415, "Unsupported image format. Use JPEG, PNG, or WebP.")
    data = await file.read()
    if len(data) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(413, f"Image too large (max {settings.max_upload_size_mb} MB).")
    try:
        image = Image.open(io.BytesIO(data)).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(400, "Invalid image file.")
    predictor = _get_legacy_predictor()
    result = predictor.predict(image, crop=crop)
    if result.get("status") == "ok":
        result["recommendations"] = get_recommendations(result["label"], lang)
    return result


# ──────────────────────────── Static / SPA ────────────────────────────

_frontend = ROOT / "frontend"

# Static assets mount
app.mount("/static", StaticFiles(directory=_frontend), name="static")

# Direct PWA files
@app.get("/manifest.json", include_in_schema=False)
def manifest_json():
    p = _frontend / "manifest.json"
    if p.exists():
        return FileResponse(p, media_type="application/manifest+json")
    raise HTTPException(404)

@app.get("/sw.js", include_in_schema=False)
def service_worker():
    p = _frontend / "sw.js"
    if p.exists():
        return FileResponse(p, media_type="application/javascript")
    raise HTTPException(404)

@app.get("/locales/{filename}", include_in_schema=False)
def get_locale_file(filename: str):
    p = ROOT / "locales" / filename
    if p.exists() and p.is_file():
        return FileResponse(p, media_type="application/json")
    raise HTTPException(404, "Locale not found")

# SPA fallback routes: return index.html for frontend views
SPA_ROUTES = [
    "/", "/login", "/register", "/dashboard", "/farms", "/scan",
    "/history", "/follow-ups", "/notifications", "/profile",
    "/expert", "/admin", "/admin/analytics"
]

@app.get("/", include_in_schema=False)
def root():
    return FileResponse(_frontend / "index.html")

@app.get("/{full_path:path}", include_in_schema=False)
def spa_fallback(full_path: str):
    if full_path.startswith("api/") or full_path.startswith("health") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
        raise HTTPException(404, "Not Found")
    # Check if a static file directly in frontend exists (e.g. style.css, app.js, icons)
    fp = _frontend / full_path
    if fp.exists() and fp.is_file():
        return FileResponse(fp)
    return FileResponse(_frontend / "index.html")
