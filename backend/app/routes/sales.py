import logging

from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from app.database import get_db
from app.services import ModelService, SalesService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Sales"])


@router.get("/sales/{product_id}")
async def get_sales_by_product(
    product_id: int,
    days: int = 365,
    db: Database = Depends(get_db),
):
    """Get historical sales data for a product."""
    try:
        sales = SalesService.get_sales_by_product(product_id, db, days)

        if not sales:
            raise HTTPException(
                status_code=404,
                detail=f"No sales data found for product {product_id}",
            )

        return sales

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching sales: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching sales data: {str(e)}"
        )


@router.get("/store/{store_id}")
async def get_sales_by_store(
    store_id: int,
    days: int = 365,
    db: Database = Depends(get_db),
):
    """Get historical sales data for a store."""
    try:
        sales = SalesService.get_sales_by_store(store_id, db, days)

        if not sales:
            raise HTTPException(
                status_code=404,
                detail=f"No sales data found for store {store_id}",
            )

        return sales

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching sales: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching sales data: {str(e)}"
        )


@router.get("/products/top")
async def get_top_products(limit: int = 10, db: Database = Depends(get_db)):
    """Retrieve the top products by total historical demand."""
    try:
        products = SalesService.get_top_products(db, limit)
        return products
    except Exception as e:
        logger.error(f"Error fetching top products: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching top products: {str(e)}"
        )


@router.get("/dashboard/summary")
async def get_dashboard_summary(db: Database = Depends(get_db)):
    """Get dashboard summary with analytics."""
    try:
        hist_agg = list(
            db.sales_data.aggregate(
                [
                    {
                        "$group": {
                            "_id": None,
                            "total_historical_demand": {"$sum": "$target_demand"},
                            "average_price": {"$avg": "$price"},
                        }
                    }
                ]
            )
        )
        pred_agg = list(
            db.predictions.aggregate(
                [
                    {
                        "$group": {
                            "_id": None,
                            "predicted_demand": {"$sum": "$predicted_demand"},
                        }
                    }
                ]
            )
        )

        total_historical_demand = (
            float(hist_agg[0]["total_historical_demand"]) if hist_agg else 0.0
        )
        average_price = float(hist_agg[0]["average_price"]) if hist_agg else 0.0
        predicted_demand = float(pred_agg[0]["predicted_demand"]) if pred_agg else 0.0

        metrics = ModelService.get_latest_metrics(db)
        model_accuracy = float(metrics.get("r2_score", 0.0)) if metrics else 0.0

        total_products = db.products.count_documents({})
        total_stores = db.stores.count_documents({})
        total_predictions = db.predictions.count_documents({})

        promo_impact = SalesService.get_promotion_impact(db)
        price_sensitivity = SalesService.get_price_sensitivity(db)

        recent_sales = list(
            db.sales_data.find(
                {},
                {
                    "_id": 0,
                    "date": 1,
                    "product_id": 1,
                    "store_id": 1,
                    "historical_sales": 1,
                    "price": 1,
                    "promotion_flag": 1,
                    "holiday_flag": 1,
                    "economic_index": 1,
                    "target_demand": 1,
                },
            )
            .sort("date", -1)
            .limit(1000)
        )

        top_products = SalesService.get_top_products(db, limit=10)

        return {
            "metrics_summary": {
                "total_historical_demand": round(total_historical_demand, 2),
                "predicted_demand": round(predicted_demand, 2),
                "average_price": round(average_price, 2),
                "model_accuracy": round(model_accuracy, 4),
            },
            "total_products": total_products,
            "total_stores": total_stores,
            "total_predictions": total_predictions,
            "promotion_impact": promo_impact,
            "price_sensitivity": price_sensitivity,
            "sales_data": recent_sales,
            "top_products": top_products,
        }

    except Exception as e:
        logger.error(f"Error getting dashboard summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting summary: {str(e)}")
