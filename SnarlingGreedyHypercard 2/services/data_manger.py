import numpy as np
import requests
from datetime import datetime
from config import Config

# Pull everything from Config
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
        Fetch data from Alpha Vantage.
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
        Normalize a list of values to [0,1].
        """
        self.min_val, self.max_val = min(values), max(values)
        return [(v - self.min_val) / (self.max_val - self.min_val) for v in values]

    def _parse_date(self, date_string):
        """
        Parse a date string to a datetime object.
        """
        try:
            return datetime.strptime(date_string, "%Y-%m-%d")
        except ValueError:
            return datetime.strptime(date_string, "%Y")

    def months_since_start(self, dates):
        """
        Convert dates to months since the last date.
        """
        start_date = self._parse_date(dates[-1])
        return [
            (self._parse_date(date) - start_date).days / 30
            for date in dates
        ]

    def prepare_data(self, data):
        """
        Build X (years) and y (values) arrays from API response.
        """
        X, y = [], []
        for item in data['data']:
            year = int(item['date'].split('-')[0])
            X.append(year)
            y.append(float(item['value']))
        return X, y

    def preprocess(self, data):
        """
        Normalize and reshape data for modeling.
        """
        dates = [entry['date'] for entry in data['data']]
        values = [float(entry['value']) for entry in data['data']]
        normalized_values = self.normalize(values)
        months_since = self.months_since_start(dates)
        normalized_months = self.normalize(months_since)
        return (
            np.array(normalized_months).reshape(-1, 1),
            np.array(normalized_values).reshape(-1, 1)
        )
