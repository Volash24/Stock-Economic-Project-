# four_quadrant.py

from datetime import datetime

# services/four_quadrant.py

from fredapi import Fred
from config import Config


def fetch_latest_macro_data():
    """
    Fetch latest real-time growth and inflation values from FRED.
    - GDP: YoY real GDP growth (quarterly annualized %)
    - CPI: YoY CPI % change (monthly)
    """
    fred = Fred(api_key=Config.FRED_API_KEY)

    # Real GDP YoY Annual Rate (Quarterly)
    gdp_series = fred.get_series("A191RL1Q225SBEA")  # Real GDP YoY %
    latest_gdp = gdp_series.dropna().iloc[-1]

    # CPI YoY % (Monthly)
    cpi_raw = fred.get_series("CPIAUCSL")  # Consumer Price Index
    cpi_yoy = cpi_raw.pct_change(periods=12) * 100
    latest_cpi = cpi_yoy.dropna().iloc[-1]

    return float(latest_gdp), float(latest_cpi)


def determine_quad(growth_rate, inflation_rate):
    """
    Classify macro quadrant based on growth and inflation.

    Quad 1: Growth ↑, Inflation ↑
    Quad 2: Growth ↑, Inflation ↓
    Quad 3: Growth ↓, Inflation ↓
    Quad 4: Growth ↓, Inflation ↑
    """
    if growth_rate > 0 and inflation_rate > 0:
        return "Quad 1", "Growth ↑ / Inflation ↑"
    elif growth_rate > 0 and inflation_rate < 0:
        return "Quad 2", "Growth ↑ / Inflation ↓"
    elif growth_rate < 0 and inflation_rate < 0:
        return "Quad 3", "Growth ↓ / Inflation ↓"
    else:
        return "Quad 4", "Growth ↓ / Inflation ↑"


def get_macro_analysis():
    """
    Pull real-time GDP & CPI from FRED and classify macro quadrant.
    """
    growth_rate, inflation_rate = fetch_latest_macro_data()
    quadrant, description = determine_quad(growth_rate, inflation_rate)

    return {
        "growth_rate": round(growth_rate, 2),
        "inflation_rate": round(inflation_rate, 2),
        "quadrant": quadrant,
        "description": description
    }


# === CLI Test Mode ===
if __name__ == "__main__":
    data = get_macro_analysis()
    print(f"Growth: {data['growth_rate']}%")
    print(f"Inflation: {data['inflation_rate']}%")
    print(f"Quadrant: {data['quadrant']}")
    print(f"Description: {data['description']}")
