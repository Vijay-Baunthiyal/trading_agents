from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT_DIR = Path(__file__).resolve().parents[3]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from Flayers_Algo import extract_historical_data, format_symbol, get_fyers_client
from app.broker.base import BrokerAdapter
from app.config import settings
from app.schemas.schemas import CandleData, TickData


class FyersBroker(BrokerAdapter):
    def __init__(self):
        self.connected = False
        self.client = None
        self.active_symbols: List[str] = []

    def _ensure_client(self):
        if self.client is not None:
            return self.client

        client = get_fyers_client(
            access_token=settings.FYERS_ACCESS_TOKEN,
            client_id=settings.FYERS_CLIENT_ID,
            secret_key=settings.FYERS_SECRET_KEY,
            log_path=settings.FYERS_LOG_PATH,
        )
        self.client = client
        return client

    def _normalize_quote(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(payload, dict):
            return {}

        value = payload.get("v") or payload.get("data") or payload.get("quote") or payload.get("market")
        if isinstance(value, dict):
            payload = value

        ltp = payload.get("lp") or payload.get("ltp") or payload.get("last_price")
        return {
            "symbol": payload.get("symbol") or payload.get("s") or "",
            "ltp": float(ltp or 0.0),
            "open": float(payload.get("open") or payload.get("o") or 0.0),
            "high": float(payload.get("high") or payload.get("h") or 0.0),
            "low": float(payload.get("low") or payload.get("l") or 0.0),
            "close": float(payload.get("close") or payload.get("c") or 0.0),
            "volume": int(payload.get("volume") or payload.get("v") or 0),
        }

    async def connect(self):
        try:
            self._ensure_client()
            self.connected = True
            print("Fyers broker connected.")
            return True
        except Exception as exc:  # pragma: no cover - connection may not be configured in local dev
            self.connected = False
            print(f"Fyers broker connection skipped: {exc}")
            return False

    async def disconnect(self):
        self.connected = False
        self.client = None
        print("Fyers broker disconnected.")

    async def subscribe(self, symbols: List[str]):
        self.active_symbols = [format_symbol(symbol) for symbol in symbols]

    async def get_tick(self, symbol: str) -> TickData:
        if not self.connected or self.client is None:
            raise RuntimeError("Fyers broker is not connected.")

        quote_symbol = format_symbol(symbol)
        response = self.client.quotes({"symbols": quote_symbol})
        return self._tick_from_quote_response(response, symbol, quote_symbol)

    def _tick_from_quote_response(self, response: Any, symbol: str, quote_symbol: str) -> TickData:
        if not isinstance(response, dict) or response.get("s") != "ok":
            reason = response.get("message") or response.get("code") if isinstance(response, dict) else "invalid response"
            raise RuntimeError(f"Fyers quote request failed for {quote_symbol}: {reason}")

        quote_items = response.get("d")
        quote = quote_items[0] if isinstance(quote_items, list) and quote_items else {}
        if isinstance(quote, dict) and quote.get("s") not in (None, "ok"):
            reason = quote.get("message") or quote.get("errmsg") or quote.get("code") or "symbol rejected"
            raise RuntimeError(f"Fyers rejected quote for {quote_symbol}: {reason}")

        normalized = self._normalize_quote(quote)

        if not normalized.get("ltp"):
            raise ValueError(f"Fyers returned no last price for {quote_symbol}")

        now = datetime.now(timezone.utc)
        return TickData(
            symbol=symbol,
            ltp=float(normalized["ltp"]),
            open=float(normalized["open"] or normalized["ltp"]),
            high=float(normalized["high"] or normalized["ltp"]),
            low=float(normalized["low"] or normalized["ltp"]),
            close=float(normalized["close"] or normalized["ltp"]),
            volume=int(normalized["volume"] or 0),
            timestamp=now,
        )

    async def get_ticks(self, symbols: List[str]) -> List[TickData]:
        if not self.connected or self.client is None:
            raise RuntimeError("Fyers broker is not connected.")

        quote_symbols = [format_symbol(symbol) for symbol in symbols]
        response = self.client.quotes({"symbols": ",".join(quote_symbols)})
        if not isinstance(response, dict) or response.get("s") != "ok":
            reason = response.get("message") or response.get("code") if isinstance(response, dict) else "invalid response"
            raise RuntimeError(f"Fyers quote request failed: {reason}")

        quote_items = response.get("d")
        if not isinstance(quote_items, list):
            raise RuntimeError("Fyers quote response did not contain quote data")

        ticks = []
        requested_symbols = {format_symbol(symbol): symbol for symbol in symbols}
        for item in quote_items:
            if not isinstance(item, dict):
                continue
            quote_symbol = str(item.get("n") or item.get("symbol") or "")
            original_symbol = requested_symbols.get(quote_symbol)
            if not original_symbol:
                continue
            try:
                ticks.append(self._tick_from_quote_response({"s": "ok", "d": [item]}, original_symbol, quote_symbol))
            except (RuntimeError, ValueError, TypeError) as exc:
                print(f"Skipping invalid Fyers quote for {quote_symbol}: {exc}")
        return ticks

    async def place_order(self, symbol: str, side: str, qty: int, order_type: str, price: float, trigger_price: float = None) -> dict:
        if not self.connected or self.client is None:
            return {"status": "SKIPPED", "broker_order_id": None, "filled_price": None, "filled_at": None}

        payload = {
            "symbol": format_symbol(symbol),
            "qty": qty,
            "type": "2" if order_type == "MARKET" else "1",
            "side": "1" if side.upper() == "BUY" else "2",
            "productType": "1",
            "limitPrice": price,
            "stopPrice": trigger_price or 0,
            "validity": "DAY",
            "disclosedQty": 0,
            "offlineOrder": "False",
            "triggerPrice": trigger_price or 0,
        }

        response = self.client.place_order(payload)
        return {
            "status": response.get("s") if isinstance(response, dict) else "PLACED",
            "broker_order_id": response.get("id") if isinstance(response, dict) else None,
            "filled_price": price,
            "filled_at": datetime.now(timezone.utc),
        }

    async def cancel_order(self, order_id: str) -> bool:
        if not self.connected or self.client is None:
            return False
        response = self.client.cancel_order({"id": order_id})
        return bool(response)

    async def get_positions(self) -> list:
        if not self.connected or self.client is None:
            return []
        response = self.client.positions()
        return response.get("net_positions", []) if isinstance(response, dict) else []

    async def get_balance(self) -> dict:
        if not self.connected or self.client is None:
            return {"total": 0.0, "free": 0.0}
        response = self.client.funds()
        return response.get("funds", {}) if isinstance(response, dict) else {"total": 0.0, "free": 0.0}

    async def get_historical_candles(self, symbol: str, interval: str, from_date, to_date) -> List[CandleData]:
        if self.client is None:
            return []

        df = extract_historical_data(
            self.client,
            symbol,
            interval,
            from_date.strftime("%Y-%m-%d"),
            to_date.strftime("%Y-%m-%d"),
        )

        results: List[CandleData] = []
        for _, row in df.iterrows():
            results.append(
                CandleData(
                    symbol=symbol,
                    open=float(row["open"]),
                    high=float(row["high"]),
                    low=float(row["low"]),
                    close=float(row["close"]),
                    volume=int(row["vol"]),
                    timestamp=row["ts"],
                )
            )
        return results
