from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from functools import lru_cache

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./autobot.db"
    INITIAL_CAPITAL: float = 10000.0
    LEVERAGE_FACTOR: float = 5.0
    MAX_DAILY_LOSS_PCT: float = 3.0
    MAX_CONSECUTIVE_LOSSES: int = 3
    MIN_CONFIDENCE_SCORE: float = 0.90
    SL_PCT: float = 0.5
    TP_PCT: float = 0.8
    OPENAI_API_KEY: Optional[str] = None
    BROKER_API_KEY: Optional[str] = None
    BROKER_SECRET: Optional[str] = None
    FYERS_CLIENT_ID: Optional[str] = None
    FYERS_SECRET_KEY: Optional[str] = None
    FYERS_REDIRECT_URI: str = "https://trade.fyers.in/api-login/redirect-uri/index.html"
    FYERS_ACCESS_TOKEN: Optional[str] = None
    FYERS_LOG_PATH: str = "."
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_CHAT_ID: Optional[str] = None
    DISCORD_WEBHOOK_URL: Optional[str] = None

    model_config = SettingsConfigDict(env_file=str(ENV_FILE), env_file_encoding="utf-8", extra="ignore")

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
