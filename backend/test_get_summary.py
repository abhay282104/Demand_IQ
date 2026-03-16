import sys
import logging

logging.basicConfig(level=logging.INFO)

from app.database import get_database

db = get_database()

agg = list(
    db.sales_data.aggregate(
        [{"$group": {"_id": None, "sum": {"$sum": "$target_demand"}}}]
    )
)
target_sum = agg[0]["sum"] if agg else 0
print("Target Demand Sum:", target_sum)

sales = list(db.sales_data.find({}, {"_id": 0}).sort("date", -1).limit(1000))
print("Sales count:", len(sales))

print("Predictions count:", db.predictions.count_documents({}))
