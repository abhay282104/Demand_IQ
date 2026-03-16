import logging
import sys
import logging
import sys
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.services import PredictionService, ModelService
from app.routes import predictions_router, sales_router, health_router, auth_router

# Configure logging
logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ],
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup and shutdown."""

    # Startup
    logger.info("=" * 50)
    logger.info("DemandIQ API Starting Up")
    logger.info("=" * 50)

    try:
        # Initialize database
        logger.info("Initializing database...")
        init_db()
        logger.info("✓ Database initialized")

        # Load ML model
        logger.info("Loading machine learning model...")
        model = ModelService.load_model()
        scaler = ModelService.load_scaler()
        encoder = ModelService.load_encoder()

        if model is None:
            logger.warning("⚠ Model not found. Predictions may not work.")
            logger.warning("  Run 'python ml/train.py' to train and save the model.")
            from app.routes.health import set_model_loaded

            set_model_loaded(False)
        else:
            logger.info("✓ Model loaded successfully")
            logger.info(f"✓ Model version: {settings.model_version}")

            from app.routes.health import set_model_loaded

            set_model_loaded(True)

        # Initialize prediction service
        prediction_service = PredictionService(
            model=model,
            scaler=scaler,
            encoder=encoder,
        )

        from app.routes.predictions import set_prediction_service

        set_prediction_service(prediction_service)

        logger.info("✓ Prediction service initialized")
        logger.info("=" * 50)
        logger.info("DemandIQ API Ready (UTC: {})".format(datetime.utcnow()))
        logger.info("=" * 50)

        yield

    except Exception as e:
        logger.error(f"Startup error: {str(e)}", exc_info=True)
        raise

    # Shutdown
    finally:
        logger.info("=" * 50)
        logger.info("DemandIQ API Shutting Down")
        logger.info("=" * 50)


# Create FastAPI app
app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allow_origins,
    allow_credentials=settings.allow_credentials,
    allow_methods=settings.allow_methods,
    allow_headers=settings.allow_headers,
)


# Custom exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error": str(exc) if settings.debug else "An error occurred",
        },
    )


# Include routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(predictions_router)
app.include_router(sales_router)


@app.get("/", tags=["Info"])
async def root():
    """Root endpoint."""
    return {
        "name": settings.api_title,
        "version": settings.api_version,
        "description": settings.api_description,
        "docs": "/docs",
        "openapi": "/openapi.json",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
