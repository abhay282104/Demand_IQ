import logging
import io
import tempfile
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.concurrency import run_in_threadpool
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo.database import Database
import pandas as pd
import numpy as np

from app.database import get_db
from app.schemas import (
    PredictionRequest,
    PredictionResponse,
    ModelMetricsResponse,
    TrainingResponse,
)
from app.services import PredictionService, ModelService

# import training pipeline
import sys, os

# make sure workspace root (two levels up from this file) is on sys.path
root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if root not in sys.path:
    sys.path.insert(0, root)

try:
    from ml.train import DemandForecastingPipeline
except ImportError:
    # pipeline may not be importable in some environments; log and ignore
    DemandForecastingPipeline = None

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Predictions"])

# Global prediction service
prediction_service = None


def set_prediction_service(service: PredictionService):
    """Set the prediction service instance."""
    global prediction_service
    prediction_service = service


@router.post("/predict", response_model=PredictionResponse)
async def predict(
    request: PredictionRequest,
    db: Database = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
):
    """
    Make a demand prediction.

    Args:
        request: Prediction request with product, store, price, and other features

    Returns:
        PredictionResponse: Predicted demand with confidence and metrics
    """

    if not prediction_service:
        raise HTTPException(
            status_code=503, detail="Model not loaded. Server still initializing."
        )

    # Resolve user_id from JWT if provided (optional auth)
    user_id = None
    if credentials:
        from app.routes.auth import _decode_token

        user_id = _decode_token(credentials.credentials)

    try:
        response = prediction_service.predict(request, db, user_id=user_id)
        return response

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get("/metrics", response_model=ModelMetricsResponse)
async def get_metrics(db: Database = Depends(get_db)):
    """
    Get current model metrics.

    Returns:
        ModelMetricsResponse: Current model performance metrics
    """

    metrics = ModelService.get_latest_metrics(db)

    if not metrics:
        raise HTTPException(status_code=404, detail="No model metrics found")

    return ModelMetricsResponse(
        model_version=metrics.get("model_version", "unknown"),
        mae=float(metrics.get("mae", 0.0)),
        rmse=float(metrics.get("rmse", 0.0)),
        r2_score=float(metrics.get("r2_score", 0.0)),
        training_samples=int(metrics.get("training_samples", 0)),
        test_samples=int(metrics.get("test_samples", 0)),
        trained_at=metrics.get("trained_at"),
    )


@router.post("/retrain")
async def retrain(db: Database = Depends(get_db)):
    """
    Trigger model retraining (placeholder).

    In production, this would:
    - Collect new data
    - Retrain the model
    - Validate performance
    - Update model version

    Returns:
        dict: Retraining status
    """

    return {
        "status": "Retraining initiated",
        "message": "Model retraining feature requires ML orchestration setup",
        "note": "Use the train.py script to retrain the model with updated data",
    }


