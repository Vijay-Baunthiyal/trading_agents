from app.schemas.schemas import SimulationConfig, SimulationResult, TradeResponse, Point
from app.engine.capital_ledger import CapitalLedger
from app.engine.indicators import IndicatorEngine
from app.engine.signal_generator import RuleBasedSignalGenerator
from app.engine.risk_manager import RiskManager
from app.config import Settings
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

class BacktestEngine:
    def __init__(self, config: SimulationConfig):
        self.config = config
        
        app_settings = Settings(
            INITIAL_CAPITAL=config.initial_capital,
            LEVERAGE_FACTOR=config.leverage,
            MIN_CONFIDENCE_SCORE=config.confidence_threshold,
            SL_PCT=config.sl_pct,
            TP_PCT=config.tp_pct
        )
        self.ledger = CapitalLedger(config.initial_capital, config.leverage)
        self.indicators = IndicatorEngine()
        self.signal_gen = RuleBasedSignalGenerator(config.confidence_threshold)
        self.risk_manager = RiskManager(app_settings)
        
    async def run(self) -> SimulationResult:
        from app.broker.fyers import FyersBroker

        broker = FyersBroker()
        connected = await broker.connect()
        if not connected:
            raise RuntimeError("Sandbox backtesting requires a live Fyers connection.")

        try:
            from_date = self.config.start_date
            to_date = self.config.end_date
            if self.config.use_latest_data:
                to_date = datetime.now()
                lookback_days = 180 if self.config.interval in {"D", "1D", "1W", "1M"} else 10 if self.config.interval == "60" else 3
                from_date = to_date - timedelta(days=lookback_days)

            candles = await broker.get_historical_candles(
                self.config.symbol,
                self.config.interval,
                from_date,
                to_date,
            )
            if not candles:
                raise RuntimeError("No historical data returned from Fyers for this symbol.")

            df = pd.DataFrame([
                {
                    "timestamp": candle.timestamp,
                    "symbol": candle.symbol,
                    "open": candle.open,
                    "high": candle.high,
                    "low": candle.low,
                    "close": candle.close,
                    "volume": candle.volume,
                }
                for candle in candles
            ])
            df = (
                df.dropna(subset=["timestamp"])
                .sort_values("timestamp")
                .drop_duplicates(subset=["timestamp"], keep="last")
                .reset_index(drop=True)
            )
        finally:
            await broker.disconnect()

        trades = []
        equity_curve = []
        fund_audit_log = []

        current_pos = None

        for i in range(len(df)):
            sub_df = df.iloc[:i+1]
            if len(sub_df) < 50:
                continue

            row = sub_df.iloc[-1]
            inds = self.indicators.update(sub_df)
            signal = self.signal_gen.generate(inds, self.config.symbol)
            signal_valid, _ = self.risk_manager.validate_signal(signal)

            price = row['close']

            if current_pos:
                is_exit = False
                if current_pos.side == "BUY":
                    if price <= current_pos.stop_loss or price >= current_pos.take_profit:
                        is_exit = True
                else:
                    if price >= current_pos.stop_loss or price <= current_pos.take_profit:
                        is_exit = True

                if is_exit:
                    pnl = (price - current_pos.entry_price) * current_pos.quantity if current_pos.side == "BUY" else (current_pos.entry_price - price) * current_pos.quantity
                    self.ledger.release_margin(self.config.symbol, current_pos.quantity, current_pos.entry_price, pnl)
                    current_pos.status = "CLOSED"
                    current_pos.exit_price = float(price)
                    current_pos.exit_time = row['timestamp']
                    current_pos.pnl = float(pnl)
                    trades.append(current_pos)
                    current_pos = None
                    fund_audit_log.append({
                        "timestamp": row['timestamp'],
                        "event": "POSITION_CLOSED",
                        "amount": float(pnl),
                        "balance": float(self.ledger.total_balance)
                    })

            if not current_pos and signal_valid:
                qty = int((self.ledger.free_margin * self.config.leverage) / price)
                qty = max(1, qty // 4)

                if self.ledger.allocate_margin(self.config.symbol, qty, price):
                    sl = self.risk_manager.calculate_stop_loss(price, signal.action, inds.get("atr_14", 0.0))
                    tp = self.risk_manager.calculate_take_profit(price, signal.action)
                    current_pos = TradeResponse(
                        id=len(trades)+1,
                        symbol=self.config.symbol,
                        side=signal.action,
                        quantity=qty,
                        entry_price=price,
                        exit_price=None,
                        stop_loss=sl,
                        take_profit=tp,
                        status="OPEN",
                        ai_confidence=signal.confidence_score,
                        ai_rationale=signal.rationale,
                        entry_time=row['timestamp'],
                        exit_time=None,
                        pnl=0.0,
                    )
                    fund_audit_log.append({
                        "timestamp": row['timestamp'],
                        "event": "POSITION_OPENED",
                        "amount": float(-(qty * price)),
                        "balance": float(self.ledger.total_balance)
                    })

            if i % 100 == 0:
                equity_curve.append(Point(timestamp=row['timestamp'], balance=self.ledger.total_balance))

        win_rate = 0.5
        total_pnl = self.ledger._realized_pnl

        trades = trades[-200:]
        equity_curve = equity_curve[-200:]
        fund_audit_log = fund_audit_log[-200:]

        return SimulationResult(
            trades=trades,
            total_pnl=total_pnl,
            win_rate=win_rate,
            max_drawdown=0.0,
            sharpe_ratio=0.0,
            equity_curve=equity_curve,
            fund_audit_log=fund_audit_log
        )
