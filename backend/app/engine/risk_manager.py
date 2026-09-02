from datetime import datetime
import pytz
from app.config import Settings
from app.schemas.schemas import SignalOutput
from typing import Tuple

class RiskManager:
    def __init__(self, config: Settings):
        self.config = config

    def calculate_stop_loss(self, entry_price: float, side: str, atr_value: float) -> float:
        # Use config SL_PCT or ATR based SL (fallback to SL_PCT if ATR is small)
        sl_dist = entry_price * (self.config.SL_PCT / 100.0)
        atr_dist = atr_value * 1.5 if atr_value else sl_dist
        dist = max(sl_dist, atr_dist)
        
        if side.upper() == "BUY":
            return entry_price - dist
        else:
            return entry_price + dist

    def calculate_take_profit(self, entry_price: float, side: str) -> float:
        dist = entry_price * (self.config.TP_PCT / 100.0)
        if side.upper() == "BUY":
            return entry_price + dist
        else:
            return entry_price - dist

    def update_trailing_sl(self, current_price: float, current_sl: float, side: str) -> float:
        trail_dist = current_price * (self.config.SL_PCT / 100.0)
        if side.upper() == "BUY":
            new_sl = current_price - trail_dist
            return max(current_sl, new_sl)
        else:
            new_sl = current_price + trail_dist
            return min(current_sl, new_sl)

    def check_circuit_breakers(self, daily_pnl: float, consecutive_losses: int, total_capital: float) -> Tuple[bool, str]:
        if consecutive_losses >= self.config.MAX_CONSECUTIVE_LOSSES:
            return True, f"Max consecutive losses ({self.config.MAX_CONSECUTIVE_LOSSES}) reached."
        
        loss_pct = (daily_pnl / total_capital) * 100.0
        if loss_pct <= -self.config.MAX_DAILY_LOSS_PCT:
            return True, f"Max daily loss percentage ({self.config.MAX_DAILY_LOSS_PCT}%) reached."
            
        return False, "Circuit breakers clear."

    def should_square_off_eod(self) -> bool:
        tz = pytz.timezone('Asia/Kolkata')
        now = datetime.now(tz)
        # Square off after 15:15 IST
        if now.hour > 15 or (now.hour == 15 and now.minute >= 15):
            return True
        return False

    def validate_signal(self, signal: SignalOutput) -> Tuple[bool, str]:
        if signal.action == "HOLD":
            return False, "Signal is HOLD."
        if signal.confidence_score < self.config.MIN_CONFIDENCE_SCORE:
            return False, f"Confidence {signal.confidence_score} below threshold {self.config.MIN_CONFIDENCE_SCORE}."
        return True, "Signal valid."
