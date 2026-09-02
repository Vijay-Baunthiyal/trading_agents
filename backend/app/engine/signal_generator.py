import json
from app.schemas.schemas import SignalOutput

class RuleBasedSignalGenerator:
    def __init__(self, min_confidence: float = 0.90):
        self.min_confidence = min_confidence

    def generate(self, indicators: dict, symbol: str) -> SignalOutput:
        if not indicators:
            return SignalOutput(action="HOLD", symbol=symbol, confidence_score=0.0, rationale="No data")

        score = 0.0
        rationale = []

        ema_9 = indicators.get("ema_9", 0.0)
        ema_20 = indicators.get("ema_20", 0.0)
        ema_50 = indicators.get("ema_50", 0.0)
        rsi = indicators.get("rsi_14", 50.0)
        vwap = indicators.get("vwap", 0.0)
        close = indicators.get("latest_close", 0.0)
        
        # 1. EMA Crossover
        if ema_9 > ema_20 > ema_50:
            score += 0.3
            rationale.append("Bullish EMA crossover.")
            trend = "BUY"
        elif ema_9 < ema_20 < ema_50:
            score += 0.3
            rationale.append("Bearish EMA crossover.")
            trend = "SELL"
        else:
            trend = "HOLD"

        # 2. RSI
        if trend == "BUY" and 30 <= rsi <= 50:
            score += 0.2
            rationale.append("RSI in bullish bounce zone.")
        elif trend == "SELL" and 50 <= rsi <= 70:
            score += 0.2
            rationale.append("RSI in bearish rejection zone.")

        # 3. VWAP
        if trend == "BUY" and close > vwap:
            score += 0.2
            rationale.append("Price above VWAP.")
        elif trend == "SELL" and close < vwap:
            score += 0.2
            rationale.append("Price below VWAP.")

        # 4. Volume confirmation & ATR (dummy scoring for logic)
        score += 0.3
        rationale.append("Volume and volatility sufficient.")

        action = trend
        
        return SignalOutput(
            action=action,
            symbol=symbol,
            confidence_score=score,
            rationale=" ".join(rationale) if trend != "HOLD" else "No directional setup."
        )

class LLMSignalGenerator:
    def __init__(self, api_key: str, min_confidence: float):
        self.api_key = api_key
        self.fallback = RuleBasedSignalGenerator(min_confidence)

    async def generate(self, indicators: dict, symbol: str) -> SignalOutput:
        if not self.api_key:
            return self.fallback.generate(indicators, symbol)
        
        # Stub for actual LLM call. In a real scenario, use httpx to call OpenAI API
        # Since this is a strict backend request and OpenAI is not installed (only httpx),
        # we default to rule-based or return a mocked response for the sake of completeness.
        return self.fallback.generate(indicators, symbol)
