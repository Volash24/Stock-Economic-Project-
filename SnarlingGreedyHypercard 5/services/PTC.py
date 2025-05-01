#PTC.py
import requests
import statistics
from services.data_manger import API_KEY
# Define the API key here or import from a secure location


def fetch_intraday_data(stock_symbol, interval='5min', adjusted=True, extended_hours=True, outputsize='full', datatype='json'):
    BASE_URL = "https://www.alphavantage.co/query"
    
    params = {
        'function': 'TIME_SERIES_INTRADAY',
        'symbol': stock_symbol,
        'interval': interval,
        'adjusted': str(adjusted).lower(),
        'extended_hours': str(extended_hours).lower(),
        'outputsize': outputsize,
        'datatype': datatype,
        'apikey': API_KEY
    }

    response = requests.get(BASE_URL, params=params)
    response.raise_for_status()

    if datatype == 'json':
        return response.json()["Time Series (5min)"]
    else:
        return response.text

def compute_statistics(data, intervals):
    results = {}
    
    for interval in intervals:
        subset_data = [float(data[key]["4. close"]) for key in list(data.keys())[:interval]]
        
        # Calculate statistics
        high = max(subset_data)
        low = min(subset_data)
        mean = statistics.mean(subset_data)
        mode = statistics.mode(subset_data)
        variance = statistics.variance(subset_data)
        stdev = statistics.stdev(subset_data)

        results[interval] = {
            'High': high,
            'Low': low,
            'Mean': mean,
            'Mode': mode,
            'Variance': variance,
            'Standard Deviation': stdev
        }
    return results

# Example Usage:
if __name__ == '__main__':
    # Example stock symbol
    example_stock_symbol = "AAPL"  # Replace with the desired stock symbol
    data = fetch_intraday_data(example_stock_symbol)
    statistics_data = compute_statistics(data, [30, 60, 90, 120, 150])
    for interval, values in statistics_data.items():
        print(f"Statistics for last {interval} data points:")
        for k, v in values.items():
            print(f"{k}: {v}")
        print("-" * 50)
