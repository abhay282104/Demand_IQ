import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
import numpy as np

from app.models.models import SalesData, Product, Store, Prediction
from app.schemas.schemas import SalesDataResponse

logger = logging.getLogger(__name__)


class SalesService:
    """Service for handling sales data operations."""
    
    @staticmethod
    def get_sales_by_product(
        product_id: int,
        db: Session,
        days: int = 365
    ) -> list[SalesDataResponse]:
        """Get sales data for a specific product."""
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        sales = db.query(SalesData).filter(
            SalesData.product_id == product_id,
            SalesData.date >= start_date
        ).order_by(SalesData.date.desc()).all()
        
        return [SalesDataResponse.from_orm(s) for s in sales]
    
    @staticmethod
    def get_sales_by_store(
        store_id: int,
        db: Session,
        days: int = 365
    ) -> list[SalesDataResponse]:
        """Get sales data for a specific store."""
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        sales = db.query(SalesData).filter(
            SalesData.store_id == store_id,
            SalesData.date >= start_date
        ).order_by(SalesData.date.desc()).all()
        
        return [SalesDataResponse.from_orm(s) for s in sales]
    
    @staticmethod
    def get_promotion_impact(db: Session) -> dict:
        """Calculate promotion effectiveness."""
        
        # Sales with promotion
        promo_sales = db.query(func.avg(SalesData.target_demand)).filter(
            SalesData.promotion_flag == True
        ).scalar() or 0
        
        # Sales without promotion
        no_promo_sales = db.query(func.avg(SalesData.target_demand)).filter(
            SalesData.promotion_flag == False
        ).scalar() or 0
        
        # Calculate lift
        promotion_lift = ((promo_sales - no_promo_sales) / (no_promo_sales + 1)) * 100
        
        return {
            "avg_demand_with_promotion": round(promo_sales, 2),
            "avg_demand_without_promotion": round(no_promo_sales, 2),
            "promotion_lift_percentage": round(promotion_lift, 2),
        }
    
    @staticmethod
    def get_price_sensitivity(db: Session) -> dict:
        """Analyze price sensitivity of demand."""
        
        # Get all sales with price and demand
        sales = db.query(SalesData.price, SalesData.target_demand).all()
        
        if len(sales) < 2:
            return {
                "correlation": 0.0,
                "elasticity": 0.0,
                "avg_price": 0.0,
            }
        
        prices = np.array([s[0] for s in sales])
        demands = np.array([s[1] for s in sales])
        
        # Calculate correlation
        correlation = float(np.corrcoef(prices, demands)[0, 1])
        
        # Calculate elasticity (simplified)
        price_change_pct = np.std(prices) / np.mean(prices) * 100
        demand_change_pct = np.std(demands) / np.mean(demands) * 100
        elasticity = demand_change_pct / (price_change_pct + 0.001)
        
        return {
            "correlation": round(float(correlation), 3),
            "elasticity": round(float(elasticity), 3),
            "avg_price": round(float(np.mean(prices)), 2),
            "price_range": {
                "min": round(float(np.min(prices)), 2),
                "max": round(float(np.max(prices)), 2),
            }
        }
    
    @staticmethod
    def get_top_products(db: Session, limit: int = 10) -> list[dict]:
        """Return the top products by historical demand.
        This aggregates sales_data by product and sorts descending.
        """
        results = (
            db.query(
                SalesData.product_id,
                func.sum(SalesData.target_demand).label("total_demand"),
                func.avg(SalesData.price).label("avg_price"),
            )
            .group_by(SalesData.product_id)
            .order_by(func.sum(SalesData.target_demand).desc())
            .limit(limit)
            .all()
        )
        return [
            {
                "product_id": r.product_id,
                "total_demand": float(r.total_demand),
                "avg_price": float(r.avg_price),
            }
            for r in results
        ]

    
    @staticmethod
    def load_sales_data(
        df,
        db: Session,
    ) -> dict:
        """Load sales data from DataFrame to database."""
        
        try:
            # Extract unique products and stores
            products = df[["product_id", "category_id"]].drop_duplicates(subset=["product_id"])
            stores = df["store_id"].unique()
            
            # Add products
            for _, row in products.iterrows():
                existing = db.query(Product).filter(
                    Product.product_id == int(row["product_id"])
                ).first()
                
                if not existing:
                    product = Product(
                        product_id=int(row["product_id"]),
                        category_id=int(row["category_id"])
                    )
                    db.add(product)
            
            db.commit()
            
            # Add stores
            for store_id in stores:
                existing = db.query(Store).filter(
                    Store.store_id == int(store_id)
                ).first()
                
                if not existing:
                    store = Store(store_id=int(store_id))
                    db.add(store)
            
            db.commit()
            
            # Add sales data
            for _, row in df.iterrows():
                sales_data = SalesData(
                    product_id=int(row["product_id"]),
                    store_id=int(row["store_id"]),
                    date=row["date"],
                    historical_sales=float(row["historical_sales"]),
                    price=float(row["price"]),
                    promotion_flag=bool(row["promotion_flag"]),
                    holiday_flag=bool(row["holiday_flag"]),
                    economic_index=float(row["economic_index"]),
                    target_demand=float(row["target_demand"]),
                )
                db.add(sales_data)
            
            db.commit()
            
            total_records = len(df)
            unique_products = len(products)
            unique_stores = len(stores)
            
            logger.info(
                f"Loaded {total_records} sales records, "
                f"{unique_products} products, {unique_stores} stores"
            )
            
            return {
                "total_records": total_records,
                "unique_products": unique_products,
                "unique_stores": unique_stores,
                "status": "success"
            }
        
        except Exception as e:
            logger.error(f"Error loading sales data: {str(e)}")
            db.rollback()
            raise
