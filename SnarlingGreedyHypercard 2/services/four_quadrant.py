# four_quadrant.py

from datetime import datetime

def calculate_rate_of_change(data):
    """
    Calculate the percentage rate of change between the earliest and latest values in a list.

    :param data: List of [date, value] pairs, sorted by date (oldest first).
    :return: Percentage change ((latest - earliest) / earliest) * 100.
    """
    if not data or len(data) < 2:
        raise ValueError("Insufficient data to calculate rate of change.")

    # Assume data is sorted by date; parse values as floats
    try:
        earliest_value = float(data[0][1])
        latest_value = float(data[-1][1])
    except (IndexError, ValueError) as e:
        raise ValueError("Invalid data format. Expected a list of [date, value] pairs.") from e

    # Calculate percentage change
    rate_change = ((latest_value - earliest_value) / earliest_value) * 100
    return rate_change

def determine_quad(growth_rate, inflation_rate):
    """
    Determine the macroeconomic quadrant based on growth and inflation rates.

    Quadrant definitions:
      - Quad 1 – Goldilocks: Growth accelerating (>0) and inflation slowing (<0).
      - Quad 2 – Reflation: Growth accelerating (>0) and inflation accelerating (>=0).
      - Quad 3 – Stagflation: Growth slowing (<=0) and inflation accelerating (>=0).
      - Quad 4 – Deflation: Growth slowing (<=0) and inflation slowing (<0).

    :param growth_rate: Percentage change in economic growth.
    :param inflation_rate: Percentage change in inflation.
    :return: Tuple (quad_identifier, description).
    """
    if growth_rate > 0 and inflation_rate < 0:
        return ("Quad 1 – Goldilocks", "Growth accelerating, inflation slowing.")
    elif growth_rate > 0 and inflation_rate >= 0:
        return ("Quad 2 – Reflation", "Growth accelerating, inflation accelerating.")
    elif growth_rate <= 0 and inflation_rate >= 0:
        return ("Quad 3 – Stagflation", "Growth slowing, inflation accelerating.")
    elif growth_rate <= 0 and inflation_rate < 0:
        return ("Quad 4 – Deflation", "Growth slowing, inflation slowing.")
    else:
        return ("Unclassified", "Insufficient data for classification.")

def get_macro_analysis(growth_data, inflation_data):
    """
    Get a macroeconomic analysis based on input growth and inflation data.

    :param growth_data: List of [date, growth_value] pairs (e.g., GDP growth rates).
    :param inflation_data: List of [date, inflation_value] pairs.
    :return: Dictionary with growth_rate, inflation_rate, and quadrant classification.
    """
    # Calculate rate of change for growth and inflation
    growth_rate = calculate_rate_of_change(growth_data)
    inflation_rate = calculate_rate_of_change(inflation_data)

    # Determine the quadrant based on the calculated rates
    quad, description = determine_quad(growth_rate, inflation_rate)

    # Return the analysis as a dictionary
    return {
        "growth_rate_change_percent": growth_rate,
        "inflation_rate_change_percent": inflation_rate,
        "quadrant": quad,
        "description": description
    }

# For testing purposes, you might include a __main__ block like this:
if __name__ == '__main__':
    # Example dummy data:
    # Growth data: [date, GDP growth rate] - assume growth has increased from 2.0% to 2.8%
    dummy_growth_data = [["2022-01-01", 2.0], ["2024-01-01", 2.8]]

    # Inflation data: [date, inflation rate] - assume inflation has decreased from 5.0% to 3.0%
    dummy_inflation_data = [["2022-01-01", 5.0], ["2024-01-01", 3.0]]

    analysis = get_macro_analysis(dummy_growth_data, dummy_inflation_data)
    print("Macro Analysis:")
    print(f"Growth Rate Change: {analysis['growth_rate_change_percent']:.2f}%")
    print(f"Inflation Rate Change: {analysis['inflation_rate_change_percent']:.2f}%")
    print(f"Quadrant: {analysis['quadrant']}")
    print(f"Description: {analysis['description']}")
