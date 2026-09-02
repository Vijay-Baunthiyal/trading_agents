import asyncio
import pandas as pd
from datetime import datetime
from app.config import Settings
from app.schemas.schemas import TickData, TradeResponse
from app.engine.indicators import IndicatorEngine
from app.engine.capital_ledger import CapitalLedger
from app.engine.risk_manager import RiskManager
from app.engine.order_manager import OrderManager
from app.engine.signal_generator import RuleBasedSignalGenerator

class TradingEngine:
    def __init__(self, config: Settings, broker, db_session_factory):
        self.config = config
        self.broker = broker
        self.db_session_factory = db_session_factory
        
        self.state = "IDLE"
        self.is_running = False
        self.positions = []
        self.completed_trades = []
        self.signal_events = []
        self.signal_sequence = 0
        self.daily_pnl = 0.0
        self.consecutive_losses = 0
        
        self.capital_ledger = CapitalLedger(config.INITIAL_CAPITAL, config.LEVERAGE_FACTOR)
        self.risk_manager = RiskManager(config)
        self.order_manager = OrderManager(self.broker, self.capital_ledger, self.risk_manager)
        self.indicator_engine = IndicatorEngine()
        self.signal_generator = RuleBasedSignalGenerator(config.MIN_CONFIDENCE_SCORE)
        
        self.market_data = {} # symbol -> DataFrame of candles
        self.latest_ticks = {}

    async def start(self):
        self.is_running = True
        self.state = "SCANNING"
        asyncio.create_task(self._main_loop())

    async def stop(self):
        self.is_running = False
        self.state = "STOPPED"
        await self.order_manager.square_off_all(self.positions)
        self.positions = []

    async def pause(self):
        self.state = "PAUSED"

    async def resume(self):
        self.state = "SCANNING"

    async def _main_loop(self):
        symbols = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK"]
        await self.broker.subscribe(symbols)
        
        while self.is_running:
            if self.state == "PAUSED":
                await asyncio.sleep(1)
                continue

            try:
                ticks = await self.broker.get_ticks(symbols)
                for tick in ticks:
                    self.latest_ticks[tick.symbol] = tick
                    await self._process_tick(tick)
                
                await self._check_positions()
                self.capital_ledger.update_unrealized_pnl(self.positions)
                await self._broadcast_state()
            except Exception as e:
                print(f"Error in main loop: {e}")
                
            await asyncio.sleep(1)

    async def _process_tick(self, tick: TickData):
        # Update candle DF
        sym = tick.symbol
        new_row = pd.DataFrame([{
            "timestamp": tick.timestamp,
            "open": tick.open,
            "high": tick.high,
            "low": tick.low,
            "close": tick.close,
            "volume": tick.volume
        }])
        
        if sym not in self.market_data:
            self.market_data[sym] = new_row
        else:
            self.market_data[sym] = pd.concat([self.market_data[sym], new_row]).tail(100)
            
        df = self.market_data[sym]
        indicators = self.indicator_engine.update(df)
        
        if not indicators:
            return
            
        signal = self.signal_generator.generate(indicators, sym)
        
        # Risk check
        halt, reason = self.risk_manager.check_circuit_breakers(self.daily_pnl, self.consecutive_losses, self.config.INITIAL_CAPITAL)
        if halt:
            print(f"Trading halted: {reason}")
            await self.pause()
            return
            
        valid, msg = self.risk_manager.validate_signal(signal)
        
        # Avoid duplicate positions on same symbol for simplicity in scalping
        has_pos = any(p.symbol == sym for p in self.positions)

        if signal.action != "HOLD":
            self.signal_sequence += 1
            self.signal_events.append({
                "id": f"{sym}-{self.signal_sequence}",
                "action": signal.action,
                "symbol": sym,
                "confidence_score": signal.confidence_score,
                "rationale": signal.rationale,
                "timestamp": tick.timestamp.isoformat(),
                "price": float(tick.ltp),
                "executed": False,
            })
            self.signal_events = self.signal_events[-100:]
        
        if valid and not has_pos:
            self.state = "EXECUTING"
            order = await self.order_manager.place_order(signal, tick.ltp, indicators.get("atr_14", 0.0))
            if order:
                self.signal_events[-1]["executed"] = True
                sl = self.risk_manager.calculate_stop_loss(tick.ltp, signal.action, indicators.get("atr_14", 0.0))
                tp = self.risk_manager.calculate_take_profit(tick.ltp, signal.action)
                pos = TradeResponse(
                    id=len(self.positions) + 1,
                    symbol=sym,
                    side=signal.action,
                    quantity=order.quantity,
                    entry_price=order.price,
                    exit_price=None,
                    stop_loss=sl,
                    take_profit=tp,
                    status="OPEN",
                    ai_confidence=signal.confidence_score,
                    ai_rationale=signal.rationale,
                    entry_time=tick.timestamp,
                    exit_time=None,
                    pnl=0.0,
                    execution_latency_ms=None,
                )
                self.positions.append(pos)
            self.state = "SCANNING"

    async def _check_positions(self):
        closed_positions = []
        for p in self.positions:
            tick = self.latest_ticks.get(p.symbol)
            if not tick: continue
            
            pnl = 0.0
            if p.side == "BUY":
                pnl = (tick.ltp - p.entry_price) * p.quantity
                if tick.ltp <= p.stop_loss or tick.ltp >= p.take_profit:
                    await self.order_manager.square_off_all([p])
                    closed_positions.append((p, pnl))
                else:
                    p.stop_loss = self.risk_manager.update_trailing_sl(tick.ltp, p.stop_loss, p.side)
            else:
                pnl = (p.entry_price - tick.ltp) * p.quantity
                if tick.ltp >= p.stop_loss or tick.ltp <= p.take_profit:
                    await self.order_manager.square_off_all([p])
                    closed_positions.append((p, pnl))
                else:
                    p.stop_loss = self.risk_manager.update_trailing_sl(tick.ltp, p.stop_loss, p.side)

        for p, pnl in closed_positions:
            self.positions.remove(p)
            self.completed_trades.append(p)
            self.daily_pnl += pnl
            if pnl < 0:
                self.consecutive_losses += 1
            else:
                self.consecutive_losses = 0

    async def _broadcast_state(self):
        # To be picked up by websockets
        pass

    def get_state(self) -> dict:
        return {
            "state": self.state,
            "is_running": self.is_running,
            "positions": self.positions,
            "daily_pnl": self.daily_pnl,
            "consecutive_losses": self.consecutive_losses,
            "signals": self.signal_events,
            "capital": self.capital_ledger.get_state().model_dump()
        }
