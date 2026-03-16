import logging
import numpy as np
from sqlalchemy.orm import Session
from app.models.models import Prediction, Product, Store, ModelMetrics
from app.schemas.schemas import PredictionRequest, PredictionResponse
from app.config import settings

logger = logging.getLogger(__name__)


class PredictionService:
    """Service for handling prediction logic."""
    
    def __init__(self, model=None, scaler=None, encoder=None):
        self.model = model
        self.scaler = scaler
        self.encoder = encoder
        self.model_metrics = None
    
    def load_model_metrics(self, db: Session):
        """Load latest model metrics from database."""
        metrics = db.query(ModelMetrics).order_by(
            ModelMetrics.trained_at.desc()
        ).first()
        
        if metrics:
            self.model_metrics = {
                "mae": round(metrics.mae, 4),
                "rmse": round(metrics.rmse, 4),
                "r2": round(metrics.r2_score, 4),
            }
        else:
            self.model_metrics = {"mae": 0.0, "rmse": 0.0, "r2": 0.0}
    
    def predict(
        self,
        request: PredictionRequest,
        db: Session
    ) -> PredictionResponse:
        """Make prediction for demand."""
        
        # Validate product and store exist
        product = db.query(Product).filter(
            Product.product_id == request.product_id
        ).first()
        
        store = db.query(Store).filter(
            Store.store_id == request.store_id
        ).first()
        
        # Create products/stores if they don't exist (for new data)
        if not product:
            product = Product(
                product_id=request.product_id,
                category_id=0  # Default category
            )
            db.add(product)
        
        if not store:
            store = Store(store_id=request.store_id)
            db.add(store)
        
        db.commit()
        
        # Load metrics
        self.load_model_metrics(db)
        
        # Prepare features for prediction
        try:
            # Create feature vector matching training features
            features = self._prepare_features(
                product_id=request.product_id,
                store_id=request.store_id,
                price=request.price,
                promotion_flag=request.promotion_flag,
                holiday_flag=request.holiday_flag,
                economic_index=request.economic_index,
                db=db
            )
            
            # Scale features
            if self.scaler:
                features_scaled = self.scaler.transform([features])
            else:
                features_scaled = np.array([features])
            
            # Make prediction
            predicted_demand = self.model.predict(features_scaled)[0]
            predicted_demand = max(0, float(predicted_demand))
            
            # Determine confidence
            r2_score = self.model_metrics.get("r2", 0.7)
            confidence = max(0.0, min(1.0, r2_score))  # Clamp between 0 and 1
            
            confidence_info = self._get_confidence_info(
                predicted_demand,
                request.promotion_flag,
                request.holiday_flag
            )
            
            # Store prediction
            prediction_record = Prediction(
                product_id=request.product_id,
                store_id=request.store_id,
                predicted_demand=predicted_demand,
                input_price=request.price,
                input_promotion=bool(request.promotion_flag),
                input_holiday=bool(request.holiday_flag),
                input_economic_index=request.economic_index,
                model_version=settings.model_version,
            )
            db.add(prediction_record)
            db.commit()
            
            return PredictionResponse(
                predicted_demand=round(predicted_demand, 2),
                confidence=round(confidence, 3),
                confidence_info=confidence_info,
                model_version=settings.model_version,
                model_metrics=self.model_metrics,
            )
        
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            raise
    
    def _prepare_features(
        self,
        product_id: int,
        store_id: int,
        price: float,
        promotion_flag: int,
        holiday_flag: int,
        economic_index: float,
        db: Session
    ) -> np.ndarray:
        """Prepare features for model prediction."""
        
        # Get historical data for the product-store combination
        from app.models.models import SalesData
        
        sales = db.query(SalesData).filter(
            SalesData.product_id == product_id,
            SalesData.store_id == store_id,
        ).order_by(SalesData.date.desc()).limit(30).all()
        
        # Calculate lag and rolling features
        lag_1 = sales[0].target_demand if sales else 0
        
        if len(sales) >= 7:
            rolling_mean_7 = np.mean([s.target_demand for s in sales[:7]])
        else:
            rolling_mean_7 = np.mean([s.target_demand for s in sales]) if sales else 0
        
        # Calculate historical_sales average
        historical_sales_avg = np.mean([s.historical_sales for s in sales]) if sales else 0
        
        # Price to sales ratio
        price_to_sales_ratio = price / (historical_sales_avg + 1)
        
        # Interaction features
        promotion_impact = (1.2 if promotion_flag else 1.0)
        holiday_impact = (1.3 if holiday_flag else 1.0)
        economic_influence = economic_index / 100.0
        
        # Feature vector in training order
        features = np.array([
            float(product_id),
            float(store_id),
            float(historical_sales_avg),
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
        ])
        
        return features
    
    def _get_confidence_info(
        self,
        predicted_demand: float,
        promotion_flag: int,
        holiday_flag: int
    ) -> str:
        """Generate confidence information message."""
        
        # Get R2 score as confidence indicator
        r2 = self.model_metrics.get("r2", 0.0)
        
        if r2 > 0.85:
            confidence_level = "Very High"
        elif r2 > 0.75:
            confidence_level = "High"
        elif r2 > 0.65:
            confidence_level = "Moderate"
        else:
            confidence_level = "Low"
        
        msg = f"{confidence_level} confidence (R² = {r2:.3f}). "
        
        if promotion_flag:
            msg += "Promotion detected - expect higher-than-baseline demand. "
        
        if holiday_flag:
            msg += "Holiday period - demand typically peaks. "
        
        msg += "Based on historical patterns and economic indicators."
        
        return msg
