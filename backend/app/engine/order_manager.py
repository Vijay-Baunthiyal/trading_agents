import time
from app.schemas.schemas import SignalOutput, OrderResponse
from typing import Optional, List

class OrderManager:
    def __init__(self, broker, capital_ledger, risk_manager):
        self.broker = broker
        self.capital_ledger = capital_ledger
        self.risk_manager = risk_manager
        self.active_orders = []

    async def place_order(self, signal: SignalOutput, current_price: float, atr_value: float) -> Optional[OrderResponse]:
        sl = self.risk_manager.calculate_stop_loss(current_price, signal.action, atr_value)
        tp = self.risk_manager.calculate_take_profit(current_price, signal.action)
        
        # Calculate max affordable quantity based on free margin
        free_margin = self.capital_ledger.free_margin
        leverage = self.capital_ledger._leverage_factor
        affordable_qty = int((free_margin * leverage) / current_price)
        
        if affordable_qty <= 0:
            return None
            
        # For scalping, maybe limit to a fixed quantity or based on risk (let's use max affordable up to a limit or just affordable)
        qty = max(1, affordable_qty // 4) # just using 25% of free margin per trade

        valid, msg = self.capital_ledger.validate_order(qty, current_price)
        if not valid:
            return None

        start_time = time.time()
        
        # Deduct margin
        self.capital_ledger.allocate_margin(signal.symbol, qty, current_price)
        
        try:
            resp = await self.broker.place_order(
                symbol=signal.symbol,
                side=signal.action,
                qty=qty,
                order_type="MARKET",
                price=current_price,
                trigger_price=None
            )

            payload = resp.model_dump() if hasattr(resp, "model_dump") else (resp if isinstance(resp, dict) else {})
            latency = (time.time() - start_time) * 1000
            broker_status = str(payload.get("status", "")).upper()
            if broker_status in {"REJECTED", "FAILED", "ERROR", "CANCELLED", "SKIPPED"}:
                self.capital_ledger.release_margin(signal.symbol, qty, current_price, 0.0)
                print(f"Order rejected for {signal.symbol}: {broker_status}")
                return None

            order = OrderResponse(
                id=None,
                trade_id=None,
                symbol=signal.symbol,
                side=signal.action,
                order_type="MARKET",
                quantity=qty,
                price=current_price,
                trigger_price=None,
                status=payload.get("status", "PLACED"),
                broker_order_id=payload.get("broker_order_id"),
                execution_latency_ms=latency,
                filled_price=payload.get("filled_price"),
                filled_at=payload.get("filled_at")
            )
            self.active_orders.append(order)
            return order
        except Exception as e:
            self.capital_ledger.release_margin(signal.symbol, qty, current_price, 0.0)
            print(f"Order placement failed: {e}")
            return None

    async def cancel_order(self, order_id: str) -> bool:
        res = await self.broker.cancel_order(order_id)
        if res:
            self.active_orders = [o for o in self.active_orders if o.broker_order_id != order_id]
        return res

    async def square_off_all(self, positions: list) -> List[dict]:
        results = []
        for pos in positions:
            opp_side = "SELL" if pos.side == "BUY" else "BUY"
            res = await self.broker.place_order(
                symbol=pos.symbol,
                side=opp_side,
                qty=pos.quantity,
                order_type="MARKET",
                price=0.0, 
                trigger_price=None
            )
            self.capital_ledger.release_margin(pos.symbol, pos.quantity, pos.entry_price, pos.pnl)
            results.append(res)
        return results

    def get_active_orders(self) -> List[OrderResponse]:
        return self.active_orders
