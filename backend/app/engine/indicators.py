import pandas as pd
import numpy as np

def calc_ema(series: pd.Series, period: int) -> pd.Series:
    return series.ewm(span=period, adjust=False).mean()

def calc_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def calc_vwap(high: pd.Series, low: pd.Series, close: pd.Series, volume: pd.Series) -> pd.Series:
    typical_price = (high + low + close) / 3
    return (typical_price * volume).cumsum() / volume.cumsum()

def calc_atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    tr1 = high - low
    tr2 = (high - close.shift()).abs()
    tr3 = (low - close.shift()).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.rolling(window=period).mean()

def calc_order_book_imbalance(bids: float, asks: float) -> float:
    if bids + asks == 0:
        return 0.0
    return (bids - asks) / (bids + asks)

class IndicatorEngine:
    def __init__(self):
        pass

    def update(self, candle_df: pd.DataFrame) -> dict:
        if len(candle_df) == 0:
            return {}
        
        close = candle_df['close']
        high = candle_df['high']
        low = candle_df['low']
        volume = candle_df['volume']

        ema_9 = calc_ema(close, 9).iloc[-1] if len(close) >= 9 else close.iloc[-1]
        ema_20 = calc_ema(close, 20).iloc[-1] if len(close) >= 20 else close.iloc[-1]
        ema_50 = calc_ema(close, 50).iloc[-1] if len(close) >= 50 else close.iloc[-1]
        
        rsi_14 = calc_rsi(close, 14).iloc[-1] if len(close) >= 15 else 50.0
        
        vwap = calc_vwap(high, low, close, volume).iloc[-1]
        
        atr_14 = calc_atr(high, low, close, 14).iloc[-1] if len(close) >= 15 else (high.iloc[-1] - low.iloc[-1])

        return {
            "ema_9": float(ema_9),
            "ema_20": float(ema_20),
            "ema_50": float(ema_50),
            "rsi_14": float(rsi_14),
            "vwap": float(vwap),
            "atr_14": float(atr_14),
            "latest_close": float(close.iloc[-1]),
            "latest_volume": int(volume.iloc[-1])
        }
