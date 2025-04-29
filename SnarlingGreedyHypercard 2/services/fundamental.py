# services/fundamental.py

import requests
import json
import matplotlib.pyplot as plt
from config import Config
from services.four_quadrant import get_macro_analysis

def get_fundamental_data(stock_symbol):
    """
    Fetch key fundamental data from an external API (Alpha Vantage Overview).
    Returns a dictionary with EPS, Revenue, and Profit Margin.
    """
    api_key = Config.API_KEY
    url = f"https://www.alphavantage.co/query?function=OVERVIEW&symbol={stock_symbol}&apikey={api_key}"
    response = requests.get(url)
    data = response.json()

    return {
        "EPS": data.get("EPS", "N/A"),
        "RevenueTTM": data.get("RevenueTTM", "N/A"),
        "ProfitMargin": data.get("ProfitMargin", "N/A")
    }

def calculate_fundamental_analysis(stock_symbol):
    """
    Combine fundamental data with macro quadrant analysis.

    The macro quadrant is determined using dummy economic data for demonstration.
    In a production version, replace the dummy data with live economic indicators.
    """
    fundamentals = get_fundamental_data(stock_symbol)

    # Dummy economic data: replace with real-time data later
    dummy_growth_data = [["2022-01-01", 2.0], ["2024-01-01", 2.8]]
    dummy_inflation_data = [["2022-01-01", 5.0], ["2024-01-01", 3.0]]

    macro_analysis = get_macro_analysis(dummy_growth_data, dummy_inflation_data)

    result = {
        "Stock Symbol": stock_symbol,
        "EPS": fundamentals.get("EPS"),
        "RevenueTTM": fundamentals.get("RevenueTTM"),
        "ProfitMargin": fundamentals.get("ProfitMargin"),
        "Quadrant": macro_analysis["quadrant"],
        "Quadrant Description": macro_analysis["description"],
        "Growth Rate Change (%)": macro_analysis["growth_rate_change_percent"],
        "Inflation Rate Change (%)": macro_analysis["inflation_rate_change_percent"]
    }
    return result

def plot_fundamental_quadrant(result):
    """
    Plot a bubble graph representing the macro quadrant.

    The x-axis shows the growth rate change (%), the y-axis shows the inflation rate change (%).
    A single bubble is plotted with a label indicating the quadrant.
    """
    x = result["Growth Rate Change (%)"]
    y = result["Inflation Rate Change (%)"]
    quadrant = result["Quadrant"]

    plt.figure(figsize=(8, 6))
    plt.scatter(x, y, s=300, alpha=0.7, color='blue', label=quadrant)
    plt.xlabel("Growth Rate Change (%)")
    plt.ylabel("Inflation Rate Change (%)")
    plt.title(f"{result['Stock Symbol']} - Fundamental Analysis & Macro Quadrant")
    plt.legend()
    plt.grid(True)
    plt.show()

# For testing purposes
if __name__ == "__main__":
    stock_symbol = input("Enter Stock Symbol for Fundamental Analysis: ")
    analysis = calculate_fundamental_analysis(stock_symbol)
    
    # alias for backwards‐compatibility
    calculate_stock_data = calculate_fundamental_analysis

    print("Fundamental Analysis Result:")
    print(json.dumps(analysis, indent=4))
    plot_fundamental_quadrant(analysis)
