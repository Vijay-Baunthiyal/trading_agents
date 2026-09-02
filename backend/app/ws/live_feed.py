from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import asyncio
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

@router.websocket("/ws/live-feed")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    engine = websocket.app.state.trading_engine
    
    try:
        while True:
            # Stream loop: every 1s send JSON with tick_data, active_positions, account_state, system_logs
            if engine.is_running:
                state = engine.get_state()
                msg = {
                    "account_state": state["capital"],
                    "active_positions": [p.model_dump() for p in engine.positions],
                    "signals": state.get("signals", []),
                    "system_logs": []
                }
                await manager.broadcast(msg)
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WS error: {e}")
        manager.disconnect(websocket)
