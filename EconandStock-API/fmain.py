# fmain.py
# Standard library imports
import os
import datetime

# Third-party imports
import pandas as pd
import requests
from flask import Flask, render_template, request, jsonify
import yfinance as yf

# Local application imports
from econdata import get_treasury_data, get_inflation_data, get_federal_funds_data, get_cpi_data
from PTC import fetch_intraday_data, compute_statistics
from main import calculate_stock_data
from data_manger import DataManager
app = Flask(__name__)
data_manager = DataManager()
# Environment variables and constants
ALPHA_VANTAGE_API_KEY = os.getenv("GZC033KC2EKHHQZY")
FINANCIAL_MODEL_API_KEY = os.getenv("246156ce0f8a728a437aa1e4e0a13d09")
DEFAULT_EXCHANGE = ["NASDAQ", "NYSE", "CBOE", "LSE"]
ALLOWED_MATURITIES = ['3month', '2year', '5year', '7year', '10year', '30year']
ALLOWED_INTERVALS = ['daily', 'weekly', 'monthly']

@app.route('/market_news')
def market_news():
    url = "https://api.marketaux.com/v1/news/all"
    params = {
        "api_token": "2Y061WqGcxPS2PZonmDfuun1jcmfuSJrXSibu9Zd",  # Your API token
        "countries": "us",  # Example: Fetch news for US
        "sentiment_gte": "0",  # Fetch articles with neutral or positive sentiment
        "limit": "10"  # Limit the number of articles returned
    }
    response = requests.get(url, params=params)
    if response.status_code != 200:
        # Handle errors, log them, or return a custom error message
        return jsonify({
            "error": "Failed to fetch data",
            "status_code": response.status_code,
            "response": response.text
        }), response.status_code
    return jsonify(response.json())


def sanitize_stock_symbol(stock_symbol: str) -> str:
    return ''.join(e for e in stock_symbol if e.isalnum()).upper()[:10]

def fetch_data(symbol):
    endpoint = f'https://financialmodelingprep.com/api/v3/historical-price-full/{symbol}?apikey={FINANCIAL_MODEL_API_KEY}'
    response = requests.get(endpoint)
    hist_json = response.json().get('historical', [])
    if hist_json:
        hist_df = pd.DataFrame(hist_json).iloc[::-1].reset_index()
        hist_df['date'] = pd.to_datetime(hist_df['date'])
        return hist_df[['date', 'open', 'high', 'low', 'close', 'volume']]
    return pd.DataFrame()

# Flask routes
@app.route('/econ_metrics.html')
def econ_data():
    return render_template('econ_metrics.html')

@app.route('/get_stock_data/<symbol>')
def get_stock_data(symbol):
    stock_data = calculate_stock_data(symbol)
    return jsonify(stock_data)

@app.route('/stockdata.html')
def stock_data():
    return render_template('stockdata.html')

@app.route('/journal.html')
def journal():
    return render_template('journal.html')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/treasury_data')
def treasury_data():
    maturity = request.args.get('maturity', '10year')
    if maturity not in ALLOWED_MATURITIES:
        return jsonify({"error": "Invalid maturity"}), 400

    try:
        data = data_manager.fetch_data('TREASURY_YIELD', maturity=maturity)
        if 'data' not in data:
            return jsonify({"error": "No data returned from API"}), 404
        
        months_since_start, values = data_manager.preprocess(data)
        preprocessed_data = {
            "months_since_start": months_since_start.tolist(),  # Convert ndarray to list
            "values": values.tolist()  # Convert ndarray to list
        }
        return jsonify(preprocessed_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/federal_funds_data')
def federal_funds_data():
    interval = request.args.get('interval', 'monthly')
    if interval not in ALLOWED_INTERVALS:
        return jsonify({"error": "Invalid interval"}), 400

    try:
        data = data_manager.fetch_data('FEDERAL_FUNDS_RATE', interval=interval)
        if 'data' not in data:
            return jsonify({"error": "No data returned from API"}), 404
        
        months_since_start, values = data_manager.preprocess(data)
        preprocessed_data = {
            "months_since_start": months_since_start.tolist(),  # Convert ndarray to list
            "values": values.tolist()  # Convert ndarray to list
        }
        return jsonify(preprocessed_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/cpi_data')
def cpi_data():
    try:
        data = get_cpi_data()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/inflation_data')
def inflation_data():
    try:
        data = data_manager.fetch_data('INFLATION')
        if 'data' not in data:
            return jsonify({"error": "No data returned from API"}), 404
        
        # Assuming preprocess function returns two numpy arrays
        dates, values = data_manager.preprocess(data)
        preprocessed_data = {
            "dates": dates.tolist(),  # Convert ndarray to list
            "values": values.tolist()  # Convert ndarray to list
        }
        return jsonify(preprocessed_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/get_economic_data/<metric>', methods=['POST'])
def get_economic_data(metric):
    request_data = request.get_json()

    try:
        data = None
        if metric == "Treasury":
            maturity = request_data.get('maturity', '10year')
            if maturity not in ALLOWED_MATURITIES:
                return jsonify({"error": "Invalid maturity"}), 400
            data = get_treasury_data(maturity)
        elif metric == "CPI":
            data = get_cpi_data()
        elif metric == "Inflation":
            data = get_inflation_data()
        elif metric == "FederalFundsRate":
            interval = request_data.get('interval', 'monthly')
            if interval not in ALLOWED_INTERVALS:
                return jsonify({"error": "Invalid interval"}), 400
            data = get_federal_funds_data(interval)
        else:
            return jsonify({"error": "Invalid metric"}), 400
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/stock_statistics', methods=['POST'])
def get_stock_statistics_data():
    stock_symbol = sanitize_stock_symbol(request.json.get('symbol', ''))
    if stock_symbol:
        intraday_data = fetch_intraday_data(stock_symbol)
        statistics_data = compute_statistics(intraday_data)
        return jsonify(statistics_data)
    return jsonify({"error": "Stock symbol not provided"}), 400

@app.route('/predict_stock_data', methods=['POST'])
def predict_stock_data():
    stock_symbol = request.json.get('symbol', '')
    if stock_symbol:
        stock_data = calculate_stock_data(stock_symbol)
        return jsonify(stock_data)
    return jsonify({"error": "Stock symbol not provided"}), 400

@app.route('/calculate_stock_data', methods=['POST'])
def calculate_stock():
    stock_symbol = sanitize_stock_symbol(request.json.get('symbol', ''))
    if stock_symbol:
        stock_data = calculate_stock_data(stock_symbol)
        return jsonify(stock_data)
    return jsonify({"error": "Stock symbol not provided"}), 400

if __name__ == '__main__':
    app.run(debug=True)
