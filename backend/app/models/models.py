from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Index, ForeignKey
from sqlalchemy.orm import relationship
from app.models import Base


class Product(Base):
    """Product information table."""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, unique=True, nullable=False, index=True)
    category_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    sales_data = relationship("SalesData", back_populates="product")
    predictions = relationship("Prediction", back_populates="product")


class Store(Base):
    """Store information table."""
    __tablename__ = "stores"
    
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    sales_data = relationship("SalesData", back_populates="store")
    predictions = relationship("Prediction", back_populates="store")


class SalesData(Base):
    """Historical sales data table."""
    __tablename__ = "sales_data"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.product_id"), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.store_id"), nullable=False)
    date = Column(DateTime, nullable=False, index=True)
    historical_sales = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    promotion_flag = Column(Boolean, default=False)
    holiday_flag = Column(Boolean, default=False)
    economic_index = Column(Float, nullable=False)
    target_demand = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    product = relationship("Product", back_populates="sales_data")
    store = relationship("Store", back_populates="sales_data")
    
    # Indexes
    __table_args__ = (
        Index("idx_sales_product_store_date", "product_id", "store_id", "date"),
    )


class Prediction(Base):
    """Model predictions storage."""
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.product_id"), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.store_id"), nullable=False)
    predicted_demand = Column(Float, nullable=False)
    input_price = Column(Float, nullable=False)
    input_promotion = Column(Boolean, default=False)
    input_holiday = Column(Boolean, default=False)
    input_economic_index = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    model_version = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    product = relationship("Product", back_populates="predictions")
    store = relationship("Store", back_populates="predictions")


class ModelMetrics(Base):
    """Model performance metrics."""
    __tablename__ = "model_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    model_version = Column(String, unique=True, nullable=False)
    mae = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    r2_score = Column(Float, nullable=False)
    training_samples = Column(Integer, nullable=False)
    test_samples = Column(Integer, nullable=False)
    trained_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
