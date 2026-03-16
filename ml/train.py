"""
DemandIQ ML Training Script

This script:
1. Loads the demand forecasting dataset
2. Performs data preprocessing and feature engineering
3. Trains XGBoost model with hyperparameter tuning
4. Evaluates model performance
5. Saves trained model and artifacts
"""

import os
import sys
import logging
import pickle
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path

from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor
import joblib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class DemandForecastingPipeline:
    """Complete ML pipeline for demand forecasting."""
    
    def __init__(self, data_path: str, output_dir: str = "app/ml"):
        self.data_path = data_path
        self.output_dir = output_dir
        
        # Create output directory
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)
        
        # Initialize pipeline components
        self.df = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.scaler = None
        self.encoder = None
        self.model = None
        self.feature_names = None
        
        logger.info("=" * 60)
        logger.info("DemandIQ ML Training Pipeline Initialized")
        logger.info("=" * 60)
    
    def load_data(self):
        """Load raw data from CSV."""
        try:
            logger.info(f"Loading data from: {self.data_path}")
            self.df = pd.read_csv(self.data_path)
            
            logger.info(f"✓ Data loaded: {self.df.shape[0]} rows, {self.df.shape[1]} columns")
            logger.info(f"  Date range: {self.df['date'].min()} to {self.df['date'].max()}")
            logger.info(f"  Columns: {list(self.df.columns)}")
            
            return True
        
        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            return False
    
    def preprocess_data(self):
        """Preprocess raw data."""
        try:
            logger.info("\n" + "=" * 60)
            logger.info("DATA PREPROCESSING")
            logger.info("=" * 60)
            
            # Convert date to datetime
            logger.info("Converting date column...")
            self.df["date"] = pd.to_datetime(self.df["date"])
            
            # Sort by date for time-aware split
            self.df = self.df.sort_values("date").reset_index(drop=True)
            logger.info("✓ Data sorted by date")
            
            # Extract temporal features
            logger.info("Extracting temporal features...")
            self.df["year"] = self.df["date"].dt.year
            self.df["month"] = self.df["date"].dt.month
            self.df["week"] = self.df["date"].dt.isocalendar().week
            self.df["day_of_week"] = self.df["date"].dt.dayofweek
            logger.info("✓ Temporal features extracted")
            
            # Handle missing values
            missing_count = self.df.isnull().sum().sum()
            if missing_count > 0:
                logger.warning(f"Found {missing_count} missing values, filling with 0")
                self.df = self.df.fillna(0)
            else:
                logger.info("✓ No missing values detected")
            
            # Remove duplicates
            duplicate_count = self.df.duplicated().sum()
            if duplicate_count > 0:
                logger.warning(f"Removing {duplicate_count} duplicate rows")
                self.df = self.df.drop_duplicates().reset_index(drop=True)
            
            logger.info(f"✓ Preprocessing complete: {self.df.shape[0]} rows remaining")
            
            return True
        
        except Exception as e:
            logger.error(f"Preprocessing error: {str(e)}")
            return False
    
    def feature_engineering(self):
        """Create advanced features."""
        try:
            logger.info("\n" + "=" * 60)
            logger.info("FEATURE ENGINEERING")
            logger.info("=" * 60)
            
            # Sort by product-store-date for lag features
            self.df = self.df.sort_values(
                by=["product_id", "store_id", "date"]
            ).reset_index(drop=True)
            
            # Lag features (previous demand per product-store)
            logger.info("Creating lag features...")
            self.df["lag_1"] = self.df.groupby(
                ["product_id", "store_id"]
            )["target_demand"].shift(1).fillna(0)
            logger.info("✓ Lag_1 feature created")
            
            # Rolling mean (7-day average demand)
            logger.info("Creating rolling features...")
            self.df["rolling_mean_7"] = self.df.groupby(
                ["product_id", "store_id"]
            )["target_demand"].transform(
                lambda x: x.rolling(window=7, min_periods=1).mean()
            ).fillna(0)
            logger.info("✓ Rolling_mean_7 feature created")
            
            # Price to sales ratio
            logger.info("Creating interaction features...")
            self.df["price_to_sales_ratio"] = (
                self.df["price"] / (self.df["historical_sales"] + 1)
            )
            
            # Promotion impact interaction
            self.df["promotion_impact"] = self.df["promotion_flag"].apply(
                lambda x: 1.2 if x else 1.0
            )
            
            # Holiday impact interaction
            self.df["holiday_impact"] = self.df["holiday_flag"].apply(
                lambda x: 1.3 if x else 1.0
            )
            
            # Economic influence (normalized)
            self.df["economic_influence"] = self.df["economic_index"] / 100.0
            
            logger.info("✓ Interaction features created")
            logger.info(f"✓ Total features: 13 (7 original + 6 engineered)")
            
            return True
        
        except Exception as e:
            logger.error(f"Feature engineering error: {str(e)}")
            return False
    
    def prepare_features(self):
        """Prepare features for modeling."""
        try:
            logger.info("\n" + "=" * 60)
            logger.info("FEATURE PREPARATION")
            logger.info("=" * 60)
            
            # Select features for modeling
            feature_cols = [
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
            
            self.feature_names = feature_cols
            
            X = self.df[feature_cols].copy()
            y = self.df["target_demand"].copy()
            
            logger.info(f"Feature set shape: {X.shape}")
            logger.info(f"Target shape: {y.shape}")
            
            # Time-aware train-test split (no data leakage)
            # Use 80% earliest data for training, 20% latest for testing
            split_idx = int(len(self.df) * 0.8)
            
            self.X_train = X.iloc[:split_idx].reset_index(drop=True)
            self.X_test = X.iloc[split_idx:].reset_index(drop=True)
            self.y_train = y.iloc[:split_idx].reset_index(drop=True)
            self.y_test = y.iloc[split_idx:].reset_index(drop=True)
            
            logger.info(f"✓ Train set size: {len(self.X_train)} samples")
            logger.info(f"✓ Test set size: {len(self.X_test)} samples")
            
            # Feature scaling
            logger.info("Scaling features...")
            self.scaler = StandardScaler()
            X_train_scaled = self.scaler.fit_transform(self.X_train)
            self.X_train = pd.DataFrame(
                X_train_scaled,
                columns=self.feature_names
            )
            
            X_test_scaled = self.scaler.transform(self.X_test)
            self.X_test = pd.DataFrame(
                X_test_scaled,
                columns=self.feature_names
            )
            
            logger.info("✓ Features scaled using StandardScaler")
            
            return True
        
        except Exception as e:
            logger.error(f"Feature preparation error: {str(e)}")
            return False
    
    def train_model(self):
        """Train XGBoost model with hyperparameter tuning."""
        try:
            logger.info("\n" + "=" * 60)
            logger.info("MODEL TRAINING")
            logger.info("=" * 60)
            
            logger.info("Initializing XGBoost regressor...")
            
            # Base XGBoost model
            xgb_model = XGBRegressor(
                objective="reg:squarederror",
                random_state=42,
                n_jobs=-1,
                verbosity=0,
            )
            
            # Hyperparameter tuning with GridSearchCV
            logger.info("Starting hyperparameter tuning...")
            param_grid = {
                "n_estimators": [100, 200],
                "max_depth": [4, 6, 8],
                "learning_rate": [0.01, 0.05],
                "subsample": [0.8, 1.0],
            }
            
            grid_search = GridSearchCV(
                xgb_model,
                param_grid,
                cv=3,
                scoring="r2",
                n_jobs=-1,
                verbose=1,
            )
            
            logger.info("Training model with grid search...")
            grid_search.fit(self.X_train, self.y_train)
            
            self.model = grid_search.best_estimator_
            best_params = grid_search.best_params_
            best_score = grid_search.best_score_
            
            logger.info("✓ Model training complete")
            logger.info(f"✓ Best CV R² Score: {best_score:.4f}")
            logger.info(f"✓ Best Parameters:")
            for param, value in best_params.items():
                logger.info(f"    {param}: {value}")
            
            return True
        
        except Exception as e:
            logger.error(f"Model training error: {str(e)}")
            return False
    
    def evaluate_model(self):
        """Evaluate model performance."""
        try:
            logger.info("\n" + "=" * 60)
            logger.info("MODEL EVALUATION")
            logger.info("=" * 60)
            
            # Training predictions
            y_train_pred = self.model.predict(self.X_train)
            
            # Test predictions
            y_test_pred = self.model.predict(self.X_test)
            
            # Calculate metrics
            train_mae = mean_absolute_error(self.y_train, y_train_pred)
            test_mae = mean_absolute_error(self.y_test, y_test_pred)
            
            train_rmse = np.sqrt(mean_squared_error(self.y_train, y_train_pred))
            test_rmse = np.sqrt(mean_squared_error(self.y_test, y_test_pred))
            
            train_r2 = r2_score(self.y_train, y_train_pred)
            test_r2 = r2_score(self.y_test, y_test_pred)
            
            # Log results
            logger.info("Training Set Metrics:")
            logger.info(f"  MAE:  {train_mae:.4f}")
            logger.info(f"  RMSE: {train_rmse:.4f}")
            logger.info(f"  R²:   {train_r2:.4f}")
            
            logger.info("Test Set Metrics (PRIMARY):")
            logger.info(f"  MAE:  {test_mae:.4f}")
            logger.info(f"  RMSE: {test_rmse:.4f}")
            logger.info(f"  R²:   {test_r2:.4f}")
            
            # Feature importance
            logger.info("\nFeature Importance (Top 10):")
            feature_importance = pd.DataFrame({
                "feature": self.feature_names,
                "importance": self.model.feature_importances_
            }).sort_values("importance", ascending=False)
            
            for idx, row in feature_importance.head(10).iterrows():
                logger.info(f"  {row['feature']}: {row['importance']:.4f}")
            
            return {
                "mae": test_mae,
                "rmse": test_rmse,
                "r2": test_r2,
                "train_samples": len(self.X_train),
                "test_samples": len(self.X_test),
            }
        
        except Exception as e:
            logger.error(f"Model evaluation error: {str(e)}")
            return None
    
    def save_artifacts(self, metrics: dict):
        """Save trained model and artifacts."""
        try:
            logger.info("\n" + "=" * 60)
            logger.info("SAVING ARTIFACTS")
            logger.info("=" * 60)
            
            # Save model
            model_path = os.path.join(self.output_dir, "model.pkl")
            joblib.dump(self.model, model_path)
            logger.info(f"✓ Model saved to: {model_path}")
            
            # Save scaler
            scaler_path = os.path.join(self.output_dir, "scaler.pkl")
            joblib.dump(self.scaler, scaler_path)
            logger.info(f"✓ Scaler saved to: {scaler_path}")
            
            # Save feature names
            features_path = os.path.join(self.output_dir, "features.pkl")
            joblib.dump(self.feature_names, features_path)
            logger.info(f"✓ Features saved to: {features_path}")
            
            # Save metrics to JSON
            import json
            metrics_path = os.path.join(self.output_dir, "metrics.json")
            metrics_with_timestamp = {
                **metrics,
                "timestamp": datetime.utcnow().isoformat(),
            }
            
            with open(metrics_path, "w") as f:
                json.dump(metrics_with_timestamp, f, indent=2)
            
            logger.info(f"✓ Metrics saved to: {metrics_path}")
            
            # Save training summary
            summary_path = os.path.join(self.output_dir, "training_summary.txt")
            with open(summary_path, "w") as f:
                f.write("DemandIQ Model Training Summary\n")
                f.write("=" * 60 + "\n\n")
                f.write(f"Training Date: {datetime.utcnow()}\n")
                f.write(f"Model Type: XGBoost Regressor\n")
                f.write(f"Features: {len(self.feature_names)}\n")
                f.write(f"Training Samples: {metrics['train_samples']}\n")
                f.write(f"Test Samples: {metrics['test_samples']}\n\n")
                f.write("Test Set Metrics:\n")
                f.write(f"  MAE:  {metrics['mae']:.4f}\n")
                f.write(f"  RMSE: {metrics['rmse']:.4f}\n")
                f.write(f"  R²:   {metrics['r2']:.4f}\n")
            
            logger.info(f"✓ Summary saved to: {summary_path}")
            logger.info("=" * 60)
            logger.info("✓ All artifacts saved successfully!")
            logger.info("=" * 60)
            
            return True
        
        except Exception as e:
            logger.error(f"Error saving artifacts: {str(e)}")
            return False
    
    def run(self):
        """Run complete training pipeline."""
        try:
            if not self.load_data():
                return False
            
            if not self.preprocess_data():
                return False
            
            if not self.feature_engineering():
                return False
            
            if not self.prepare_features():
                return False
            
            if not self.train_model():
                return False
            
            metrics = self.evaluate_model()
            if not metrics:
                return False
            
            if not self.save_artifacts(metrics):
                return False
            
            logger.info("\n" + "=" * 60)
            logger.info("✓ TRAINING PIPELINE COMPLETED SUCCESSFULLY!")
            logger.info("=" * 60)
            logger.info("Next steps:")
            logger.info("1. Start backend: python -m app.main")
            logger.info("2. Start frontend: cd frontend && npm run dev")
            logger.info("=" * 60)
            
            return True
        
        except Exception as e:
            logger.error(f"Pipeline error: {str(e)}", exc_info=True)
            return False


def main():
    """Main entry point."""
    
    # Get dataset path from command line or use default
    if len(sys.argv) > 1:
        data_path = sys.argv[1]
    else:
        # Default path assuming this script is run from project root
        data_path = "demand_forecasting_dataset (1).csv"
    
    if not os.path.exists(data_path):
        logger.error(f"Dataset not found: {data_path}")
        logger.error("Usage: python ml/train.py <path_to_dataset>")
        logger.error("Example: python ml/train.py demand_forcasting_dataset.csv")
        sys.exit(1)
    
    # Run training pipeline
    pipeline = DemandForecastingPipeline(
        data_path=data_path,
        output_dir="backend/app/ml"
    )
    
    success = pipeline.run()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
