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


def safe_create_index(collection, keys, **kwargs) -> str:
    """Safely create an index, handling cases where it already exists with a different name."""
    try:
        return collection.create_index(keys, **kwargs)
    except Exception as e:
        # Check if the error is due to an existing index with a different name
        error_str = str(e)
        if "IndexOptionsConflict" in error_str or "Index already exists with a different name" in error_str:
            name = kwargs.get("name", "unknown")
            logger.warning(f"Index conflict for '{name}' on {keys}: {error_str}. Reusing existing index.")
            return "existing"
        logger.error(f"Failed to create index on {keys}: {error_str}")
        raise


def init_db() -> None:
    """Initialize MongoDB collections and indexes for optimal performance."""
    db = get_database()

    # Product and Store Management
    safe_create_index(db.products, [("product_id", ASCENDING)], unique=True, name="idx_product_id")
    safe_create_index(db.products, [("category", ASCENDING)], name="idx_product_cat")
    safe_create_index(db.stores, [("store_id", ASCENDING)], unique=True, name="idx_store_id")

    # Time-Series Sales Data (Optimized for analysis)
    safe_create_index(
        db.sales_data,
        [("product_id", ASCENDING), ("store_id", ASCENDING), ("date", DESCENDING)],
        name="idx_sales_product_store_date"
    )
    safe_create_index(db.sales_data, [("date", DESCENDING)], name="idx_sales_date")
    safe_create_index(db.sales_data, [("store_id", ASCENDING), ("date", DESCENDING)], name="idx_store_sales_trend")

    # Prediction Analytics
    safe_create_index(
        db.predictions,
        [("user_id", ASCENDING), ("timestamp", DESCENDING)],
        name="idx_user_recent_predictions"
    )
    safe_create_index(db.predictions, [("product_id", ASCENDING)], name="idx_pred_product")
    safe_create_index(
        db.predictions,
        [("expiry_date", ASCENDING)],
        name="idx_pred_ttl",
        expireAfterSeconds=7776000
    ) # 90 days TTL

    # User Authentication & Security
    safe_create_index(db.users, [("email", ASCENDING)], unique=True, name="idx_auth_email")
    safe_create_index(db.users, [("username", ASCENDING)], unique=True, name="idx_auth_user")
    safe_create_index(db.users, [("api_key", ASCENDING)], unique=True, sparse=True, name="idx_auth_apikey")

    # ML Ops Training History
    safe_create_index(db.model_metrics, [("model_version", ASCENDING)], unique=True, name="idx_ml_version")
    safe_create_index(db.model_metrics, [("trained_at", DESCENDING)], name="idx_ml_history")

    logger.info("MongoDB initialized with optimized performance indexes")
