from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime, timezone
from app.database import Base

class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)
    side = Column(String) # BUY / SELL
    quantity = Column(Integer)
    entry_price = Column(Float)
    exit_price = Column(Float, nullable=True)
    entry_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    exit_time = Column(DateTime, nullable=True)
    stop_loss = Column(Float)
    take_profit = Column(Float)
    trailing_sl = Column(Float, nullable=True)
    status = Column(String) # OPEN / CLOSED / CANCELLED
    pnl = Column(Float, default=0.0)
    ai_confidence = Column(Float)
    ai_rationale = Column(Text)
    execution_latency_ms = Column(Float)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
