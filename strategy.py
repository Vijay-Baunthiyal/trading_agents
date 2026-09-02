import datetime
import time
from fyers_apiv3 import fyersModel
import webbrowser
import pandas as pd

app_id = "NLRNTA5OZE-100"
client_id = "YV01955"
secret_key = "YDK19LYJP2"
redirect_uri = "https://trade.fyers.in/api-login/redirect-uri/index.html"
# redirect_uri= "https://fyers.in/"  ## redircet_uri you entered while creating APP.
response_type = "code"
state = "sample_state"
grant_type = "authorization_code"
log_path = "E:/Algo/Flyers/Logs/"

appSession = fyersModel.SessionModel(client_id = app_id, redirect_uri = redirect_uri,response_type=response_type,state=state,secret_key=secret_key,grant_type=grant_type)
generateTokenUrl = appSession.generate_authcode()
print((generateTokenUrl))
webbrowser.open(generateTokenUrl,new=1)

auth_code = input()
appSession.set_token(auth_code)
response = appSession.generate_token()
try: 
    access_token = response["access_token"]
    print("login successfull")
except Exception as e:
    print(e,response)

# Initialize FYERS Model
fyers = fyersModel.FyersModel(
    client_id=app_id, token=access_token, is_async=False, log_path=""
)

print("fyers created")
NIFTY_LOT_SIZE = 65  # Standard Nifty lot size


def get_fyers_market_signals():
    """Fetches live spot & VIX rates from FYERS API and computes direction."""
    # Symbols for FYERS Spot Index & India VIX
    data = {"symbols": "NSE:NIFTY50-INDEX,NSE:INDIAVIX-INDEX"}
    response = fyers.quotes(data=data)
    print(f"[*] FYERS Market Data Response: {response}")

    nifty_spot = 0.0
    india_vix = 0.0

    if response.get("s") == "ok":
        for item in response.get("d", []):
            if item["n"] == "NSE:NIFTY50-INDEX":
                nifty_spot = item["v"]["lp"]  # Last Traded Price
            elif item["n"] == "NSE:INDIAVIX-INDEX":
                india_vix = item["v"]["lp"]
    else:
        raise Exception(f"Failed to fetch quotes: {response}")

    # Dummy order-flow variables (Replace with your L2/L3 WebSocket Aggregator Data)
    buy_sell_imbalance_ratio = 1.35  # > 1.0 indicates aggressive buying momentum
    weak_signal = True if 0.9 <= buy_sell_imbalance_ratio <= 1.1 else False

    # Direction Decision Rules
    if india_vix < 15.0 and weak_signal:
        # Contrarian rule on calm, weak-signal days
        direction = (
            "BEARISH" if buy_sell_imbalance_ratio > 1.0 else "BULLISH"
        )
    else:
        # Trend-following rule
        direction = (
            "BULLISH" if buy_sell_imbalance_ratio > 1.0 else "BEARISH"
        )

    return nifty_spot, direction


def build_fyers_option_symbol(strike, option_type, expiry_date):
    """Formats the FYERS option symbol.

    Format: NSE:NIFTY{YY}{M/MM}{DD}{STRIKE}{CE/PE} Ex: NSE:NIFTY2690324200CE
    """
    yy = expiry_date.strftime("%y")

    # FYERS Month encoding (Single digit for 1-9, O/N/D or double digit depending on contract)
    # Standard Weekly Expiry Format:
    month_char = expiry_date.strftime("%m").lstrip(
        "0"
    )  # e.g., 9 for Sept, 10 for Oct
    dd = expiry_date.strftime("%d")

    symbol = f"NSE:NIFTY{yy}{month_char}{dd}{strike}{option_type}"
    return symbol


def execute_fyers_alpha_ladder():
    now = datetime.datetime.now()
    print(now.weekday())
    # Strategy Rule: Triggers on Wednesday around 14:30 IST
    if now.weekday()+1 == 2 and now.time() <= datetime.time(14, 30):
        spot_price, direction = get_fyers_market_signals()
        print('branch 1')

        # Calculate Strikes
        atm_strike = round(spot_price / 50) * 50

        if direction == "BULLISH":
            sold_strike = atm_strike + 200
            far_strike = atm_strike + 400
            opt_type = "CE"
        else:
            sold_strike = atm_strike - 200
            far_strike = atm_strike - 400
            opt_type = "PE"

        # Next weekly expiry date (Assuming target expiry is the coming Tuesday)
        # Note: Adjust expiry logic to match exact exchange weekly calendar
        expiry_date = now + datetime.timedelta(days=(1 - now.weekday()+1) % 7)

        # Build Symbols
        leg1_sym = build_fyers_option_symbol(
            atm_strike, opt_type, expiry_date
        )
        leg2_sym = build_fyers_option_symbol(
            sold_strike, opt_type, expiry_date
        )
        leg3_sym = build_fyers_option_symbol(
            far_strike, opt_type, expiry_date
        )

        print(
            f"[*] Spot: {spot_price} | Direction: {direction} | Expiry Target: {expiry_date.strftime('%Y-%m-%d')}"
        )
        print(f"    Leg 1 (Buy 1 Lot) : {leg1_sym}")
        print(f"    Leg 2 (Sell 2 Lots): {leg2_sym}")
        print(f"    Leg 3 (Buy 1 Lot) : {leg3_sym}")

        # FYERS Basket / Multi-Leg Order Payload setup
        # Side: 1 = BUY, -1 = SELL
        orders_payload = [
            {
                "symbol": leg1_sym,
                "qty": 1 * NIFTY_LOT_SIZE,
                "type": 2,  # 2 = Market Order
                "side": 1,  # Buy
                "productType": "MARGIN",
                "limitPrice": 0,
                "stopPrice": 0,
                "validity": "DAY",
                "disclosedQty": 0,
                "offlineOrder": False,
            },
            {
                "symbol": leg2_sym,
                "qty": 2 * NIFTY_LOT_SIZE,
                "type": 2,
                "side": -1,  # Sell
                "productType": "MARGIN",
                "limitPrice": 0,
                "stopPrice": 0,
                "validity": "DAY",
                "disclosedQty": 0,
                "offlineOrder": False,
            },
            {
                "symbol": leg3_sym,
                "qty": 1 * NIFTY_LOT_SIZE,
                "type": 2,
                "side": 1,  # Buy
                "productType": "MARGIN",
                "limitPrice": 0,
                "stopPrice": 0,
                "validity": "DAY",
                "disclosedQty": 0,
                "offlineOrder": False,
            },
        ]

        # Execute Basket Orders via FYERS API
        response = fyers.place_basket_orders(data=orders_payload)
        print(f"[+] Order Placement Response: {response}")


if __name__ == "__main__":
    execute_fyers_alpha_ladder()