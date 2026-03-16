import logging
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import HealthResponse

logger = logging.getLogger(__name__)
router = APIRouter()

# Global state for model loading
model_loaded = False


def set_model_loaded(status: bool):
    """Set model loaded status."""
    global model_loaded
    model_loaded = status


def is_model_loaded() -> bool:
    """Check if model is loaded."""
    return model_loaded


@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint.
    
    Returns:
        HealthResponse: Status of API, model, and database connections
    """
    
    try:
        # Database check
        db.execute("SELECT 1")
        db_connected = True
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        db_connected = False
    
    return HealthResponse(
        status="healthy" if db_connected and model_loaded else "degraded",
        model_loaded=model_loaded,
        database_connected=db_connected,
        timestamp=datetime.utcnow(),
    )
