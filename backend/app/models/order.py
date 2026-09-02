from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime, timezone
from app.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    trade_id = Column(Integer, ForeignKey("trades.id"), nullable=True)
    symbol = Column(String, index=True)
    side = Column(String)
    order_type = Column(String) # MARKET / LIMIT / SL / SL-M
    quantity = Column(Integer)
    price = Column(Float)
    trigger_price = Column(Float, nullable=True)
    status = Column(String) # PENDING / PLACED / FILLED / REJECTED / CANCELLED
    broker_order_id = Column(String, nullable=True)
    execution_latency_ms = Column(Float, nullable=True)
    filled_price = Column(Float, nullable=True)
    filled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
