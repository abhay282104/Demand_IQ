from app.routes.predictions import router as predictions_router
from app.routes.sales import router as sales_router
from app.routes.health import router as health_router

__all__ = ["predictions_router", "sales_router", "health_router"]
