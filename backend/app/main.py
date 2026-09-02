from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_db, async_session_maker
from app.config import settings
from app.engine.trading_engine import TradingEngine
from app.broker.fyers import FyersBroker
from app.api import account, trade, sandbox, timetravel
from app.ws.live_feed import router as ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()

    app.state.fyers_configured = bool(settings.FYERS_CLIENT_ID and settings.FYERS_SECRET_KEY)
    app.state.fyers_connected = False
    app.state.fyers_error = None

    if not app.state.fyers_configured:
        app.state.fyers_error = "Fyers credentials are not configured yet. Complete the OAuth flow from the app UI."
        app.state.trading_engine = None
        app.state.broker = None
        yield
        return

    broker = FyersBroker()
    app.state.broker = broker
    connected = await broker.connect()
    if not connected:
        app.state.fyers_connected = False
        app.state.fyers_error = "Unable to connect to Fyers. Check your credentials, access token, and network connectivity."
        app.state.trading_engine = None
        yield
        await broker.disconnect()
        return

    app.state.fyers_connected = True
    app.state.fyers_error = None
    engine = TradingEngine(settings, broker, async_session_maker)
    app.state.trading_engine = engine

    await engine.start()

    yield

    await engine.stop()
    await broker.disconnect()

app = FastAPI(title="AutoBot Trading Engine", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(account.router)
app.include_router(trade.router)
app.include_router(sandbox.router)
app.include_router(timetravel.router)
app.include_router(ws_router)

@app.get("/")
def root():
    return {
        "status": "running",
        "name": "AutoBot Trading Engine",
        "fyers_connected": getattr(app.state, "fyers_connected", False),
        "fyers_configured": getattr(app.state, "fyers_configured", False),
        "fyers_error": getattr(app.state, "fyers_error", None),
    }
