import logging
from typing import Generator

from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.database import Database
import certifi

from app.config import settings

logger = logging.getLogger(__name__)

_mongo_client: MongoClient | None = None


def get_mongo_client() -> MongoClient:
    """Return a singleton MongoDB client with optimized connection pool."""
    global _mongo_client
    if _mongo_client is None:
        if not settings.database_url:
            raise RuntimeError(
                "DATABASE_URL is not set. "
                "Add your MongoDB Atlas connection string to backend/.env:\n"
                "  DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority"
            )
        # Optimized connection pool settings for production
        _mongo_client = MongoClient(
            settings.database_url,
            tlsCAFile=certifi.where(),
            maxPoolSize=100,
            minPoolSize=10,
            maxIdleTimeMS=60000,
            connectTimeoutMS=10000,
            socketTimeoutMS=20000,
            retryWrites=True,
            w="majority"
        )
    return _mongo_client


def get_database() -> Database:
    """Get the configured Mongo database instance."""
    client = get_mongo_client()
    return client[settings.database_name]


def get_db() -> Generator[Database, None, None]:
    """Dependency injection for Mongo database instance."""
    db = get_database()
    yield db


def init_db() -> None:
    """Initialize MongoDB collections and indexes for optimal performance."""
    db = get_database()

    # Product and Store Management
    db.products.create_index(
        [("product_id", ASCENDING)], unique=True, name="idx_product_unique"
    )
    db.products.create_index(
        [("category", ASCENDING)], name="idx_product_cat"
    )
    db.stores.create_index([("store_id", ASCENDING)], unique=True, name="idx_store_unique")

    # Time-Series Sales Data (Optimized for analysis)
    # Covering index for product-store performance queries
    db.sales_data.create_index(
        [("product_id", ASCENDING), ("store_id", ASCENDING), ("date", DESCENDING)],
        name="idx_sales_compound_query_v2"
    )
    db.sales_data.create_index([("date", DESCENDING)], name="idx_sales_timeseries")
    db.sales_data.create_index([("store_id", ASCENDING), ("date", DESCENDING)], name="idx_store_sales_trend")

    # Prediction Analytics
    db.predictions.create_index(
        [("user_id", ASCENDING), ("timestamp", DESCENDING)],
        name="idx_user_recent_predictions"
    )
    db.predictions.create_index([("product_id", ASCENDING)], name="idx_pred_product_lookup")
    db.predictions.create_index([("expiry_date", ASCENDING)], name="idx_pred_ttl", expireAfterSeconds=7776000) # 90 days TTL

    # User Authentication & Security
    db.users.create_index([("email", ASCENDING)], unique=True, name="idx_auth_email")
    db.users.create_index([("username", ASCENDING)], unique=True, name="idx_auth_user")
    db.users.create_index([("api_key", ASCENDING)], unique=True, sparse=True, name="idx_auth_apikey")

    # ML Ops Training History
    db.model_metrics.create_index(
        [("model_version", ASCENDING)], unique=True, name="idx_ml_version"
    )
    db.model_metrics.create_index(
        [("trained_at", DESCENDING)], name="idx_ml_history"
    )

    logger.info("MongoDB initialized with optimized performance indexes")
