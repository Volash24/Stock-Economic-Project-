# main.py

import json
import numpy as np
import requests
import yfinance as yf

from config import Config
from services.data_manger import DataManager
from services.model_predictions import ModelPredictions
from services.PTC import fetch_intraday_data, compute_statistics
from services.fundamental import calculate_fundamental_analysis

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
# Economic Data CLI
###############################################################################
def handle_economic_data():
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
        1: "Linear Regression"
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
        print("Error fetching data from API.")
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

    residuals = y - model.predict(np.array(X).reshape(-1, 1))
    standard_errors = calculate_standard_error(np.array(X).reshape(-1, 1), residuals)

    if hasattr(model, 'coef_'):
        coefficients = model.coef_
        print("\nModel Coefficients and Standard Errors:")
        for i, (coef, se) in enumerate(zip(coefficients, standard_errors), start=1):
            print(f"Coefficient {i}: {coef}, SE: {se}")
    else:
        print("No coefficients found.")

    print("\nPredictions:")
    for i, pred in enumerate(predictions, start=1):
        print(f"{i}: {pred}")

###############################################################################
# Stock Data CLI
###############################################################################
def handle_stock_data():
    print("\nStock Data Options:")
    print("1. Technical Analysis (intraday)")
    print("2. Fundamental Analysis (EPS, Revenue, etc.)")
    try:
        choice = int(input("Enter your choice: "))
    except ValueError:
        print("Invalid input. Please enter a number.")
        return

    stock_symbol = input("Enter Stock Symbol: ").strip().upper()

    if choice == 1:
        try:
            intraday_data = fetch_intraday_data(stock_symbol)
            intervals = [30, 60, 90, 120, 150]
            stats = compute_statistics(intraday_data, intervals)
            print("\nTechnical Analysis:")
            print(json.dumps(stats, indent=4))
        except Exception as e:
            print(f"Error during technical analysis: {e}")

    elif choice == 2:
        try:
            result = calculate_fundamental_analysis(stock_symbol)
            print("\nFundamental Analysis:")
            print(json.dumps(result, indent=4))
        except Exception as e:
            print(f"Error during fundamental analysis: {e}")
    else:
        print("Invalid choice.")

###############################################################################
# Main CLI Menu
###############################################################################
def main_menu():
    print("\n=== Financial Data Console ===")
    print("1. Economic Data (Treasury, CPI, etc.)")
    print("2. Stock Data (Fundamental or Technical)")
    print("0. Exit")

    try:
        selection = int(input("Choose an option: "))
    except ValueError:
        print("Invalid input.")
        return

    if selection == 1:
        handle_economic_data()
    elif selection == 2:
        handle_stock_data()
    elif selection == 0:
        print("Exiting.")
        exit(0)
    else:
        print("Invalid choice.")

###############################################################################
# Run CLI Loop
###############################################################################
if __name__ == "__main__":
    while True:
        main_menu()
