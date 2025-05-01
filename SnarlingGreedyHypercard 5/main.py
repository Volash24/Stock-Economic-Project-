# main.py

import datetime
import json
import numpy as np
import requests
import yfinance as yf

# Import config and modules from the services folder
from config import Config
from services.data_manger import DataManager
from services.model_predictions import ModelPredictions
from services.PTC import fetch_intraday_data, compute_statistics

###############################################################################
# Utility Function for Standard Error
###############################################################################
def calculate_standard_error(X, residuals):
    rss = np.sum(residuals ** 2)
    dof = X.shape[0] - X.shape[1] - 1
    mse = rss / dof
    cov_matrix = mse * np.linalg.inv(np.dot(X.T, X))
    standard_errors = np.sqrt(np.diag(cov_matrix))
    return standard_errors

###############################################################################
# Economic Data Section
###############################################################################
def handle_economic_data():
    """
    Provides a console-based interface for fetching treasury yields, fed funds,
    CPI, or inflation data, then optionally performing a model prediction.
    """
    metric_choices = {
        1: "Treasury Yield",
        2: "Federal Funds Rate",
        3: "Consumer Price Index (CPI)",
        4: "Inflation"
    }

    choice_functions = {
        1: ("TREASURY_YIELD", {"interval": Config.ALLOWED_INTERVALS, "maturity": Config.ALLOWED_MATURITIES}),
        2: ("FEDERAL_FUNDS_RATE", {"interval": Config.ALLOWED_INTERVALS}),
        3: ("CPI", {"interval": Config.ALLOWED_INTERVALS}),
        4: ("INFLATION", {})
    }

    model_choices = {
        1: "Linear Regression",
        # 2: "ARIMA" (if you decide to add ARIMA)
    }

    print("\nChoose the Economic Metric:")
    for key, value in metric_choices.items():
        print(f"{key}. {value}")

    try:
        metric_choice = int(input("Enter your choice: "))
    except ValueError:
        print("Invalid input. Please enter a number.")
        return

    if metric_choice not in metric_choices:
        print("Invalid metric choice!")
        return

    function, parameters = choice_functions[metric_choice]
    kwargs = {}
    for param, options in parameters.items():
        user_input = input(f"Enter {param} ({', '.join(options)}): ")
        while user_input not in options:
            print(f"Invalid {param}!")
            user_input = input(f"Enter {param} ({', '.join(options)}): ")
        kwargs[param] = user_input

    data_manager = DataManager()
    try:
        data = data_manager.fetch_data(function, **kwargs)
        print(json.dumps(data, indent=4))
    except requests.RequestException:
        print("Error in fetching data from the API!")
        return

    X, y = DataManager.prepare_data(data)

    print("\nChoose the prediction model:")
    for key, value in model_choices.items():
        print(f"{key}. {value}")

    try:
        model_choice = int(input("Enter your choice: "))
    except ValueError:
        print("Invalid input. Please enter a number.")
        return

    if model_choice not in model_choices:
        print("Invalid model choice!")
        return

    selected_model_type = model_choices[model_choice]
    model, predictions = ModelPredictions.train_and_predict(selected_model_type, data)

    # Compute residuals and standard errors
    residuals = y - model.predict(X)
    standard_errors = calculate_standard_error(X, residuals)

    if hasattr(model, 'coef_'):
        coefficients = model.coef_
        print("\nModel Coefficients and Standard Errors:")
        for i, (coef, se) in enumerate(zip(coefficients, standard_errors), start=1):
            print(f"Coefficient {i}: {coef}, Standard Error: {se}")
    else:
        print("No coefficient attributes found for this model type.")

    print("\nModel Predictions:")
    for i, pred in enumerate(predictions, start=1):
        print(f"Prediction {i}: {pred}")

###############################################################################
# Stock Data Section
###############################################################################
def handle_stock_data():
    """
    Provides a console-based interface for choosing either technical
    or fundamental analysis for a given stock symbol.
    """
    print("\nStock Data Options:")
    print("1. Technical Analysis (Intraday stats, etc.)")
    print("2. Fundamental Analysis (yfinance, alpha vantage fundamentals)")
    try:
        choice = int(input("Enter your choice: "))
    except ValueError:
        print("Invalid input. Please enter a number.")
        return

    stock_symbol = input("Enter Stock Symbol: ")

    if choice == 1:
        # Technical Analysis
        try:
            intraday_data = fetch_intraday_data(stock_symbol)
            intervals = [30, 60, 90, 120, 150]
            statistics_data = compute_statistics(intraday_data, intervals)

            # Example: Print out the mean of the last 30 data points
            current_price = statistics_data[30]['Mean']
            print("\nTechnical Analysis:")
            print(f"Current Stock Price (approx): {current_price}")
            print("Statistical Breakdown:", json.dumps(statistics_data, indent=4))
        except Exception as e:
            print(f"An error occurred: {e}")

    elif choice == 2:
        # Fundamental Analysis
        result = calculate_stock_data(stock_symbol)
        if isinstance(result, dict):
            print("\nFundamental Analysis Results:")
            for k, v in result.items():
                print(f"{k}: {v}")
        else:
            print(result)
    else:
        print("Invalid choice for stock data analysis.")

###############################################################################
# Main Menu
###############################################################################
def main_menu():
    """
    Main console menu for the user to choose between economic data or stock data.
    """
    print("\nWelcome to the Financial Data Analysis Console!")
    print("1. Economic Data (Treasury, Fed Funds, CPI, Inflation)")
    print("2. Stock Data (Technical or Fundamental)")
    print("0. Exit")

    try:
        selection = int(input("Enter your choice: "))
    except ValueError:
        print("Invalid input. Please enter a number.")
        return

    if selection == 1:
        handle_economic_data()
    elif selection == 2:
        handle_stock_data()
    elif selection == 0:
        print("Exiting. Have a great day!")
    else:
        print("Invalid selection.")

###############################################################################
# Entry Point
###############################################################################
if __name__ == "__main__":
    while True:
        main_menu()
        # Optionally, break if you only want one loop:
        # break