@router.post("/predict-batch")
async def predict_batch(
    file: UploadFile = File(...),
    db: Database = Depends(get_db),
):
    """
    Make batch predictions from a CSV file.

    Expected CSV columns:
    - date: YYYY-MM-DD format
    - product_id: Product identifier
    - category_id: Category identifier
    - store_id: Store identifier
    - historical_sales: Previous sales value
    - price: Product price
    - promotion_flag: 0 or 1
    - holiday_flag: 0 or 1
    - economic_index: Economic indicator value

    Returns:
        dict: Predictions, analytics, and statistics
    """

    if not prediction_service:
        raise HTTPException(
            status_code=503, detail="Model not loaded. Server still initializing."
        )

    try:
        # Read the uploaded CSV file
        # Try multiple encodings to handle BOM, Windows-1252, etc.
        contents = await file.read()
        for encoding in ("utf-8-sig", "utf-8", "latin-1"):
            try:
                df = pd.read_csv(
                    io.StringIO(contents.decode(encoding)),
                    engine="python",
                    skip_blank_lines=True,
                    on_bad_lines="warn",
                )
                break
            except UnicodeDecodeError:
                continue
        else:
            raise HTTPException(
                status_code=400,
                detail="Could not decode file. Please save the CSV as UTF-8.",
            )

        # Validate required columns
        required_columns = [
            "date",
            "product_id",
            "category_id",
            "store_id",
            "historical_sales",
            "price",
            "promotion_flag",
            "holiday_flag",
            "economic_index",
        ]

        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_columns)}",
            )

        # Make predictions for each row
        predictions_list = []
        df_clean = df.where(pd.notnull(df), None)

        for idx, row in enumerate(df_clean.to_dict('records')):
            try:
                request = PredictionRequest(
                    product_id=int(row["product_id"]),
                    store_id=int(row["store_id"]),
                    category_id=int(row["category_id"]),
                    historical_sales=float(row["historical_sales"]),
                    price=float(row["price"]),
                    promotion_flag=int(row["promotion_flag"]),
                    holiday_flag=int(row["holiday_flag"]),
                    economic_index=float(row["economic_index"]),
                )

                pred = prediction_service.predict(request, db, skip_history=True)

                predictions_list.append(
                    {
                        "row_index": idx,
                        "date": row.get("date"),
                        "product_id": int(row["product_id"]),
                        "store_id": int(row["store_id"]),
                        "category_id": int(row.get("category_id", 0)),
                        "historical_sales": float(row.get("historical_sales", 0)),
                        "price": float(row.get("price", 0)),
                        "promotion_flag": int(row.get("promotion_flag", 0)),
                        "holiday_flag": int(row.get("holiday_flag", 0)),
                        "economic_index": float(row.get("economic_index", 0)),
                        "predicted_demand": pred.predicted_demand,
                        "confidence": pred.confidence,
                        "actual_demand": row.get("target_demand", None),
                    }
                )

            except Exception as e:
                logger.error(f"Error predicting row {idx}: {str(e)}")
                predictions_list.append({"row_index": idx, "error": str(e)})

        # Calculate analytics
        successful_predictions = [
            p for p in predictions_list if "predicted_demand" in p
        ]

        analytics = {
            "total_rows": len(df),
            "successful_predictions": len(successful_predictions),
            "failed_predictions": len(predictions_list) - len(successful_predictions),
        }

        if successful_predictions:
            predictions_array = np.array(
                [p["predicted_demand"] for p in successful_predictions]
            )
            confidence_array = np.array(
                [p["confidence"] for p in successful_predictions]
            )

            analytics.update(
                {
                    "average_predicted_demand": float(np.mean(predictions_array)),
                    "min_predicted_demand": float(np.min(predictions_array)),
                    "max_predicted_demand": float(np.max(predictions_array)),
                    "std_predicted_demand": float(np.std(predictions_array)),
                    "average_confidence": float(np.mean(confidence_array)),
                    "min_confidence": float(np.min(confidence_array)),
                    "max_confidence": float(np.max(confidence_array)),
                }
            )

            # If there are actual demand values, calculate error metrics
            actual_demands = [
                p.get("actual_demand")
                for p in successful_predictions
                if "actual_demand" in p and p["actual_demand"] is not None
            ]

            if actual_demands:
                actual_array = np.array(actual_demands)
                errors = predictions_array[: len(actual_demands)] - actual_array

                analytics.update(
                    {
                        "mae": float(np.mean(np.abs(errors))),
                        "rmse": float(np.sqrt(np.mean(errors**2))),
                        "mape": float(
                            np.mean(np.abs(errors / (actual_array + 1))) * 100
                        ),
                    }
                )

        return {
            "status": "success",
            "predictions": predictions_list,
            "analytics": analytics,
            "file_name": file.filename,
        }

    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Batch prediction failed: {str(e)}"
        )


