"""Application configuration using pydantic-settings."""
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    # Database
    database_url: str = f"sqlite:///{ROOT}/crophealth.db"

    # Auth
    secret_key: str = "CHANGE_ME_IN_PRODUCTION_USE_LONG_RANDOM_STRING"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Model
    model_path: str = str(ROOT / "artifacts" / "best_model.pt")

    # Uploads
    upload_dir: str = str(ROOT / "uploads")
    max_upload_size_mb: int = 10

    # Knowledge base
    knowledge_base_path: str = str(ROOT / "knowledge_base" / "recommendations.json")

    # Weather
    weather_provider: str = "disabled"
    weather_api_key: Optional[str] = None

    # App
    default_language: str = "en"
    app_name: str = "Kenya Crop Health AI"
    app_version: str = "2.0.0"
    debug: bool = False

    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost:8000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
