# services/fundamental.py

import requests
import json
import matplotlib.pyplot as plt
from config import Config
from services.four_quadrant import get_macro_analysis

import yfinance as yf
import matplotlib.pyplot as plt
import json
from services.four_quadrant import get_macro_analysis
from config import Config


def get_fundamental_data(symbol):
    """
    Get comprehensive real-time stock data using yfinance.
    Returns dict with EPS, Revenue, FCF, ROE, etc.
    """
    try:
        stock = yf.Ticker(symbol)
        info = stock.info

        return {
            "Symbol": symbol,
            "Sector": info.get("sector", "N/A"),
            "Market Cap": info.get("marketCap", "N/A"),
            "EPS (TTM)": info.get("trailingEps", "N/A"),
            "EPS (FWD)": info.get("forwardEps", "N/A"),
            "Revenue (TTM)": info.get("totalRevenue", "N/A"),
            "Net Income": info.get("netIncomeToCommon", "N/A"),
            "Free Cash Flow": info.get("freeCashflow", "N/A"),
            "Operating Margin": info.get("operatingMargins", "N/A"),
            "ROE": info.get("returnOnEquity", "N/A"),
            "Beta": info.get("beta", "N/A"),
            "Dividend Yield": info.get("dividendYield", "N/A")
        }

    except Exception as e:
        print(f"[ERROR] yfinance failed to fetch data for {symbol}: {e}")
        return {"error": str(e)}


def calculate_fundamental_analysis(symbol):
    """
    Merge stock data with real-time macro quadrant analysis.
    """
    fundamentals = get_fundamental_data(symbol)
    macro = get_macro_analysis()

    return {
        **fundamentals,
        "Quadrant": macro["quadrant"],
        "Quadrant Description": macro["description"],
        "Growth Rate (%)": macro["growth_rate"],
        "Inflation Rate (%)": macro["inflation_rate"]
    }


def plot_fundamental_quadrant(result, output_path="static/macro_quadrant.png"):
    """
    Plot macro quadrant with current economic coordinates.
    """
    x = result["Growth Rate (%)"]
    y = result["Inflation Rate (%)"]
    quadrant = result["Quadrant"]

    plt.figure(figsize=(8, 6))
    plt.axhline(0, color='gray', linestyle='--')
    plt.axvline(0, color='gray', linestyle='--')
    plt.scatter(x, y, s=300, alpha=0.7, color='blue', label=quadrant)

    # Label quadrants
    plt.text(2.5, 3.5, "Quad 1\nGrowth ↑ / Inflation ↑", ha='center')
    plt.text(-2.5, 3.5, "Quad 4\nGrowth ↓ / Inflation ↑", ha='center')
    plt.text(-2.5, -3.5, "Quad 3\nGrowth ↓ / Inflation ↓", ha='center')
    plt.text(2.5, -3.5, "Quad 2\nGrowth ↑ / Inflation ↓", ha='center')

    plt.xlabel("Real GDP YoY (%)")
    plt.ylabel("CPI YoY (%)")
    plt.title(f"{result['Symbol']} - Macro Quadrant")
    plt.grid(True)
    plt.legend()
    plt.savefig(output_path)
    plt.close()
    return output_path


# === CLI Test Mode ===
if __name__ == "__main__":
    symbol = input("Enter stock symbol: ").strip().upper()
    analysis = calculate_fundamental_analysis(symbol)
    print(json.dumps(analysis, indent=4))
    image_path = plot_fundamental_quadrant(analysis)
    print(f"Quadrant image saved to: {image_path}")
