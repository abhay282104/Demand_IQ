from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class PredictionRequest(BaseModel):
    """Request schema for demand prediction."""
    product_id: int = Field(..., description="Product ID", gt=0)
    store_id: int = Field(..., description="Store ID", gt=0)
    category_id: int = Field(default=0, description="Category ID")
    historical_sales: float = Field(default=0, description="Historical sales")
    price: float = Field(..., description="Price", ge=0)
    promotion_flag: int = Field(default=0, description="Promotion flag (0 or 1)")
    holiday_flag: int = Field(default=0, description="Holiday flag (0 or 1)")
    economic_index: float = Field(..., description="Economic index value")
    
    model_config = ConfigDict(extra='ignore', json_schema_extra={
        "example": {
            "product_id": 1043,
            "store_id": 9,
            "category_id": 4,
            "historical_sales": 16,
            "price": 48.29,
            "promotion_flag": 0,
            "holiday_flag": 0,
            "economic_index": 84.07,
        }
    })


class PredictionResponse(BaseModel):
    """Response schema for demand prediction."""
    predicted_demand: float = Field(..., description="Predicted demand value")
    confidence: float = Field(..., description="Confidence level (0-1)")
    confidence_info: Optional[str] = Field(None, description="Confidence level description")
    model_version: Optional[str] = Field(None, description="Model version used")
    model_metrics: Optional[Dict[str, float]] = Field(None, description="Current model metrics")
    
    model_config = ConfigDict(extra='ignore', json_schema_extra={
        "example": {
            "predicted_demand": 25.5,
            "confidence": 0.85,
            "confidence_info": "High confidence prediction based on historical patterns",
            "model_version": "1.0.0",
            "model_metrics": {
                "mae": 3.45,
                "rmse": 4.12,
                "r2": 0.89
            }
        }
    })


class ModelMetricsResponse(BaseModel):
    """Model performance metrics response."""
    model_version: str
    mae: float = Field(..., description="Mean Absolute Error")
    rmse: float = Field(..., description="Root Mean Squared Error")
    r2_score: float = Field(..., description="R-squared score")
    training_samples: int
    test_samples: int
    trained_at: datetime
    
    model_config = ConfigDict(extra='ignore')


class SalesDataResponse(BaseModel):
    """Sales data response schema."""
    date: datetime
    historical_sales: float
    price: float
    promotion_flag: bool
    holiday_flag: bool
    economic_index: float
    target_demand: float
    
    model_config = ConfigDict(from_attributes=True)


class MetricsSummary(BaseModel):
    """Summary metrics for dashboard."""
    total_historical_demand: float
    predicted_demand: float
    average_price: float
    model_accuracy: float


class DashboardSummaryResponse(BaseModel):
    """Dashboard summary response."""
    metrics_summary: MetricsSummary
    total_products: int
    total_stores: int
    total_predictions: int
    model_version: str
    last_updated: datetime


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_loaded: bool
    database_connected: bool
    timestamp: datetime


class TrainingResponse(BaseModel):
    """Response schema for model training endpoint."""
    status: str = Field(..., description="Operation status")
    file_name: Optional[str] = Field(None, description="Name of the uploaded file")
    metrics: Optional[Dict[str, Any]] = Field(None, description="Training metrics such as MAE/RMSE/R2")
    dataset_summary: Optional[Dict[str, Any]] = Field(
        None,
        description="Summary of the dataset used for training (rows/products/stores)"
    )

    model_config = ConfigDict(extra='ignore')
