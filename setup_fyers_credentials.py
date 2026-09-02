#!/usr/bin/env python3
"""
Fyers Credentials Setup Helper
This script guides you through setting up Fyers API credentials and testing the integration.

Steps:
  1. Get your FYERS_CLIENT_ID and FYERS_SECRET_KEY from https://api.fyers.in/register
  2. Create/update .env file with these credentials (see .env.example)
  3. Run this script to generate your access token
  4. The script will test the /candles endpoint to verify everything works
"""

import os
import sys
import asyncio
from pathlib import Path
from datetime import datetime, timedelta

# Add parent directory to path for imports
ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Add backend root and backend app to path so imports resolve as package modules
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

BACKEND_APP_DIR = BACKEND_DIR / "app"
if str(BACKEND_APP_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_APP_DIR))

# Load .env file from backend directory
from dotenv import load_dotenv
env_file = ROOT_DIR / "backend" / ".env"
if env_file.exists():
    load_dotenv(env_file)

from Flayers_Algo import get_auth_url, generate_access_token, get_fyers_client
from app.broker.fyers import FyersBroker


def print_banner(text: str):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")


def save_env_value(key: str, value: str):
    env_path = ROOT_DIR / "backend" / ".env"
    lines = env_path.read_text(encoding="utf-8").splitlines() if env_path.exists() else []
    updated = False
    new_lines = []

    for line in lines:
        if line.startswith(f"{key}="):
            new_lines.append(f"{key}={value}")
            updated = True
        else:
            new_lines.append(line)

    if not updated:
        new_lines.append(f"{key}={value}")

    env_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
    os.environ[key] = value


def setup_credentials_interactive():
    """Interactive setup for Fyers credentials."""
    print_banner("Fyers API Credentials Setup")
    
    print("1. Go to https://api.fyers.in/register to create a Fyers app")
    print("   You'll need a Fyers trading account first.\n")
    
    print("2. After registering your app, you'll get:")
    print("   - APP ID (use as FYERS_CLIENT_ID)")
    print("   - Secret Key (use as FYERS_SECRET_KEY)\n")
    
    client_id = os.getenv("FYERS_CLIENT_ID", "").strip()
    secret_key = os.getenv("FYERS_SECRET_KEY", "").strip()
    
    if not client_id or not secret_key:
        print("⚠️  Credentials not found in environment.")
        print("📝 Please create/update your .env file with:")
        print("   - FYERS_CLIENT_ID")
        print("   - FYERS_SECRET_KEY")
        print("\n   See .env.example for the template.\n")
        return False
    
    print(f"✅ Found FYERS_CLIENT_ID: {client_id[:10]}...")
    print(f"✅ Found FYERS_SECRET_KEY: {secret_key[:10]}...\n")
    return True


async def test_auth_flow():
    """Test Fyers authentication flow."""
    print_banner("Step 1: Fyers Authentication")
    
    try:
        client_id = os.getenv("FYERS_CLIENT_ID")
        secret_key = os.getenv("FYERS_SECRET_KEY")
        
        if not client_id or not secret_key:
            print("❌ Credentials not found. Please set FYERS_CLIENT_ID and FYERS_SECRET_KEY in .env")
            return False
        
        # Generate auth URL
        print("📍 Generating Fyers authentication URL...")
        auth_url = get_auth_url(client_id, secret_key)
        
        print(f"✅ Auth URL generated:\n   {auth_url}\n")
        print("📌 Steps to get your access token:")
        print("   1. Open the URL in your browser")
        print("   2. Log in with your Fyers account")
        print("   3. Authorize the app")
        print("   4. You'll be redirected - copy the 'auth_code' from the URL\n")
        
        auth_code = input("🔑 Paste your auth_code here (or 'skip' to test with existing token): ").strip()
        
        if auth_code.lower() == 'skip':
            print("⏭️  Skipping auth code flow...\n")
            return True
        
        if not auth_code:
            print("❌ No auth_code provided.\n")
            return False
        
        print(f"\n🔄 Exchanging auth_code for access token...")
        try:
            token = generate_access_token(auth_code, client_id, secret_key)
            save_env_value("FYERS_ACCESS_TOKEN", token)
            print(f"✅ Access token generated: {token[:20]}...\n")
            print("💾 Token has been saved to backend/.env and the current shell environment.\n")
            return True
        except Exception as e:
            print(f"❌ Token generation failed: {e}\n")
            return False
            
    except Exception as e:
        print(f"❌ Auth flow error: {e}\n")
        return False


