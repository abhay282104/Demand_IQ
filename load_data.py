#!/usr/bin/env python3
"""
DemandIQ - Data Loader Script

This script loads the CSV dataset into the SQLite database.
Run after training the model and starting the backend.

Usage:
    python load_data.py
"""

import sys
import logging
from pathlib import Path
import pandas as pd

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from app.database import SessionLocal, init_db
from app.services import SalesService
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_dataset(csv_path: str):
    """Load CSV dataset into database."""
    
    try:
        # Initialize database
        logger.info("Initializing database...")
        init_db()
        logger.info("✓ Database initialized")
        
        # Read CSV
        logger.info(f"Loading data from {csv_path}...")
        df = pd.read_csv(csv_path)
        
        # Convert date column
        df["date"] = pd.to_datetime(df["date"])
        
        logger.info(f"✓ Loaded {len(df)} records")
        logger.info(f"  Date range: {df['date'].min()} to {df['date'].max()}")
        
        # Load into database
        logger.info("Loading data into database...")
        db = SessionLocal()
        
        result = SalesService.load_sales_data(df, db)
        
        logger.info("✓ Data loaded successfully:")
        logger.info(f"  Total records: {result['total_records']}")
        logger.info(f"  Unique products: {result['unique_products']}")
        logger.info(f"  Unique stores: {result['unique_stores']}")
        
        db.close()
        
        return True
    
    except Exception as e:
        logger.error(f"Error loading data: {str(e)}", exc_info=True)
        return False


if __name__ == "__main__":
    csv_path = "demand_forecasting_dataset (1).csv"
    
    if not Path(csv_path).exists():
        logger.error(f"Dataset not found: {csv_path}")
        logger.error("Make sure the CSV file is in the project root directory")
        sys.exit(1)
    
    success = load_dataset(csv_path)
    sys.exit(0 if success else 1)
