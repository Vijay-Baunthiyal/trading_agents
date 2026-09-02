from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class AccountBalance(BaseModel):
    total_balance: float
    allocated_margin: float
    free_margin: float
    unrealized_pnl: float
    realized_pnl: float
    leverage_factor: float

class DashboardMetrics(BaseModel):
    account_balance: float
    active_trades: int
    executed_trades: int
    profitable_trades: int
    loss_trades: int
    total_profit: float
    total_loss: float

class TickData(BaseModel):
    symbol: str
    ltp: float
    open: float
    high: float
    low: float
    close: float
    volume: int
    timestamp: datetime

class CandleData(BaseModel):
    symbol: str
    open: float
    high: float
    low: float
    close: float
    volume: int
    timestamp: datetime

class SignalOutput(BaseModel):
    action: str # BUY / SELL / HOLD
    symbol: str
    confidence_score: float
    target_price: Optional[float] = None
    stop_loss_price: Optional[float] = None
    rationale: str

class TradeRequest(BaseModel):
    symbol: str
    side: str
    quantity: int
    price: Optional[float] = None

class TradeResponse(BaseModel):
    id: Optional[int]
    symbol: str
    side: str
    quantity: int
    entry_price: float
    exit_price: Optional[float] = None
    stop_loss: float
    take_profit: float
    status: str
    ai_confidence: float
    ai_rationale: str
    entry_time: Optional[datetime] = None
    exit_time: Optional[datetime] = None
    pnl: float = 0.0
    execution_latency_ms: Optional[float] = None

class OrderResponse(BaseModel):
    id: Optional[int]
    trade_id: Optional[int]
    symbol: str
    side: str
    order_type: str
    quantity: int
    price: float
    trigger_price: Optional[float]
    status: str
    broker_order_id: Optional[str]
    execution_latency_ms: Optional[float]
    filled_price: Optional[float]
    filled_at: Optional[datetime]

class SimulationConfig(BaseModel):
    symbol: str
    start_date: datetime
    end_date: datetime
    interval: str = "1"
    use_latest_data: bool = True
    initial_capital: float = 10000.0
    leverage: float = 5.0
    confidence_threshold: float = 0.90
    sl_pct: float = 0.5
    tp_pct: float = 0.8

class Point(BaseModel):
    timestamp: datetime
    balance: float

class SimulationResult(BaseModel):
    trades: List[TradeResponse]
    total_pnl: float
    win_rate: float
    max_drawdown: float
    sharpe_ratio: float
    equity_curve: List[Point]
    fund_audit_log: List[Dict[str, Any]]

class SystemLog(BaseModel):
    timestamp: datetime
    level: str
    message: str
    details: Optional[Dict[str, Any]] = None

class TimeTravelSnapshot(BaseModel):
    timestamp: datetime
    account_state: AccountBalance
    positions: List[TradeResponse]
    trades: List[TradeResponse]
    system_logs: List[SystemLog]

class LiveFeedMessage(BaseModel):
    tick_data: Optional[TickData] = None
    active_positions: List[TradeResponse] = []
    account_state: AccountBalance
    system_logs: List[SystemLog] = []
