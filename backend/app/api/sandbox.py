from fastapi import APIRouter, Request
from app.schemas.schemas import SimulationConfig, SimulationResult
from app.backtesting.engine import BacktestEngine

router = APIRouter(prefix="/api/v1/sandbox", tags=["sandbox"])

@router.post("/run-simulation", response_model=SimulationResult)
async def run_simulation(config: SimulationConfig):
    engine = BacktestEngine(config)
    result = await engine.run()
    return result
