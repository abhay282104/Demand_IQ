import logging
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.config import settings

logger = logging.getLogger(__name__)

# Create SQLite engine with check_same_thread disabled for development
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
    poolclass=StaticPool if "sqlite" in settings.database_url else None,
    echo=settings.debug,
)

# Enable foreign keys for SQLite
if "sqlite" in settings.database_url:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """Dependency injection for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database with all tables and indexes."""
    from app.models import Base
    
    Base.metadata.create_all(bind=engine)
    
    # Create indexes
    with engine.connect() as connection:
        # Sales data indexes
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_data(date)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_sales_product ON sales_data(product_id)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_sales_store ON sales_data(store_id)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_sales_product_store ON sales_data(product_id, store_id)"))
        
        # Predictions indexes
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_pred_product ON predictions(product_id)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_pred_store ON predictions(store_id)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_pred_timestamp ON predictions(timestamp)"))
        
        connection.commit()
    
    logger.info("Database initialized successfully")
