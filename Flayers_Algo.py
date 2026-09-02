import os
import webbrowser
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from typing import Any, Dict, List, Optional
import pandas as pd
from fyers_apiv3 import fyersModel

IST = ZoneInfo("Asia/Kolkata")


def _to_ist_timestamp(value: Any) -> datetime:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc).astimezone(IST)
        return value.astimezone(IST)
    return datetime.fromtimestamp(float(value), tz=timezone.utc).astimezone(IST)

DEFAULT_REDIRECT_URI = "https://trade.fyers.in/api-login/redirect-uri/index.html"


def _env(name: str, default: Optional[str] = None) -> Optional[str]:
    value = os.getenv(name)
    return value if value not in (None, "") else default


def get_fyers_session(
    client_id: Optional[str] = None,
    secret_key: Optional[str] = None,
    redirect_uri: Optional[str] = None,
):
    client_id = client_id or _env("FYERS_CLIENT_ID")
    secret_key = secret_key or _env("FYERS_SECRET_KEY")
    redirect_uri = redirect_uri or _env("FYERS_REDIRECT_URI", DEFAULT_REDIRECT_URI)

    if not client_id or not secret_key:
        raise ValueError(
            "Missing Fyers credentials. Set FYERS_CLIENT_ID and FYERS_SECRET_KEY in the environment or .env file."
        )

    return fyersModel.SessionModel(
        client_id=client_id,
        redirect_uri=redirect_uri,
        response_type="code",
        state="sample_state",
        secret_key=secret_key,
        grant_type="authorization_code",
    )


def get_auth_url(
    client_id: Optional[str] = None,
    secret_key: Optional[str] = None,
    redirect_uri: Optional[str] = None,
) -> str:
    session = get_fyers_session(client_id, secret_key, redirect_uri)
    auth_url = session.generate_authcode()
    return auth_url


def open_auth_url(
    client_id: Optional[str] = None,
    secret_key: Optional[str] = None,
    redirect_uri: Optional[str] = None,
) -> str:
    auth_url = get_auth_url(client_id, secret_key, redirect_uri)
    webbrowser.open(auth_url, new=1)
    return auth_url


def generate_access_token(
    auth_code: str,
    client_id: Optional[str] = None,
    secret_key: Optional[str] = None,
    redirect_uri: Optional[str] = None,
) -> str:
    session = get_fyers_session(client_id, secret_key, redirect_uri)
    session.set_token(auth_code)
    response = session.generate_token()

    token = response.get("access_token") if isinstance(response, dict) else None
    if not token:
        raise ValueError(f"Fyers token generation failed: {response}")

    os.environ["FYERS_ACCESS_TOKEN"] = token
    return token


def get_fyers_client(
    access_token: Optional[str] = None,
    client_id: Optional[str] = None,
    secret_key: Optional[str] = None,
    log_path: Optional[str] = None,
):
    access_token = access_token or _env("FYERS_ACCESS_TOKEN")
    client_id = client_id or _env("FYERS_CLIENT_ID")
    secret_key = secret_key or _env("FYERS_SECRET_KEY")
    log_path = log_path or os.getenv("FYERS_LOG_PATH", ".")

    if not access_token:
        raise ValueError(
            "Fyers access token missing. Generate it with generate_access_token() or set FYERS_ACCESS_TOKEN."
        )

    if not client_id:
        raise ValueError("Missing FYERS_CLIENT_ID")

    return fyersModel.FyersModel(
        token=access_token,
        is_async=False,
        client_id=client_id,
        log_path=log_path,
    )


def format_symbol(symbol: str) -> str:
    symbol = str(symbol).strip().upper()
    if symbol.startswith("NSE:"):
        return symbol
    if symbol.endswith("-EQ") or symbol.endswith("-BE"):
        return f"NSE:{symbol}"
    return f"NSE:{symbol}-EQ"


def extract_historical_data(fyers, symbol: str, window: str, range_from: str, range_to: str) -> pd.DataFrame:
    symbol = format_symbol(symbol)
    start = datetime.strptime(str(range_from), "%Y-%m-%d").date()
    end = datetime.strptime(str(range_to), "%Y-%m-%d").date()

    def same_day_data() -> pd.DataFrame:
        input_data = {
            "symbol": symbol,
            "resolution": window,
            "date_format": "1",
            "range_from": str(range_from),
            "range_to": str(range_to),
            "cont_flag": "1",
        }
        fetched = fyers.history(input_data)
        if "candles" not in fetched:
            return pd.DataFrame()

        candles = pd.DataFrame(fetched["candles"], columns=["ts", "open", "high", "low", "close", "vol"])
        candles["ts"] = candles["ts"].map(_to_ist_timestamp)
        return candles

    def extract_past_data() -> pd.DataFrame:
        range_from_dt = datetime.strptime(str(range_from), "%Y-%m-%d")
        range_to_dt = datetime.strptime(str(range_to), "%Y-%m-%d")
        candles = pd.DataFrame()

        if window in ["1", "2", "5", "10", "15", "30", "60", "D", "1D", "1W", "1M"]:
            for offset in range(0, 10000, 20):
                from_dt = range_from_dt + timedelta(days=offset)
                to_dt = from_dt + timedelta(days=20)
                if to_dt > range_to_dt:
                    break

                input_data = {
                    "symbol": symbol,
                    "resolution": window,
                    "date_format": "1",
                    "range_from": from_dt.strftime("%Y-%m-%d"),
                    "range_to": to_dt.strftime("%Y-%m-%d"),
                    "cont_flag": "1",
                }
                fetched = fyers.history(input_data)
                if "candles" in fetched:
                    candle_df = pd.DataFrame(
                        fetched["candles"],
                        columns=["ts", "open", "high", "low", "close", "vol"],
                    )
                    candle_df["ts"] = candle_df["ts"].map(_to_ist_timestamp)
                    candles = pd.concat([candles, candle_df], axis=0)

        return candles

    if window in ["D", "1D", "1W", "1M"]:
        return extract_past_data()

    if (end - start).days > 62 and window in ["1", "2", "5", "10", "15", "30", "60"]:
        return pd.DataFrame()

    if (end - start).days > 20 and window in ["1", "2", "5", "10", "15", "30", "60"]:
        return extract_past_data()

    if (end - start).days <= 20 and window in ["1", "2", "5", "10", "15", "30", "60"]:
        return same_day_data()

    raise ValueError("Invalid parameters: Ensure that the date range does not exceed 20 days for intraday data.")


def extract_data_for_multiple_symbols(fyers, symbols: List[str], window: str, range_from: str, range_to: str) -> pd.DataFrame:
    all_data = pd.DataFrame()
    for symbol in symbols:
        data = extract_historical_data(fyers, symbol, window, range_from, range_to)
        if not data.empty:
            all_data = pd.concat([all_data, data], axis=0)
    return all_data


if __name__ == "__main__":
    print("Fyers helper loaded successfully.")
    print("Login URL:")
    try:
        print(get_auth_url())
    except ValueError as exc:
        print(exc)
