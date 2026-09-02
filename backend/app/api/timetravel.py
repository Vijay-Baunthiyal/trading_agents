from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from app.schemas.schemas import TimeTravelSnapshot, Point, CandleData

IST = ZoneInfo("Asia/Kolkata")
from app.broker.fyers import FyersBroker
from app.config import settings

router = APIRouter(prefix="/api/v1/time-travel", tags=["timetravel"])

@router.get("/live-candles")
async def get_live_candles(
    symbol: str = Query(..., description="Trading symbol"),
    interval: str = Query("1", description="Candle interval in minutes"),
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to")
):
    """Fetch live market candles from Fyers only."""
    if not settings.FYERS_CLIENT_ID or not settings.FYERS_SECRET_KEY or not settings.FYERS_ACCESS_TOKEN:
        raise HTTPException(
            status_code=503,
            detail="Fyers live data is not configured. Set FYERS_CLIENT_ID, FYERS_SECRET_KEY, and FYERS_ACCESS_TOKEN.",
        )

    if not to_date:
        to_date = datetime.now()
    if not from_date:
        from_date = to_date - timedelta(days=7)

    try:
        broker = FyersBroker()
        connected = await broker.connect()
        if not connected:
            raise RuntimeError("Fyers broker connection failed")

        candles = await broker.get_historical_candles(symbol, interval, from_date, to_date)
        await broker.disconnect()

        if not candles:
            raise RuntimeError("No candle data returned from Fyers")

        def normalize_timestamp(ts):
            if not hasattr(ts, "isoformat"):
                return str(ts)
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            return ts.astimezone(IST).isoformat()

        return {
            "source": "fyers",
            "symbol": symbol,
            "interval": interval,
            "count": len(candles),
            "candles": [
                {
                    "symbol": candle.symbol,
                    "open": float(candle.open),
                    "high": float(candle.high),
                    "low": float(candle.low),
                    "close": float(candle.close),
                    "volume": int(candle.volume),
                    "timestamp": normalize_timestamp(candle.timestamp),
                }
                for candle in candles
            ],
            "fetched_at": datetime.now(IST).isoformat(),
            "status": "success",
            "message": f"✅ Fetched {len(candles)} candles from Fyers API",
        }
    except Exception as exc:
        print(f"Fyers broker error: {exc}")
        raise HTTPException(status_code=503, detail="Unable to fetch live Fyers data right now.") from exc

@router.get("/candles")
async def get_candles(symbol: str, interval: str = "1", from_date: datetime = Query(..., alias="from"), to_date: datetime = Query(..., alias="to")):
    if not settings.FYERS_CLIENT_ID or not settings.FYERS_SECRET_KEY or not settings.FYERS_ACCESS_TOKEN:
        raise HTTPException(
            status_code=503,
            detail="Fyers live data is not configured. Set FYERS_CLIENT_ID, FYERS_SECRET_KEY, and FYERS_ACCESS_TOKEN.",
        )

    try:
        broker = FyersBroker()
        connected = await broker.connect()
        if not connected:
            raise RuntimeError("Fyers broker connection failed")

        candles = await broker.get_historical_candles(symbol, interval, from_date, to_date)
        await broker.disconnect()
        def normalize_timestamp(ts):
            if not hasattr(ts, "isoformat"):
                return str(ts)
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            return ts.astimezone(IST).isoformat()

        return [
            {
                "symbol": candle.symbol,
                "open": candle.open,
                "high": candle.high,
                "low": candle.low,
                "close": candle.close,
                "volume": candle.volume,
                "timestamp": normalize_timestamp(candle.timestamp),
            }
            for candle in candles
        ]
    except Exception as exc:
        print(f"Fyers candle fetch failed: {exc}")
        raise HTTPException(status_code=503, detail="Unable to fetch live Fyers candle data.") from exc

@router.get("/snapshot", response_model=TimeTravelSnapshot)
async def get_snapshot(timestamp: datetime = Query(...)):
    # Stub: Would query DB. Returning empty mocked structure.
    return {
        "timestamp": timestamp,
        "account_state": {
            "total_balance": 10000.0,
            "allocated_margin": 0.0,
            "free_margin": 10000.0,
            "unrealized_pnl": 0.0,
            "realized_pnl": 0.0,
            "leverage_factor": 5.0
        },
        "positions": [],
        "trades": [],
        "system_logs": []
    }

@router.get("/equity-curve", response_model=List[Point])
async def get_equity_curve(from_date: datetime = Query(..., alias="from"), to_date: datetime = Query(..., alias="to")):
    return []

@router.get("/trade-log", response_model=List[dict])
async def get_trade_log(from_date: datetime = Query(..., alias="from"), to_date: datetime = Query(..., alias="to")):
    return []
