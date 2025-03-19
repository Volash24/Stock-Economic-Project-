# econdata.py
import requests
from datetime import datetime, timedelta
from data_manger import API_KEY
import logging



# Function to handle API requests with improved error handling
def get_data(url):
    try:
        response = requests.get(url)
        response.raise_for_status()  # Will raise an HTTPError if the HTTP request returned an unsuccessful status code
        data = response.json()
        if "data" not in data:
            raise ValueError("Expected 'data' key not found in response")
        return data["data"]
    except requests.HTTPError as http_err:
        logging.error(f"HTTP error occurred: {http_err}")
        raise
    except Exception as err:
        logging.error(f"Other error occurred: {err}")
        raise Exception("Expected 'data' key not found in response")

def get_treasury_data():
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=2 * 365)).strftime("%Y-%m-%d")
    url = f'https://www.alphavantage.co/query?function=TREASURY_YIELD&interval=monthly&maturity=10year&apikey={API_KEY}'
    
    treasury_yields = []
    for item in get_data(url):
        date = item["date"]
        value = item["value"]
        if start_date <= date <= end_date:
            treasury_yields.append([date, value])
    return treasury_yields

def get_inflation_data():
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=3 * 365)).strftime("%Y-%m-%d")
    url = f'https://www.alphavantage.co/query?function=INFLATION&apikey={API_KEY}'
    
    inflation_data = []
    for item in get_data(url):
        date = item["date"]
        value = "{:.2f}".format(float(item["value"]))
        if start_date <= date <= end_date:
            inflation_data.append([date, value])
    return inflation_data

def get_federal_funds_data():
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=2 * 365)).strftime("%Y-%m-%d")
    url = f'https://www.alphavantage.co/query?function=FEDERAL_FUNDS_RATE&interval=monthly&apikey={API_KEY}'
    
    federal_funds_rate_data = []
    for item in get_data(url):
        date = item["date"]
        value = item["value"]
        if start_date <= date <= end_date:
            federal_funds_rate_data.append([date, value])
    return federal_funds_rate_data

def get_cpi_data():
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=3 * 365)).strftime("%Y-%m-%d")
    url = f'https://www.alphavantage.co/query?function=CPI&apikey={API_KEY}'
    
    cpi_data = []
    for item in get_data(url):
        date = item["date"]
        value = "{:.2f}".format(float(item["value"]))
        if start_date <= date <= end_date:
            cpi_data.append([date, value])
    return cpi_data
