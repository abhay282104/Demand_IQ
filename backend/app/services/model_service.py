import logging
import joblib
import os
from pathlib import Path
from sqlalchemy.orm import Session

from app.models.models import ModelMetrics
from app.config import settings

logger = logging.getLogger(__name__)


class ModelService:
    """Service for model loading and management."""
    
    @staticmethod
    def load_model():
        """Load trained model from disk."""
        try:
            if not os.path.exists(settings.model_path):
                logger.warning(f"Model not found at {settings.model_path}")
                return None
            
            model = joblib.load(settings.model_path)
            logger.info(f"Model loaded successfully from {settings.model_path}")
            return model
        
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            return None
    
    @staticmethod
    def load_scaler():
        """Load feature scaler from disk."""
        try:
            if not os.path.exists(settings.scaler_path):
                logger.warning(f"Scaler not found at {settings.scaler_path}")
                return None
            
            scaler = joblib.load(settings.scaler_path)
            logger.info(f"Scaler loaded successfully from {settings.scaler_path}")
            return scaler
        
        except Exception as e:
            logger.error(f"Error loading scaler: {str(e)}")
            return None
    
    @staticmethod
    def load_encoder():
        """Load categorical encoder from disk."""
        try:
            if not os.path.exists(settings.encoder_path):
                logger.warning(f"Encoder not found at {settings.encoder_path}")
                return None
            
            encoder = joblib.load(settings.encoder_path)
            logger.info(f"Encoder loaded successfully from {settings.encoder_path}")
            return encoder
        
        except Exception as e:
            logger.error(f"Error loading encoder: {str(e)}")
            return None
    
    @staticmethod
    def save_model(model, scaler=None, encoder=None):
        """Save model and associated objects to disk."""
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(settings.model_path), exist_ok=True)
            
            joblib.dump(model, settings.model_path)
            logger.info(f"Model saved to {settings.model_path}")
            
            if scaler:
                joblib.dump(scaler, settings.scaler_path)
                logger.info(f"Scaler saved to {settings.scaler_path}")
            
            if encoder:
                joblib.dump(encoder, settings.encoder_path)
                logger.info(f"Encoder saved to {settings.encoder_path}")
            
            return True
        
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            return False
    
    @staticmethod
    def save_metrics(
        db: Session,
        mae: float,
        rmse: float,
        r2: float,
        training_samples: int,
        test_samples: int,
        model_version: str = None,
    ):
        """Save model metrics to database."""
        
        try:
            version = model_version or settings.model_version
            
            # Delete old metrics for this version
            db.query(ModelMetrics).filter(
                ModelMetrics.model_version == version
            ).delete()
            
            # Create new metrics record
            metrics = ModelMetrics(
                model_version=version,
                mae=mae,
                rmse=rmse,
                r2_score=r2,
                training_samples=training_samples,
                test_samples=test_samples,
            )
            
            db.add(metrics)
            db.commit()
            
            logger.info(f"Metrics saved for model {version}: MAE={mae:.4f}, RMSE={rmse:.4f}, R²={r2:.4f}")
            
            return True
        
        except Exception as e:
            logger.error(f"Error saving metrics: {str(e)}")
            db.rollback()
            return False
    
    @staticmethod
    def get_latest_metrics(db: Session):
        """Get latest model metrics from database."""
        
        metrics = db.query(ModelMetrics).order_by(
            ModelMetrics.trained_at.desc()
        ).first()
        
        return metrics
