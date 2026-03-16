import logging
from typing import Generator

from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.database import Database
import certifi

from app.config import settings

logger = logging.getLogger(__name__)

_mongo_client: MongoClient | None = None


def get_mongo_client() -> MongoClient:
    """Return a singleton MongoDB client."""
    global _mongo_client
    if _mongo_client is None:
        if not settings.database_url:
            raise RuntimeError(
                "DATABASE_URL is not set. "
                "Add your MongoDB Atlas connection string to backend/.env:\n"
                "  DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority"
            )
        _mongo_client = MongoClient(settings.database_url, tlsCAFile=certifi.where())
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
    """Initialize MongoDB collections and indexes."""
    db = get_database()

    db.products.create_index(
        [("product_id", ASCENDING)], unique=True, name="idx_product_id"
    )
    db.stores.create_index([("store_id", ASCENDING)], unique=True, name="idx_store_id")

    db.sales_data.create_index([("date", DESCENDING)], name="idx_sales_date")
    db.sales_data.create_index([("product_id", ASCENDING)], name="idx_sales_product")
    db.sales_data.create_index([("store_id", ASCENDING)], name="idx_sales_store")
    db.sales_data.create_index(
        [("product_id", ASCENDING), ("store_id", ASCENDING), ("date", DESCENDING)],
        name="idx_sales_product_store_date",
    )

    db.predictions.create_index([("product_id", ASCENDING)], name="idx_pred_product")
    db.predictions.create_index([("store_id", ASCENDING)], name="idx_pred_store")
    db.predictions.create_index([("timestamp", DESCENDING)], name="idx_pred_timestamp")
    db.predictions.create_index([("user_id", ASCENDING)], name="idx_pred_user")

    db.users.create_index([("email", ASCENDING)], unique=True, name="idx_user_email")
    db.users.create_index(
        [("username", ASCENDING)], unique=True, name="idx_user_username"
    )
    db.users.create_index(
        [("reset_token", ASCENDING)], name="idx_user_reset_token", sparse=True
    )

    db.model_metrics.create_index(
        [("model_version", ASCENDING)], unique=True, name="idx_model_version"
    )
    db.model_metrics.create_index(
        [("trained_at", DESCENDING)], name="idx_model_trained_at"
    )

    logger.info("MongoDB initialized successfully")
