import sys
from app.database import get_database

db = get_database()

try:
    sales = list(db.sales_data.find({}, {"_id": 0}).limit(5))
    print(f"Sales count: {len(sales)}")
    for doc in sales:
        print(doc)
except Exception as e:
    print(f"Error: {e}")
