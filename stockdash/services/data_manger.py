# services/data_manger.py

import numpy as np
import requests
from datetime import datetime
from config import Config

# Config-driven constants
BASE_URL = Config.BASE_URL
API_KEY = Config.API_KEY
ALLOWED_MATURITIES = Config.ALLOWED_MATURITIES
ALLOWED_INTERVALS = Config.ALLOWED_INTERVALS


class DataManager:
    def __init__(self):
        self.min_val = None
        self.max_val = None

    def fetch_data(self, function, **kwargs):
        """
        Fetch data from Alpha Vantage (or other services via BASE_URL).
        Example: function='TREASURY_YIELD', maturity='10year', interval='monthly'
        """
        params = {
            'function': function,
            'apikey': API_KEY,
            'datatype': 'json'
        }
        params.update(kwargs)
        response = requests.get(BASE_URL, params=params)
        response.raise_for_status()
        return response.json()

    def normalize(self, values):
        """
        Normalize values to [0, 1] using min-max scaling.
        """
        self.min_val, self.max_val = min(values), max(values)
        return [(v - self.min_val) / (self.max_val - self.min_val) for v in values]

    def _parse_date(self, date_string):
        """
        Try parsing 'YYYY-MM-DD' or 'YYYY' formatted dates.
        """
        for fmt in ("%Y-%m-%d", "%Y"):
            try:
                return datetime.strptime(date_string, fmt)
            except ValueError:
                continue
        raise ValueError(f"Invalid date format: {date_string}")

    def months_since_start(self, dates):
        """
        Convert date list into # of months since the most recent date.
        Most recent date is treated as the origin (0).
        """
        base_date = self._parse_date(dates[-1])
        return [(self._parse_date(date) - base_date).days / 30 for date in dates]

    def prepare_data(self, data):
        """
        Prepare clean X (independent) and y (dependent) data arrays from time-series input.
        Designed for use in regression or modeling.

        Input:
        {
          "data": [
            {"date": "2023-01-01", "value": "4.1"},
            {"date": "2022-01-01", "value": "3.9"},
            ...
          ]
        }

        Output:
            X: time (years or months since base)
            y: numeric value
        """
        raw = data['data']
        raw = sorted(raw, key=lambda x: x['date'])  # Ensure oldest to newest

        dates = [entry['date'] for entry in raw]
        values = [float(entry['value']) for entry in raw]

        # Feature: months since most recent observation
        X = self.months_since_start(dates)
        y = values

        return X, y

    def preprocess(self, data):
        """
        Same as prepare_data but normalized and reshaped for ML models like sklearn.
        Returns: normalized time (X), normalized values (y)
        """
        X_raw, y_raw = self.prepare_data(data)
        X_scaled = self.normalize(X_raw)
        y_scaled = self.normalize(y_raw)

        return (
            np.array(X_scaled).reshape(-1, 1),
            np.array(y_scaled).reshape(-1, 1)
        )
