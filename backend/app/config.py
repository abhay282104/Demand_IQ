import os
from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    """Application configuration from environment variables."""

    # Database (MongoDB Atlas)
    database_url: str = os.getenv("DATABASE_URL", "")
    database_name: str = os.getenv("DATABASE_NAME", "demandiq")

    # Environment
    env: str = os.getenv("ENV", "development")
    debug: bool = os.getenv("DEBUG", "True").lower() == "true"
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    # Model
    model_version: str = os.getenv("MODEL_VERSION", "1.0.0")
    model_path: str = "app/ml/model.pkl"
    scaler_path: str = "app/ml/scaler.pkl"
    encoder_path: str = "app/ml/encoder.pkl"

    # Auth / JWT
    jwt_secret: str = os.getenv(
        "JWT_SECRET", "change-me-in-production-use-a-long-random-string"
    )
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

    # API
    api_title: str = "DemandIQ API"
    api_version: str = "1.0.0"
    api_description: str = "AI-Based Demand Prediction & Price Intelligence Platform"

    # CORS
    allow_origins: list = ["*"]
    allow_credentials: bool = True
    allow_methods: list = ["*"]
    allow_headers: list = ["*"]

    model_config = ConfigDict(env_file=".env", extra="ignore", case_sensitive=False)


settings = Settings()
