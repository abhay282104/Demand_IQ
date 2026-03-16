import sys
import logging
logging.basicConfig(level=logging.INFO)

from app.database import SessionLocal
from sqlalchemy import func
from app.models.models import SalesData, Prediction

db = SessionLocal()

print("Target Demand Sum:", db.query(func.sum(SalesData.target_demand)).scalar())

sales = db.query(SalesData).order_by(SalesData.date.desc()).limit(1000).all()
print("Sales count:", len(sales))

print("Predictions count:", db.query(Prediction).count())