@router.post("/train", response_model=TrainingResponse)
async def train_model(
    file: UploadFile = File(...),
    db: Database = Depends(get_db),
):
    """Retrain/initial train the model using an uploaded CSV file.

    The file should follow the same schema as the forecast dataset.  The
    backend uses the existing ML training pipeline to process the data,
    train an XGBoost model, save artifacts, and update metrics in the
    database.  After training completes the global prediction service is
    updated so subsequent `/predict` calls use the new model.
    """

    if DemandForecastingPipeline is None:
        raise HTTPException(status_code=500, detail="Training pipeline not available.")

    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))

        # Validate required columns (similar to batch prediction plus target_demand for training)
        required_columns = [
            "date",
            "product_id",
            "category_id",
            "store_id",
            "historical_sales",
            "price",
            "promotion_flag",
            "holiday_flag",
            "economic_index",
            "target_demand",
        ]

        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_columns)}",
            )

        # write dataframe to temporary file for pipeline consumption
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
            df.to_csv(tmp.name, index=False)
            data_path = tmp.name

        def _train_pipeline():
            pipeline = DemandForecastingPipeline(data_path)
            if not pipeline.load_data():
                raise RuntimeError("Failed to load training data")
            pipeline.preprocess_data()
            pipeline.feature_engineering()
            pipeline.prepare_features()
            pipeline.train_model()
            metrics = pipeline.evaluate_model()
            pipeline.save_artifacts(metrics)
            return pipeline, metrics

        pipeline, metrics = await run_in_threadpool(_train_pipeline)
        if metrics is None:
            metrics = {}

        # update metrics in database
        ModelService.save_metrics(
            db,
            metrics.get("mae", 0.0),
            metrics.get("rmse", 0.0),
            metrics.get("r2", 0.0),
            metrics.get("train_samples", 0),
            metrics.get("test_samples", 0),
        )

        # update global prediction service so new model is used
        if prediction_service:
            prediction_service.model = pipeline.model
            prediction_service.scaler = pipeline.scaler
            prediction_service.encoder = pipeline.encoder

        dataset_summary = {
            "total_rows": len(df),
            "unique_products": int(df["product_id"].nunique()),
            "unique_stores": int(df["store_id"].nunique()),
        }

        # run predictions on the uploaded data using updated service
        predictions_list = []
        df_clean = df.where(pd.notnull(df), None)
        
        for idx, row in enumerate(df_clean.to_dict('records')):
            try:
                req = PredictionRequest(
                    product_id=int(row["product_id"]),
                    store_id=int(row["store_id"]),
                    category_id=int(row.get("category_id", 0)),
                    historical_sales=float(row.get("historical_sales", 0)),
                    price=float(row.get("price", 0)),
                    promotion_flag=int(row.get("promotion_flag", 0)),
                    holiday_flag=int(row.get("holiday_flag", 0)),
                    economic_index=float(row.get("economic_index", 0)),
                )
                pred = prediction_service.predict(req, db, skip_history=True)
                predictions_list.append(
                    {
                        "row_index": idx,
                        "date": row.get("date"),
                        "product_id": int(row["product_id"]),
                        "store_id": int(row["store_id"]),
                        "category_id": int(row.get("category_id", 0)),
                        "historical_sales": float(row.get("historical_sales", 0)),
                        "price": float(row.get("price", 0)),
                        "promotion_flag": int(row.get("promotion_flag", 0)),
                        "holiday_flag": int(row.get("holiday_flag", 0)),
                        "economic_index": float(row.get("economic_index", 0)),
                        "predicted_demand": pred.predicted_demand,
                        "confidence": pred.confidence,
                        "actual_demand": row.get("target_demand", None),
                    }
                )
            except Exception as e:
                logger.error(
                    f"Error predicting row {idx} during train analysis: {str(e)}"
                )
                predictions_list.append({"row_index": idx, "error": str(e)})

        # analytics calculation (same as predict_batch)
        analytics = {
            "total_rows": len(df),
            "successful_predictions": len(
                [p for p in predictions_list if "predicted_demand" in p]
            ),
            "failed_predictions": len(predictions_list)
            - len([p for p in predictions_list if "predicted_demand" in p]),
        }

        successful = [p for p in predictions_list if "predicted_demand" in p]
        if successful:
            arr = np.array([p["predicted_demand"] for p in successful])
            conf = np.array([p["confidence"] for p in successful])
            analytics.update(
                {
                    "average_predicted_demand": float(np.mean(arr)),
                    "min_predicted_demand": float(np.min(arr)),
                    "max_predicted_demand": float(np.max(arr)),
                    "std_predicted_demand": float(np.std(arr)),
                    "average_confidence": float(np.mean(conf)),
                    "min_confidence": float(np.min(conf)),
                    "max_confidence": float(np.max(conf)),
                }
            )
            actuals = [
                p.get("actual_demand")
                for p in successful
                if p.get("actual_demand") is not None
            ]
            if actuals:
                actual_array = np.array(actuals)
                errors = arr[: len(actual_array)] - actual_array
                analytics.update(
                    {
                        "mae": float(np.mean(np.abs(errors))),
                        "rmse": float(np.sqrt(np.mean(errors**2))),
                        "mape": float(
                            np.mean(np.abs(errors / (actual_array + 1))) * 100
                        ),
                    }
                )

        return {
            "status": "success",
            "file_name": file.filename,
            "metrics": metrics,
            "dataset_summary": dataset_summary,
            "predictions": predictions_list,
            "analytics": analytics,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Training error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")
