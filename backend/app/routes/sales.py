import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import SalesDataResponse
from app.services import SalesService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Sales"])


@router.get("/sales/{product_id}")
async def get_sales_by_product(
    product_id: int,
    days: int = 365,
    db: Session = Depends(get_db),
):
    """
    Get historical sales data for a product.
    
    Args:
        product_id: Product ID
        days: Number of days of history to retrieve (default 365)
        
    Returns:
        list: Sales data records
    """
    
    try:
        sales = SalesService.get_sales_by_product(product_id, db, days)
        
        if not sales:
            raise HTTPException(
                status_code=404,
                detail=f"No sales data found for product {product_id}"
            )
        
        return sales
    
    except Exception as e:
        logger.error(f"Error fetching sales: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching sales data: {str(e)}"
        )


@router.get("/store/{store_id}")
async def get_sales_by_store(
    store_id: int,
    days: int = 365,
    db: Session = Depends(get_db),
):
    """
    Get historical sales data for a store.
    
    Args:
        store_id: Store ID
        days: Number of days of history to retrieve (default 365)
        
    Returns:
        list: Sales data records
    """
    
    try:
        sales = SalesService.get_sales_by_store(store_id, db, days)
        
        if not sales:
            raise HTTPException(
                status_code=404,
                detail=f"No sales data found for store {store_id}"
            )
        
        return sales
    
    except Exception as e:
        logger.error(f"Error fetching sales: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching sales data: {str(e)}"
        )


@router.get("/products/top")
async def get_top_products(limit: int = 10, db: Session = Depends(get_db)):
    """
    Retrieve the top products by total historical demand.

    Args:
        limit: Maximum number of products to return (default 10)
    """
    try:
        products = SalesService.get_top_products(db, limit)
        return products
    except Exception as e:
        logger.error(f"Error fetching top products: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching top products: {str(e)}"
        )


@router.get("/dashboard/summary")
async def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Get dashboard summary with analytics.
    
    Returns:
        dict: Summary statistics and charts
    """
    
    try:
        from app.models.models import SalesData, Product, Store, Prediction
        from sqlalchemy import func
        
        # Get aggregate metrics
        total_historical_demand = db.query(
            func.sum(SalesData.target_demand)
        ).scalar() or 0
        
        predicted_demand = db.query(
            func.sum(Prediction.predicted_demand)
        ).scalar() or 0
        
        average_price = db.query(
            func.avg(SalesData.price)
        ).scalar() or 0
        
        # Calculate model accuracy (using R2 as proxy)
        from app.services import ModelService
        metrics = ModelService.get_latest_metrics(db)
        model_accuracy = metrics.r2_score if metrics else 0
        
        # Count records
        total_products = db.query(Product).count()
        total_stores = db.query(Store).count()
        total_predictions = db.query(Prediction).count()
        
        # Promotion impact
        promo_impact = SalesService.get_promotion_impact(db)
        
        # Price sensitivity
        price_sensitivity = SalesService.get_price_sensitivity(db)
        
        # Fetch recent sales_data for analytics charts (limit 1000)
        recent_sales = (
            db.query(SalesData)
            .order_by(SalesData.date.desc())
            .limit(1000)
            .all()
        )
        sales_list = [SalesDataResponse.from_orm(s).dict() for s in recent_sales]
        
        # Top products by demand
        top_products = SalesService.get_top_products(db, limit=10)
        
        return {
            "metrics_summary": {
                "total_historical_demand": round(float(total_historical_demand), 2),
                "predicted_demand": round(float(predicted_demand), 2),
                "average_price": round(float(average_price), 2),
                "model_accuracy": round(float(model_accuracy), 4),
            },
            "total_products": total_products,
            "total_stores": total_stores,
            "total_predictions": total_predictions,
            "promotion_impact": promo_impact,
            "price_sensitivity": price_sensitivity,
            # additional fields for frontend analytics
            "sales_data": sales_list,
            "top_products": top_products,
        }
    
    except Exception as e:
        logger.error(f"Error getting dashboard summary: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting summary: {str(e)}"
        )
