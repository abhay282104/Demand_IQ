from sqlalchemy.orm import declarative_base

Base = declarative_base()

from app.models.models import Product, Store, SalesData, Prediction, ModelMetrics

__all__ = ["Base", "Product", "Store", "SalesData", "Prediction", "ModelMetrics"]
