import os
from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    """Application configuration from environment variables."""
    
    # Database
    database_url: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./app_data.db"
    )
    
    # Environment
    env: str = os.getenv("ENV", "development")
    debug: bool = os.getenv("DEBUG", "True").lower() == "true"
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Model
    model_version: str = os.getenv("MODEL_VERSION", "1.0.0")
    model_path: str = "app/ml/model.pkl"
    scaler_path: str = "app/ml/scaler.pkl"
    encoder_path: str = "app/ml/encoder.pkl"
    
    # API
    api_title: str = "DemandIQ API"
    api_version: str = "1.0.0"
    api_description: str = "AI-Based Demand Prediction & Price Intelligence Platform"
    
    # CORS
    allow_origins: list = ["*"]
    allow_credentials: bool = True
    allow_methods: list = ["*"]
    allow_headers: list = ["*"]
    
    model_config = ConfigDict(
        env_file=".env",
        extra='ignore',
        case_sensitive=False
    )


settings = Settings()
