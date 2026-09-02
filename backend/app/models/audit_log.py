from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from datetime import datetime, timezone
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, index=True)
    details = Column(JSON)
    severity = Column(String) # INFO / WARNING / ERROR / CRITICAL
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
