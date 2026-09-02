from abc import ABC, abstractmethod
from typing import List
from app.schemas.schemas import TickData, CandleData

class BrokerAdapter(ABC):
    @abstractmethod
    async def connect(self):
        pass

    @abstractmethod
    async def disconnect(self):
        pass

    @abstractmethod
    async def subscribe(self, symbols: List[str]):
        pass

    @abstractmethod
    async def get_tick(self, symbol: str) -> TickData:
        pass

    @abstractmethod
    async def place_order(self, symbol: str, side: str, qty: int, order_type: str, price: float, trigger_price: float = None) -> dict:
        pass

    @abstractmethod
    async def cancel_order(self, order_id: str) -> bool:
        pass

    @abstractmethod
    async def get_positions(self) -> list:
        pass

    @abstractmethod
    async def get_balance(self) -> dict:
        pass

    @abstractmethod
    async def get_historical_candles(self, symbol: str, interval: str, from_date, to_date) -> List[CandleData]:
        pass
