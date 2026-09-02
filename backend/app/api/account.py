import os
import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from datetime import datetime
from app.config import settings
from app.schemas.schemas import AccountBalance, DashboardMetrics

router = APIRouter(prefix="/api/v1/account", tags=["account"])

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


def _persist_fyers_token(token: str) -> str:
    env_path = Path(__file__).resolve().parents[2] / ".env"
    env_path.parent.mkdir(parents=True, exist_ok=True)
    lines = env_path.read_text(encoding="utf-8").splitlines() if env_path.exists() else []

    updated = False
    new_lines = []
    for line in lines:
        if line.startswith("FYERS_ACCESS_TOKEN="):
            new_lines.append(f"FYERS_ACCESS_TOKEN={token}")
            updated = True        
        else:
            new_lines.append(line)

    if not updated:
        new_lines.append(f"FYERS_ACCESS_TOKEN={token}")

    env_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
    os.environ["FYERS_ACCESS_TOKEN"] = token
    settings.FYERS_ACCESS_TOKEN = token
    return token


@router.get("/balance", response_model=AccountBalance)
async def get_balance(request: Request):
    engine = request.app.state.trading_engine
    return engine.capital_ledger.get_state()

@router.get("/dashboard-metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(request: Request):
    engine = request.app.state.trading_engine
    if engine is None or not getattr(engine.broker, "connected", False):
        raise HTTPException(status_code=503, detail="Fyers is not connected.")

    funds = await engine.broker.get_balance()
    def find_balance(payload):
        if isinstance(payload, dict):
            for key in ("availableBalance", "available_balance", "equityAmount", "cash", "total"):
                if payload.get(key) is not None:
                    try:
                        return float(payload[key])
                    except (TypeError, ValueError):
                        pass
            for value in payload.values():
                result = find_balance(value)
                if result is not None:
                    return result
        elif isinstance(payload, list):
            for value in payload:
                result = find_balance(value)
                if result is not None:
                    return result
        return None

    account_balance = find_balance(funds) or 0.0

    today = datetime.now().date()
    closed_trades = [
        trade for trade in getattr(engine, "completed_trades", [])
        if trade.entry_time and trade.entry_time.date() == today
    ]
    active_trades = [
        trade for trade in engine.positions
        if trade.entry_time and trade.entry_time.date() == today
    ]
    all_trades = closed_trades + active_trades
    profitable_trades = [trade for trade in closed_trades if trade.pnl > 0]
    loss_trades = [trade for trade in closed_trades if trade.pnl < 0]

    return DashboardMetrics(
        account_balance=account_balance,
        active_trades=len(active_trades),
        executed_trades=len(all_trades),
        profitable_trades=len(profitable_trades),
        loss_trades=len(loss_trades),
        total_profit=sum(float(trade.pnl) for trade in profitable_trades),
        total_loss=sum(abs(float(trade.pnl)) for trade in loss_trades),
    )


@router.get("/fyers/login-url")
async def get_fyers_login_url():
    try:
        from Flayers_Algo import get_auth_url

        client_id = settings.FYERS_CLIENT_ID or os.getenv("FYERS_CLIENT_ID")
        secret_key = settings.FYERS_SECRET_KEY or os.getenv("FYERS_SECRET_KEY")
        redirect_uri = settings.FYERS_REDIRECT_URI or os.getenv("FYERS_REDIRECT_URI")

        if not client_id or not secret_key:
            raise HTTPException(status_code=400, detail="Fyers client ID and secret key are missing.")

        auth_url = get_auth_url(client_id, secret_key, redirect_uri)
        return {"auth_url": auth_url, "redirect_uri": redirect_uri}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not build the Fyers login URL: {exc}") from exc


@router.post("/fyers/complete-login")
async def complete_fyers_login(payload: dict):
    auth_code = str(payload.get("auth_code", "")).strip()
    if not auth_code:
        raise HTTPException(status_code=400, detail="auth_code is required.")

    try:
        from Flayers_Algo import generate_access_token

        token = generate_access_token(
            auth_code,
            settings.FYERS_CLIENT_ID,
            settings.FYERS_SECRET_KEY,
            settings.FYERS_REDIRECT_URI,
        )
        _persist_fyers_token(token)
        return {
            "status": "success",
            "token_preview": f"{token[:12]}...",
            "message": "Fyers login completed and token saved to backend/.env",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Fyers login failed: {exc}") from exc
