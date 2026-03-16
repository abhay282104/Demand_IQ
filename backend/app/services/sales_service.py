import logging
from datetime import datetime, timedelta

import numpy as np
from pymongo.database import Database

from app.schemas.schemas import SalesDataResponse

logger = logging.getLogger(__name__)


class SalesService:
    """Service for handling sales data operations."""

    @staticmethod
    def _doc_to_sales_response(doc: dict) -> SalesDataResponse:
        return SalesDataResponse(
            date=doc.get("date"),
            historical_sales=float(doc.get("historical_sales", 0)),
            price=float(doc.get("price", 0)),
            promotion_flag=bool(doc.get("promotion_flag", False)),
            holiday_flag=bool(doc.get("holiday_flag", False)),
            economic_index=float(doc.get("economic_index", 0)),
            target_demand=float(doc.get("target_demand", 0)),
        )

    @staticmethod
    def get_sales_by_product(
        product_id: int, db: Database, days: int = 365
    ) -> list[SalesDataResponse]:
        """Get sales data for a specific product with index optimization."""
        start_date = datetime.utcnow() - timedelta(days=days)
        # Using sorted compound index: {product_id: 1, date: -1}
        sales = list(
            db.sales_data.find(
                {"product_id": product_id, "date": {"$gte": start_date.isoformat()}},
                {"_id": 0},
            ).sort([("product_id", 1), ("date", -1)]).hint("idx_sales_compound_query_v2")
        )
        return [SalesService._doc_to_sales_response(s) for s in sales]

    @staticmethod
    def get_sales_by_store(
        store_id: int, db: Database, days: int = 365
    ) -> list[SalesDataResponse]:
        """Get sales data for a specific store with index optimization."""
        start_date = datetime.utcnow() - timedelta(days=days)
        # Using trend index: {store_id: 1, date: -1}
        sales = list(
            db.sales_data.find(
                {"store_id": store_id, "date": {"$gte": start_date.isoformat()}},
                {"_id": 0},
            ).sort([("store_id", 1), ("date", -1)]).hint("idx_store_sales_trend")
        )
        return [SalesService._doc_to_sales_response(s) for s in sales]

    @staticmethod
    def get_promotion_impact(db: Database) -> dict:
        """Calculate promotion effectiveness."""
        grouped = list(
            db.sales_data.aggregate(
                [
                    {
                        "$group": {
                            "_id": "$promotion_flag",
                            "avg_demand": {"$avg": "$target_demand"},
                        }
                    }
                ]
            )
        )

        promo_sales = 0.0
        no_promo_sales = 0.0
        for row in grouped:
            if bool(row.get("_id")):
                promo_sales = float(row.get("avg_demand", 0.0))
            else:
                no_promo_sales = float(row.get("avg_demand", 0.0))

        promotion_lift = ((promo_sales - no_promo_sales) / (no_promo_sales + 1)) * 100

        return {
            "avg_demand_with_promotion": round(promo_sales, 2),
            "avg_demand_without_promotion": round(no_promo_sales, 2),
            "promotion_lift_percentage": round(promotion_lift, 2),
        }

    @staticmethod
    def get_price_sensitivity(db: Database) -> dict:
        """Analyze price sensitivity of demand."""
        sales = list(db.sales_data.find({}, {"price": 1, "target_demand": 1, "_id": 0}))

        if len(sales) < 2:
            return {
                "correlation": 0.0,
                "elasticity": 0.0,
                "avg_price": 0.0,
            }

        prices = np.array([float(s.get("price", 0.0)) for s in sales])
        demands = np.array([float(s.get("target_demand", 0.0)) for s in sales])

        correlation = float(np.corrcoef(prices, demands)[0, 1])
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
            },
        }

    @staticmethod
    def get_top_products(db: Database, limit: int = 10) -> list[dict]:
        """Return the top products by historical demand."""
        results = list(
            db.sales_data.aggregate(
                [
                    {
                        "$group": {
                            "_id": "$product_id",
                            "total_demand": {"$sum": "$target_demand"},
                            "avg_price": {"$avg": "$price"},
                        }
                    },
                    {"$sort": {"total_demand": -1}},
                    {"$limit": int(limit)},
                ]
            )
        )

        return [
            {
                "product_id": int(r.get("_id", 0)),
                "total_demand": float(r.get("total_demand", 0.0)),
                "avg_price": float(r.get("avg_price", 0.0)),
            }
            for r in results
        ]

    @staticmethod
    def load_sales_data(df, db: Database) -> dict:
        """Load sales data from DataFrame to MongoDB."""
        try:
            products = df[["product_id", "category_id"]].drop_duplicates(
                subset=["product_id"]
            )
            stores = df["store_id"].unique()

            for _, row in products.iterrows():
                db.products.update_one(
                    {"product_id": int(row["product_id"])},
                    {
                        "$setOnInsert": {
                            "product_id": int(row["product_id"]),
                            "category_id": int(row["category_id"]),
                            "created_at": datetime.utcnow(),
                        }
                    },
                    upsert=True,
                )

            for store_id in stores:
                db.stores.update_one(
                    {"store_id": int(store_id)},
                    {
                        "$setOnInsert": {
                            "store_id": int(store_id),
                            "created_at": datetime.utcnow(),
                        }
                    },
                    upsert=True,
                )

            sales_docs = []
            for _, row in df.iterrows():
                date_value = row["date"]
                if hasattr(date_value, "to_pydatetime"):
                    date_value = date_value.to_pydatetime()

                sales_docs.append(
                    {
                        "product_id": int(row["product_id"]),
                        "store_id": int(row["store_id"]),
                        "date": date_value,
                        "historical_sales": float(row["historical_sales"]),
                        "price": float(row["price"]),
                        "promotion_flag": bool(row["promotion_flag"]),
                        "holiday_flag": bool(row["holiday_flag"]),
                        "economic_index": float(row["economic_index"]),
                        "target_demand": float(row["target_demand"]),
                        "created_at": datetime.utcnow(),
                    }
                )

            if sales_docs:
                db.sales_data.insert_many(sales_docs)

            total_records = len(df)
            unique_products = len(products)
            unique_stores = len(stores)

            logger.info(
                f"Loaded {total_records} sales records, {unique_products} products, {unique_stores} stores"
            )

            return {
                "total_records": total_records,
                "unique_products": unique_products,
                "unique_stores": unique_stores,
                "status": "success",
            }

        except Exception as e:
            logger.error(f"Error loading sales data: {str(e)}")
            raise
