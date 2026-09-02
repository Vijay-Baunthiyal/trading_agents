import httpx
from app.config import Settings

class Alerter:
    def __init__(self, config: Settings):
        self.config = config

    async def send_telegram(self, message: str) -> bool:
        if not self.config.TELEGRAM_BOT_TOKEN or not self.config.TELEGRAM_CHAT_ID:
            return False
        
        url = f"https://api.telegram.org/bot{self.config.TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": self.config.TELEGRAM_CHAT_ID,
            "text": message
        }
        try:
            async with httpx.AsyncClient() as client:
                await client.post(url, json=payload)
            return True
        except Exception as e:
            print(f"Telegram alert failed: {e}")
            return False

    async def send_discord(self, message: str) -> bool:
        if not self.config.DISCORD_WEBHOOK_URL:
            return False
            
        payload = {"content": message}
        try:
            async with httpx.AsyncClient() as client:
                await client.post(self.config.DISCORD_WEBHOOK_URL, json=payload)
            return True
        except Exception as e:
            print(f"Discord alert failed: {e}")
            return False

    async def alert(self, event_type: str, message: str, severity: str = 'INFO'):
        full_msg = f"[{severity}] {event_type}: {message}"
        print(full_msg)
        
        await self.send_telegram(full_msg)
        await self.send_discord(full_msg)
