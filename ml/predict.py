"""
DemandIQ Prediction Module

Utility functions for making predictions using the trained model.
This module is used by the FastAPI backend for inference.
"""

import logging
import numpy as np
import joblib
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class DemandPredictor:
    """Helper class for making demand predictions."""
    
    def __init__(self, model_path: str, scaler_path: str, features_path: str):
        """
        Initialize predictor with model artifacts.
        
        Args:
            model_path: Path to trained XGBoost model
            scaler_path: Path to feature scaler
            features_path: Path to feature names list
        """
        self.model = None
        self.scaler = None
        self.feature_names = None
        
        try:
            self.model = joblib.load(model_path)
            logger.info(f"Model loaded from {model_path}")
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
        
        try:
            self.scaler = joblib.load(scaler_path)
            logger.info(f"Scaler loaded from {scaler_path}")
        except Exception as e:
            logger.error(f"Failed to load scaler: {str(e)}")
        
        try:
            self.feature_names = joblib.load(features_path)
            logger.info(f"Feature names loaded from {features_path}")
        except Exception as e:
            logger.error(f"Failed to load feature names: {str(e)}")
    
    def is_ready(self) -> bool:
        """Check if predictor is ready to make predictions."""
        return self.model is not None and self.scaler is not None
    
    def predict(self, features: Dict[str, Any]) -> Optional[float]:
        """
        Make a demand prediction.
        
        Args:
            features: Dictionary of feature values matching training features
            
        Returns:
            Predicted demand value or None if prediction fails
        """
        
        if not self.is_ready():
            logger.error("Predictor not ready - model or scaler missing")
            return None
        
        try:
            # Create feature vector in correct order
            X = np.array([
                features.get("product_id", 0),
                features.get("store_id", 0),
                features.get("historical_sales", 0),
                features.get("price", 0),
                features.get("promotion_flag", 0),
                features.get("holiday_flag", 0),
                features.get("economic_index", 0),
                features.get("lag_1", 0),
                features.get("rolling_mean_7", 0),
                features.get("price_to_sales_ratio", 0),
                features.get("promotion_impact", 1.0),
                features.get("holiday_impact", 1.0),
                features.get("economic_influence", 0),
            ]).reshape(1, -1)
            
            # Scale features
            X_scaled = self.scaler.transform(X)
            
            # Make prediction
            prediction = self.model.predict(X_scaled)[0]
            
            # Ensure non-negative
            prediction = max(0, float(prediction))
            
            return prediction
        
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            return None


def predict_demand(
    product_id: int,
    store_id: int,
    price: float,
    promotion_flag: int,
    holiday_flag: int,
    economic_index: float,
    historical_sales: float = 0,
    lag_1: float = 0,
    rolling_mean_7: float = 0,
    model=None,
    scaler=None,
) -> Optional[float]:
    """
    Simple prediction function.
    
    Args:
        product_id: Product ID
        store_id: Store ID
        price: Product price
        promotion_flag: Whether promotion is active (0 or 1)
        holiday_flag: Whether it's a holiday (0 or 1)
        economic_index: Economic index value
        historical_sales: Historical sales (optional)
        lag_1: Previous demand (optional)
        rolling_mean_7: 7-day rolling average (optional)
        model: Trained XGBoost model
        scaler: Feature scaler
        
    Returns:
        Predicted demand value
    """
    
    if model is None or scaler is None:
        logger.error("Model or scaler not provided")
        return None
    
    try:
        # Calculate interaction features
        promotion_impact = 1.2 if promotion_flag else 1.0
        holiday_impact = 1.3 if holiday_flag else 1.0
        economic_influence = economic_index / 100.0
        
        # Avoid division by zero
        price_to_sales_ratio = price / (historical_sales + 1)
        
        # Create feature vector
        X = np.array([
            float(product_id),
            float(store_id),
            float(historical_sales),
            float(price),
            float(promotion_flag),
            float(holiday_flag),
            float(economic_index),
            float(lag_1),
            float(rolling_mean_7),
            float(price_to_sales_ratio),
            float(promotion_impact),
            float(holiday_impact),
            float(economic_influence),
        ]).reshape(1, -1)
        
        # Scale
        X_scaled = scaler.transform(X)
        
        # Predict
        prediction = model.predict(X_scaled)[0]
        prediction = max(0, float(prediction))
        
        return prediction
    
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return None
