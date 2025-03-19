#main.py
import datetime
import json
import numpy as np
import requests
import statsmodels.api as sm
import yfinance as yf
from data_manger import ALLOWED_INTERVALS, ALLOWED_MATURITIES
from data_manger import DataManager

from model_predictions import ModelPredictions
from PTC import fetch_intraday_data, compute_statistics

# Function to calculate standard error
def calculate_standard_error(X, residuals):
    rss = np.sum(residuals ** 2)
    dof = X.shape[0] - X.shape[1] - 1
    mse = rss / dof
    cov_matrix = mse * np.linalg.inv(np.dot(X.T, X))
    standard_errors = np.sqrt(np.diag(cov_matrix))
    return standard_errors

# Function to calculate stock data
def calculate_stock_data(stock_symbol):
    start_date = datetime.datetime.now() - datetime.timedelta(days=365)
    end_date = datetime.datetime.now()
    stock_data = yf.download(stock_symbol, start=start_date, end=end_date)

    if stock_data.empty:
        return "No stock data available for the given symbol."

    high_52_weeks = stock_data["High"].max()
    low_52_weeks = stock_data["Low"].min()
    average_30_days_close = stock_data["Close"].tail(30).mean()
    average_30_days_volume = stock_data["Volume"].tail(30).mean()

    api_key = "GZC033KC2EKHHQZY"  # Replace with your Alpha Vantage API key
    url = f"https://www.alphavantage.co/query?function=OVERVIEW&symbol={stock_symbol}&apikey={api_key}"
    response = requests.get(url)
    data = response.json()
    total_shares = float(data.get("SharesOutstanding", 0))

    forecasted_movement = (average_30_days_volume / total_shares) * average_30_days_close
    thirty_day_strike = average_30_days_close - ((high_52_weeks + low_52_weeks) / 2)
    yearly_return = thirty_day_strike * forecasted_movement
    two_week_strike = thirty_day_strike - yearly_return
    average_move_7_14_days = abs((two_week_strike - thirty_day_strike) / 7)

    formatted_volume = "{:,.0f}".format(average_30_days_volume)
    formatted_outstanding_shares = "{:,.0f}".format(total_shares)

    response_data = {
        "Stock Symbol": stock_symbol,
        "52-Week High": high_52_weeks,
        "52-Week Low": low_52_weeks,
        "30-Day Average Close Price": average_30_days_close,
        "30-Day Average Volume": formatted_volume,
        "Total Outstanding Shares": formatted_outstanding_shares,
        "30-Day Strike": thirty_day_strike,
        "Yearly Return": yearly_return,
        "Two-Week Strike": two_week_strike,
    }

    return response_data

# Function to get data and predict
def get_data_and_predict():
    metric_choices = {
        1: "Treasury Yield",
        2: "Federal Funds Rate",
        3: "Consumer Price Index (CPI)",
        4: "Inflation",
        5: "Stock Data"
    }

    choice_functions = {
        1: ("TREASURY_YIELD", {"interval": ALLOWED_INTERVALS, "maturity": ALLOWED_MATURITIES}),
        2: ("FEDERAL_FUNDS_RATE", {"interval": ALLOWED_INTERVALS}),
        3: ("CPI", {"interval": ALLOWED_INTERVALS}),
        4: ("INFLATION", {}),
        5: ("STOCK_DATA", {})
    }

    model_choices = {
        1: "Linear Regression",
      
    }

    print("Choose the metric:")
    for key, value in metric_choices.items():
        print(f"{key}. {value}")

    metric_choice = int(input("Enter your choice: "))
    if metric_choice not in metric_choices:
        print("Invalid metric choice!")
        return

    if metric_choice == 5:
        stock_symbol = input("Enter Stock Symbol: ")
        try:
            intraday_data = fetch_intraday_data(stock_symbol)
            statistics_data = compute_statistics(intraday_data, [30, 60, 90, 120, 150])
            current_price = statistics_data[30]['Mean']  # Assuming current price is the mean of last 30 data points
            print("Current Stock Price:", current_price)
            print("Other Statistics:", json.dumps(statistics_data, indent=4))
        except Exception as e:
            print(f"An error occurred: {e}")
        return


    function, parameters = choice_functions[metric_choice]
    kwargs = {}
    for param, options in parameters.items():
        user_input = input(f"Enter {param} ({', '.join(options)}): ")
        while user_input not in options:
            print(f"Invalid {param}!")
            user_input = input(f"Enter {param} ({', '.join(options)}): ")
        kwargs[param] = user_input

    data = DataManager.api_call(function, **kwargs)
    print(json.dumps(data, indent=4))
    X, y = DataManager.prepare_data(data)

    print("Choose the prediction model:")
    for key, value in model_choices.items():
        print(f"{key}. {value}")

    model_choice = int(input("Enter your choice: "))
    if model_choice not in model_choices:
        print("Invalid model choice!")
        return

    selected_model_type = model_choices[model_choice]
    model, predictions = ModelPredictions.train_and_predict(selected_model_type, data)
    residuals = y - model.predict(X)
    standard_errors = calculate_standard_error(X, residuals)

    coefficients = model.coef_
    print("Model Coefficients and Standard Errors:")
    for i, (coef, se) in enumerate(zip(coefficients, standard_errors), start=1):
        print(f"Coefficient {i}: {coef}, Standard Error: {se}")

    print("Model Predictions:")
    for i, pred in enumerate(predictions, start=1):
        print(f"Prediction {i}: {pred}")

if __name__ == "__main__":
    try:
        get_data_and_predict()
    except requests.RequestException:
        print("Error in fetching data from the API!")
    except ValueError as ve:
        print(f"Data validation error: {ve}")
    except Exception as e:
        print(f"An error occurred: {e}")
