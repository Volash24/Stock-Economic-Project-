# services/econdata.py
import requests
from datetime import datetime, timedelta
import logging
from services.data_manger import API_KEY

# Shared helper to fetch data and detect API messages
def get_data(url):
    response = requests.get(url)
    try:
        response.raise_for_status()
    except requests.HTTPError as http_err:
        logging.error(f"HTTP error fetching {url}: {http_err}")
        raise
    payload = response.json()
    # Handle rate-limit or info messages
    if 'Information' in payload:
        raise Exception(payload['Information'])
    if 'Note' in payload:
        raise Exception(payload['Note'])
    # Return the 'data' list if present
    if 'data' in payload and isinstance(payload['data'], list):
        return payload['data']
    logging.warning(f"No 'data' field in response from {url}. Keys: {list(payload.keys())}")
    return []

# Fetch Treasury Yield data
def get_treasury_data():
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=2*365)).strftime("%Y-%m-%d")
    url = f"https://www.alphavantage.co/query?function=TREASURY_YIELD&interval=monthly&maturity=10year&apikey={API_KEY}"
    raw = get_data(url)
    data = []
    for item in raw:
        date = item.get('date')
        value = item.get('value')
        if date and start_date <= date <= end_date:
            data.append([date, value])
    return data

# Fetch Inflation data
def get_inflation_data():
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=3*365)).strftime("%Y-%m-%d")
    url = f"https://www.alphavantage.co/query?function=INFLATION&apikey={API_KEY}"
    raw = get_data(url)
    data = []
    for item in raw:
        date = item.get('date')
        value = item.get('value')
        if date and start_date <= date <= end_date:
            data.append([date, value])
    return data

# Fetch Federal Funds Rate data
def get_federal_funds_data():
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=2*365)).strftime("%Y-%m-%d")
    url = f"https://www.alphavantage.co/query?function=FEDERAL_FUNDS_RATE&interval=monthly&apikey={API_KEY}"
    raw = get_data(url)
    data = []
    for item in raw:
        date = item.get('date')
        value = item.get('value')
        if date and start_date <= date <= end_date:
            data.append([date, value])
    return data

# Fetch CPI data
def get_cpi_data():
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=3*365)).strftime("%Y-%m-%d")
    url = f"https://www.alphavantage.co/query?function=CPI&apikey={API_KEY}"
    raw = get_data(url)
    data = []
    for item in raw:
        date = item.get('date')
        value = item.get('value')
        if date and start_date <= date <= end_date:
            data.append([date, value])
    return data
