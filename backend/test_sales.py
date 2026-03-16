import sys
from app.database import SessionLocal
from app.models.models import SalesData

db = SessionLocal()
try:
    sales = db.query(SalesData).limit(5).all()
    print(f"Sales count: {len(sales)}")
    if sales:
        from app.schemas.schemas import SalesDataResponse
        for s in sales:
            try:
                print(SalesDataResponse.from_orm(s).dict())
            except Exception as outer_e:
                print(f"Error parsing: {outer_e}")
except Exception as e:
    print(f"Error: {e}")
