import numpy as np
import requests
from datetime import datetime

# Configuration settings
BASE_URL = 'https://www.alphavantage.co/query'
API_KEY = 'GZC033KC2EKHHQZY'
ALLOWED_MATURITIES = ['3month', '2year', '5year', '7year', '10year', '30year']
ALLOWED_INTERVALS = ['daily', 'weekly', 'monthly']

class DataManager:
    def __init__(self):
        self.min_val = None
        self.max_val = None

    def fetch_data(self, function, **kwargs):
        """
        Fetch data from the API.
        """
        params = {'function': function, 'apikey': API_KEY, 'datatype': 'json'}
        params.update(kwargs)
        response = requests.get(BASE_URL, params=params)
        response.raise_for_status()
        return response.json()

    def normalize(self, values):
        """
        Normalize the given values.
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
        Calculate the number of months since the start date for each date.
        """
        start_date = self._parse_date(dates[-1])
        return [(self._parse_date(date) - start_date).days / 30 for date in dates]

    def prepare_data(self, data):
        """
        Prepare data for analysis.
        """
        X, y = [], []
        for item in data['data']:
            year = int(item['date'].split('-')[0])
            X.append(year)
            y.append(float(item['value']))
        return X, y

    def preprocess(self, data):
        """
        Preprocess the data by normalizing and transforming it.
        """
        dates = [entry['date'] for entry in data['data']]
        values = [float(entry['value']) for entry in data['data']]
        normalized_values = self.normalize(values)
        months_since_start = self.months_since_start(dates)
        normalized_months_since_start = self.normalize(months_since_start)
        return np.array(normalized_months_since_start).reshape(-1, 1), np.array(normalized_values).reshape(-1, 1)
