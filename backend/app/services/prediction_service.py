import logging
from datetime import datetime

import numpy as np
import pandas as pd
from pymongo.database import Database

from app.config import settings
from app.schemas.schemas import PredictionRequest, PredictionResponse

logger = logging.getLogger(__name__)


class PredictionService:
    """Service for handling prediction logic."""

    def __init__(self, model=None, scaler=None, encoder=None):
        self.model = model
        self.scaler = scaler
        self.encoder = encoder
        self.model_metrics = None
        self._seen_products = set()
        self._seen_stores = set()
        self._sales_cache = {}

    def load_model_metrics(self, db: Database):
        """Load latest model metrics from MongoDB."""
        metrics = db.model_metrics.find_one(sort=[("trained_at", -1)])
        if metrics:
            self.model_metrics = {
                "mae": round(float(metrics.get("mae", 0.0)), 4),
                "rmse": round(float(metrics.get("rmse", 0.0)), 4),
                "r2": round(float(metrics.get("r2_score", 0.0)), 4),
            }
        else:
            self.model_metrics = {"mae": 0.0, "rmse": 0.0, "r2": 0.0}

    def predict(
        self, request: PredictionRequest, db: Database, user_id: str = None, skip_history: bool = False
    ) -> PredictionResponse:
        """Make prediction for demand."""
        if request.product_id not in self._seen_products:
            db.products.update_one(
                {"product_id": request.product_id},
                {
                    "$setOnInsert": {
                        "product_id": request.product_id,
                        "category_id": (
                            request.category_id if request.category_id is not None else 0
                        ),
                        "created_at": datetime.utcnow(),
                    }
                },
                upsert=True,
            )
            self._seen_products.add(request.product_id)

        if request.store_id not in self._seen_stores:
            db.stores.update_one(
                {"store_id": request.store_id},
                {
                    "$setOnInsert": {
                        "store_id": request.store_id,
                        "created_at": datetime.utcnow(),
                    }
                },
                upsert=True,
            )
            self._seen_stores.add(request.store_id)

        if not self.model_metrics:
            self.load_model_metrics(db)

        try:
            features = self._prepare_features(
                product_id=request.product_id,
                store_id=request.store_id,
                price=request.price,
                promotion_flag=request.promotion_flag,
                holiday_flag=request.holiday_flag,
                economic_index=request.economic_index,
                db=db,
            )

            if self.scaler:
                features_scaled = self.scaler.transform(features)
            else:
                features_scaled = features.values

            predicted_demand = self.model.predict(features_scaled)[0]
            predicted_demand = max(0, float(predicted_demand))

            r2_score = self.model_metrics.get("r2", 0.7)
            confidence = max(0.0, min(1.0, r2_score))

            confidence_info = self._get_confidence_info(
                predicted_demand,
                request.promotion_flag,
                request.holiday_flag,
            )

            prediction_doc = {
                "product_id": request.product_id,
                "store_id": request.store_id,
                "predicted_demand": predicted_demand,
                "confidence": round(confidence, 3),
                "input_price": request.price,
                "input_promotion": bool(request.promotion_flag),
                "input_holiday": bool(request.holiday_flag),
                "input_economic_index": request.economic_index,
                "model_version": settings.model_version,
                "timestamp": datetime.utcnow(),
                "created_at": datetime.utcnow(),
            }
            if not skip_history:
                if user_id:
                    prediction_doc["user_id"] = user_id
                db.predictions.insert_one(prediction_doc)

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
        db: Database,
    ) -> np.ndarray:
        """Prepare features for model prediction."""
        cache_key = f"{product_id}_{store_id}"
        if cache_key in self._sales_cache:
            sales_docs = self._sales_cache[cache_key]
        else:
            sales_docs = list(
                db.sales_data.find(
                    {"product_id": product_id, "store_id": store_id},
                    {"target_demand": 1, "historical_sales": 1},
                )
                .sort("date", -1)
                .limit(30)
            )
            # Prevent unbounded memory growth over time
            if len(self._sales_cache) > 5000:
                self._sales_cache.clear()
            self._sales_cache[cache_key] = sales_docs

        lag_1 = float(sales_docs[0].get("target_demand", 0)) if sales_docs else 0.0

        if len(sales_docs) >= 7:
            rolling_mean_7 = float(
                np.mean([float(s.get("target_demand", 0)) for s in sales_docs[:7]])
            )
        else:
            rolling_mean_7 = (
                float(np.mean([float(s.get("target_demand", 0)) for s in sales_docs]))
                if sales_docs
                else 0.0
            )

        historical_sales_avg = (
            float(np.mean([float(s.get("historical_sales", 0)) for s in sales_docs]))
            if sales_docs
            else 0.0
        )

        price_to_sales_ratio = price / (historical_sales_avg + 1)
        promotion_impact = 1.2 if promotion_flag else 1.0
        holiday_impact = 1.3 if holiday_flag else 1.0
        economic_influence = economic_index / 100.0

        feature_names = [
            "product_id",
            "store_id",
            "historical_sales",
            "price",
            "promotion_flag",
            "holiday_flag",
            "economic_index",
            "lag_1",
            "rolling_mean_7",
            "price_to_sales_ratio",
            "promotion_impact",
            "holiday_impact",
            "economic_influence",
        ]

        features = pd.DataFrame(
            [
                [
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
                ]
            ],
            columns=feature_names,
        )

        return features

    def _get_confidence_info(
        self,
        predicted_demand: float,
        promotion_flag: int,
        holiday_flag: int,
    ) -> str:
        """Generate confidence information message."""
        r2 = self.model_metrics.get("r2", 0.0)

        if r2 > 0.85:
            confidence_level = "Very High"
        elif r2 > 0.75:
            confidence_level = "High"
        elif r2 > 0.65:
            confidence_level = "Moderate"
        else:
            confidence_level = "Low"

        msg = f"{confidence_level} confidence (R2 = {r2:.3f}). "

        if promotion_flag:
            msg += "Promotion detected - expect higher-than-baseline demand. "

        if holiday_flag:
            msg += "Holiday period - demand typically peaks. "

        msg += "Based on historical patterns and economic indicators."

        return msg
