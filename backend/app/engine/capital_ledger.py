from app.schemas.schemas import AccountBalance
from typing import Tuple

class CapitalLedger:
    def __init__(self, initial_capital: float, leverage_factor: float):
        self._total_balance = initial_capital
        self._leverage_factor = leverage_factor
        self._allocated_margin = 0.0
        self._unrealized_pnl = 0.0
        self._realized_pnl = 0.0

    @property
    def total_balance(self) -> float:
        return self._total_balance + self._realized_pnl

    @property
    def allocated_margin(self) -> float:
        return self._allocated_margin

    @property
    def free_margin(self) -> float:
        return self.total_balance - self._allocated_margin

    @property
    def unrealized_pnl(self) -> float:
        return self._unrealized_pnl

    @property
    def realized_pnl(self) -> float:
        return self._realized_pnl

    def get_required_margin(self, quantity: int, price: float) -> float:
        return (quantity * price) / self._leverage_factor

    def validate_order(self, quantity: int, price: float) -> Tuple[bool, str]:
        req_margin = self.get_required_margin(quantity, price)
        if req_margin <= self.free_margin:
            return True, "Margin available"
        return False, f"Insufficient margin. Required: {req_margin}, Free: {self.free_margin}"

    def allocate_margin(self, symbol: str, quantity: int, price: float) -> bool:
        req_margin = self.get_required_margin(quantity, price)
        if req_margin <= self.free_margin:
            self._allocated_margin += req_margin
            return True
        return False

    def release_margin(self, symbol: str, quantity: int, price: float, pnl: float) -> None:
        req_margin = self.get_required_margin(quantity, price)
        self._allocated_margin = max(0.0, self._allocated_margin - req_margin)
        self._realized_pnl += pnl

    def update_unrealized_pnl(self, positions: list) -> None:
        pnl = 0.0
        for pos in positions:
            # pos is a TradeResponse object, not a dict
            pnl += pos.pnl if hasattr(pos, 'pnl') else (pos.get("pnl", 0.0) if isinstance(pos, dict) else 0.0)
        self._unrealized_pnl = pnl

    def get_state(self) -> AccountBalance:
        return AccountBalance(
            total_balance=self.total_balance,
            allocated_margin=self.allocated_margin,
            free_margin=self.free_margin,
            unrealized_pnl=self.unrealized_pnl,
            realized_pnl=self.realized_pnl,
            leverage_factor=self._leverage_factor
        )

    def to_snapshot(self) -> dict:
        return self.get_state().model_dump()