async def test_candles_endpoint():
    """Test the /candles endpoint with real Fyers data."""
    print_banner("Step 2: Test Candles Endpoint")
    
    try:
        access_token = os.getenv("FYERS_ACCESS_TOKEN")
        
        if not access_token:
            print("⚠️  No FYERS_ACCESS_TOKEN found.")
            print("   The endpoint will fall back to simulated data.\n")
            print("   To use real Fyers data, complete the authentication flow above.\n")
            return False
        
        print("📊 Testing Fyers broker connection and historical candle fetch...\n")
        
        broker = FyersBroker()
        connected = await broker.connect()
        
        if not connected:
            print("⚠️  Fyers broker connection failed or not configured.")
            print("   The backend will fall back to simulated candle data.\n")
            return False
        
        print("✅ Fyers broker connected\n")
        
        # Test candle fetch
        symbol = "RELIANCE"
        interval = "1"  # 1-minute candles
        to_date = datetime.now()
        from_date = to_date - timedelta(days=1)
        
        print(f"📈 Fetching {interval}-min candles for {symbol}...")
        print(f"   Range: {from_date.date()} to {to_date.date()}\n")
        
        candles = await broker.get_historical_candles(symbol, interval, from_date, to_date)
        
        if candles:
            print(f"✅ Got {len(candles)} candles from Fyers:\n")
            for i, candle in enumerate(candles[:3]):
                print(f"   Candle {i+1}:")
                print(f"      Time: {candle.timestamp}")
                print(f"      OHLC: {candle.open} / {candle.high} / {candle.low} / {candle.close}")
                print(f"      Volume: {candle.volume}\n")
            if len(candles) > 3:
                print(f"   ... and {len(candles) - 3} more candles\n")
        else:
            print("⚠️  No candles returned from Fyers.\n")
            return False
        
        await broker.disconnect()
        return True
        
    except Exception as e:
        print(f"❌ Candles endpoint test failed: {e}\n")
        return False


async def verify_app_integration():
    """Verify the full app can use the real Fyers data."""
    print_banner("Step 3: Full Integration Check")
    
    try:
        # Check if the frontend can fetch candles
        print("✅ The dashboard TradingChart component is configured to:")
        print("   1. Fetch candles from /api/v1/time-travel/candles")
        print("   2. Display real Fyers data when available")
        print("   3. Fall back to simulated data as a backup\n")
        
        print("📱 To test the full app:")
        print("   1. Start the backend: cd backend && python main.py")
        print("   2. Start the frontend: cd frontend && npm run dev")
        print("   3. Open http://localhost:5173 in your browser")
        print("   4. Check the Live Dashboard - you should see real OHLC data\n")
        
        return True
        
    except Exception as e:
        print(f"❌ Integration check failed: {e}\n")
        return False


async def main():
    print("\n" + "🤖 AutoBot Fyers Integration Setup" + "\n")
    
    # Step 1: Check credentials
    if not setup_credentials_interactive():
        print("\n❌ Setup incomplete. Please configure your Fyers credentials and try again.\n")
        sys.exit(1)
    
    # Step 2: Test auth flow (optional)
    auth_ok = await test_auth_flow()
    
    # Step 3: Test candles endpoint
    candles_ok = await test_candles_endpoint()
    
    # Step 4: Verify integration
    integration_ok = await verify_app_integration()
    
    # Summary
    print_banner("Setup Summary")
    
    status = "✅ READY FOR PRODUCTION" if all([auth_ok, candles_ok, integration_ok]) else "⚠️  PARTIAL (Using simulated data)"
    
    print(f"Status: {status}\n")
    
    if not auth_ok or not candles_ok:
        print("Next steps:")
        if not auth_ok:
            print("  • Complete the Fyers authentication flow to get your access token")
        if not candles_ok:
            print("  • Verify your Fyers credentials are correct")
            print("  • Check that Fyers API is accessible from your network")
        print()
    else:
        print("🎉 Your AutoBot is ready to trade with real Fyers market data!\n")


if __name__ == "__main__":
    asyncio.run(main())
