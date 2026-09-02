# Fyers API Integration Guide

This guide walks you through setting up real market data from Fyers API for the AutoBot trading application.

## Overview

The AutoBot app has two data modes:

1. **Simulated Mode** (default) - Uses generated mock candle data
2. **Fyers Live Mode** - Uses real historical candles and live quotes from Fyers

The app automatically falls back to simulated mode if Fyers credentials are not configured, so you can develop and test locally without real credentials.

## Prerequisites

- **Fyers Trading Account**: You need a Fyers brokerage account to get API credentials
  - Sign up at https://fyers.in (India-based broker)
- **Python 3.8+** with the venv already set up
- **`fyers-apiv3` package**: Already installed via backend requirements

## Getting Fyers API Credentials

### Step 1: Create a Fyers App

1. Go to https://api.fyers.in/register
2. Log in with your Fyers trading account
3. Fill out the app registration form:
   - **App Name**: e.g., "AutoBot Trading"
   - **Redirect URL**: Use the default: `https://trade.fyers.in/api-login/redirect-uri/index.html`
4. Accept terms and submit
5. You'll receive:
   - **APP ID** (use as `FYERS_CLIENT_ID`)
   - **Secret Key** (use as `FYERS_SECRET_KEY`)

### Step 2: Create .env File

Copy the template and add your credentials:

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
FYERS_CLIENT_ID=your_app_id_from_step_1
FYERS_SECRET_KEY=your_secret_key_from_step_1
FYERS_REDIRECT_URI=https://trade.fyers.in/api-login/redirect-uri/index.html
FYERS_ACCESS_TOKEN=will_be_set_by_setup_script
```

### Step 3: Generate Access Token

Run the setup helper script (it's interactive):

```bash
cd /home/codex/desktop/desktop/autoBot
python setup_fyers_credentials.py
```

This script will:

1. **Validate** your CLIENT_ID and SECRET_KEY
2. **Generate an Auth URL** - Copy/open it in your browser
3. **Authenticate** - Log in with your Fyers account and authorize the app
4. **Extract the auth code** from the redirected URL
5. **Generate an Access Token** - Automatically saved to your `.env`
6. **Test the Fyers API** - Fetches real candles to verify connectivity

### Step 4: Verify Integration

Once the script completes successfully:

```bash
# Terminal 1: Start the backend
cd backend
python main.py

# Terminal 2: Start the frontend
cd ../frontend
npm run dev
```

Open http://localhost:5173 and check the **Live Dashboard** tab:
- Real Fyers candles should display (green/red candlesticks)
- Volume histogram should show below
- If something fails, it gracefully falls back to simulated data

## Architecture

### Backend Flow

```
[React Frontend]
    ↓
[GET /api/v1/time-travel/candles?symbol=RELIANCE&from=...&to=...]
    ↓
[FastAPI timetravel.py]
    ↓
[FyersBroker.get_historical_candles()]
    ↓
[Flayers_Algo.extract_historical_data()]
    ↓
[fyers-apiv3 SDK] ← Uses FYERS_ACCESS_TOKEN
    ↓
[Real Fyers historical data]
```

### Fallback Behavior

If Fyers is not configured or the request fails:
- The `/candles` endpoint returns **simulated seed candles**
- The frontend chart displays these gracefully
- No app crash or blank screen

## File Structure

```
autoBot/
├── .env                          # Your credentials (git-ignored)
├── .env.example                  # Template for .env
├── setup_fyers_credentials.py   # Interactive setup script
├── Flayers_Algo.py              # Fyers API helper functions
├── backend/
│   └── app/
│       ├── broker/
│       │   ├── base.py          # Abstract broker interface
│       │   ├── simulator.py     # Mock broker for testing
│       │   └── fyers.py         # Real Fyers broker implementation
│       ├── api/
│       │   └── timetravel.py    # Candle endpoint (uses broker)
│       ├── config.py            # Settings (loads .env)
│       └── main.py              # FastAPI app (picks broker based on creds)
└── frontend/
    └── src/
        ├── lib/
        │   └── api.ts           # getMarketCandles() function
        └── components/
            └── dashboard/
                └── TradingChart.tsx  # Chart that calls getMarketCandles()
```

## Troubleshooting

### "ImportError: No module named 'fyers_apiv3'"

```bash
cd backend
./venv/bin/pip install fyers-apiv3
```

### "FYERS_CLIENT_ID and FYERS_SECRET_KEY not found"

Make sure your `.env` file exists in `/home/codex/desktop/desktop/autoBot/` with the credentials filled in.

### "Invalid auth_code"

The auth code is only valid for ~10 minutes. Run the setup script again to get a fresh one.

### "Fyers broker connection skipped"

This is normal in local dev without real credentials. The app will use simulated data instead.

### Charts show simulated data instead of real Fyers data

1. Verify your `.env` has valid `FYERS_ACCESS_TOKEN`
2. Check backend logs: `cd backend && python main.py` should show `Fyers broker connected`
3. Test the endpoint directly:
   ```bash
   curl "http://localhost:8000/api/v1/time-travel/candles?symbol=RELIANCE&interval=1&from=2024-01-01T00:00:00Z&to=2024-01-02T00:00:00Z"
   ```

## Next Steps

- ✅ Set up Fyers credentials
- ✅ Test real market data with the setup script
- 🎯 Start the trading bot with real data
- 📊 Monitor trades in the Live Dashboard
- ⏱️ Use Time Travel tab to backtest with real historical data
- 🧪 Use Sandbox tab to run simulations

## Support

- Fyers API Docs: https://api.fyers.in/docs
- Fyers Support: https://support.fyers.in
- AutoBot Issues: Check the backend logs for detailed error messages

## Security

⚠️ **Important**: Never commit your `.env` file to git!

- `.env` is already in `.gitignore`
- The `FYERS_ACCESS_TOKEN` expires and can be regenerated anytime
- Your `FYERS_SECRET_KEY` should be treated like a password
