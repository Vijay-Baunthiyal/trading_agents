from fastapi import APIRouter, Request, Query
from typing import List, Optional
from datetime import datetime
from app.schemas.schemas import TradeRequest, TradeResponse, SignalOutput

router = APIRouter(prefix="/api/v1/trade", tags=["trade"])

@router.post("/execute", response_model=TradeResponse)
async def execute_trade(request: Request, trade_req: TradeRequest):
    engine = request.app.state.trading_engine
    
    # Fake signal for manual trade to reuse order_manager logic
    signal = SignalOutput(
        action=trade_req.side,
        symbol=trade_req.symbol,
        confidence_score=1.0,
        rationale="Manual Execution"
    )
    
    price = trade_req.price or engine.current_prices.get(trade_req.symbol, 1000.0)
    
    order = await engine.order_manager.place_order(signal, price, 0.0)
    if not order:
        return {"error": "Failed to place order"}
        
    pos = TradeResponse(
        id=len(engine.positions) + 1,
        symbol=trade_req.symbol,
        side=trade_req.side,
        quantity=order.quantity,
        entry_price=order.price,
        exit_price=None,
        stop_loss=price * 0.95 if trade_req.side == "BUY" else price * 1.05,
        take_profit=price * 1.05 if trade_req.side == "BUY" else price * 0.95,
        status="OPEN",
        ai_confidence=1.0,
        ai_rationale="Manual Execution",
        entry_time=datetime.now(),
        exit_time=None,
        pnl=0.0,
        execution_latency_ms=None,
    )
    engine.positions.append(pos)
    return pos

@router.post("/squareoff-all")
async def squareoff_all(request: Request):
    engine = request.app.state.trading_engine
    await engine.order_manager.square_off_all(engine.positions)
    count = len(engine.positions)
    engine.positions = []
    return {"status": "success", "closed_positions": count}

@router.get("/history", response_model=List[TradeResponse])
async def get_history(request: Request, symbol: Optional[str] = None, from_date: Optional[datetime] = None, to_date: Optional[datetime] = None, limit: int = 100):
    # Stub: return empty as DB integration for history wasn't fully detailed in prompt, but we return a list.
    return []

@router.get("/active", response_model=List[TradeResponse])
async def get_active(request: Request):
    engine = request.app.state.trading_engine
    return engine.positions
