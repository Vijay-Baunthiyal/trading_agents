# AutoBot — AI Scalping Trading Bot

## Overview
AI-driven intraday scalping system for Indian equity markets (NSE/BSE). Features a FastAPI trading engine with real-time WebSocket data, AI-powered signal generation, comprehensive risk management, and a React dashboard.

## Features
- 🤖 AI-powered trade signal generation (rule-based + optional LLM)
- 📊 Real-time candlestick charts with trade markers
- 💰 Capital & margin management with ₹10,000 starting capital (5x leverage)
- 🛡️ Automated risk controls (SL/TP, trailing SL, circuit breakers)
- ⏰ End-of-day auto square-off at 3:15 PM IST
- 🔄 Time-travel replay of historical trading sessions
- 🧪 Strategy sandbox with backtesting
- 🔔 Telegram/Discord notifications

## Architecture
```
autoBot/
├── backend/          # FastAPI + Python trading engine
│   ├── app/
│   │   ├── api/      # REST endpoints
│   │   ├── broker/   # Pluggable broker adapters
│   │   ├── engine/   # Trading engine core
│   │   ├── models/   # Database models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── ws/       # WebSocket handlers
│   │   └── backtesting/
│   └── data/         # Sample market data
├── frontend/         # React + TypeScript dashboard
│   └── src/
│       ├── pages/    # 3 main pages
│       ├── components/
│       ├── store/    # Zustand state
│       └── lib/      # API & WS clients
└── docker-compose.yml
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- (Optional) Docker & Docker Compose for PostgreSQL + Redis

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Docker (Optional)
```bash
docker-compose up -d  # Starts PostgreSQL + Redis
```

## API Documentation
Once the backend is running, visit http://localhost:8000/docs for interactive Swagger documentation.

### Key Endpoints
| Endpoint | Method | Description |
|---|---|---|
| /api/v1/account/balance | GET | Account balance & margin info |
| /api/v1/trade/execute | POST | Execute a trade |
| /api/v1/trade/squareoff-all | POST | Emergency close all positions |
| /api/v1/trade/history | GET | Historical trades |
| /api/v1/trade/active | GET | Active positions |
| /api/v1/sandbox/run-simulation | POST | Run backtest simulation |
| /api/v1/time-travel/snapshot | GET | Historical state snapshot |
| /ws/live-feed | WebSocket | Real-time market data stream |

## Configuration
All configuration is managed via environment variables in `backend/.env`.

| Variable | Default | Description |
|---|---|---|
| DATABASE_URL | sqlite+aiosqlite:///./autobot.db | Database connection |
| INITIAL_CAPITAL | 10000 | Starting capital in ₹ |
| LEVERAGE_FACTOR | 5 | Margin leverage multiplier |
| MAX_DAILY_LOSS_PCT | 3.0 | Circuit breaker threshold |
| MIN_CONFIDENCE_SCORE | 0.90 | Minimum AI signal confidence |
| SL_PCT | 0.5 | Default stop loss percentage |
| TP_PCT | 0.8 | Default take profit percentage |

## Dashboard Pages
1. **Live Command Center** — Real-time trading view with charts, metrics, and emergency controls
2. **Time-Travel Analytics** — Replay historical sessions with adjustable speed
3. **Strategy Sandbox** — Backtest strategies with paper trading

## License
MIT
