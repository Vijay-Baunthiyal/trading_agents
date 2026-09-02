from sqlalchemy import Column, Integer, Float, DateTime
from datetime import datetime, timezone
from app.database import Base

class AccountSnapshot(Base):
    __tablename__ = "account_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    total_balance = Column(Float)
    allocated_margin = Column(Float)
    free_margin = Column(Float)
    unrealized_pnl = Column(Float)
    realized_pnl = Column(Float)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
