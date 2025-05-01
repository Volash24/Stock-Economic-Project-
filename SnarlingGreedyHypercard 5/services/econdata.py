# services/econdata.py
import requests
from datetime import datetime, timedelta
import logging
from services.data_manger import API_KEY
# services/econdata.py

from fredapi import Fred
from config import Config

class EconomicDataFetcher:
    def __init__(self):
        self.fred = Fred(api_key=Config.FRED_API_KEY)

    def get_cpi_yoy(self, periods=12):
        """
        Fetch CPI YoY % from CPIAUCSL.
        """
        series = self.fred.get_series("CPIAUCSL")
        cpi_yoy = series.pct_change(periods=periods) * 100
        return round(cpi_yoy.dropna().iloc[-1], 2)

    def get_treasury_yield(self, maturity="10y"):
        """
        Fetch real-time Treasury Yield based on maturity.
        Accepted: 3m, 6m, 1y, 2y, 3y, 5y, 7y, 10y, 20y, 30y
        """
        maturity_map = {
            "3m": "GS3M",
            "6m": "GS6M",
            "1y": "GS1",
            "2y": "GS2",
            "3y": "GS3",
            "5y": "GS5",
            "7y": "GS7",
            "10y": "GS10",
            "20y": "GS20",
            "30y": "GS30"
        }
        code = maturity_map.get(maturity.lower())
        if not code:
            raise ValueError(f"Unsupported maturity: {maturity}")
        series = self.fred.get_series(code)
        return round(series.dropna().iloc[-1], 2)

    def get_fed_funds_rate(self, interval="monthly"):
        """
        Fetch Fed Funds Rate based on interval: daily, weekly, or monthly.
        """
        interval_map = {
            "daily": "DFF",
            "weekly": "WDFRAL",
            "monthly": "FEDFUNDS"
        }
        code = interval_map.get(interval.lower())
        if not code:
            raise ValueError(f"Unsupported interval: {interval}")
        series = self.fred.get_series(code)
        return round(series.dropna().iloc[-1], 2)

    def format_macro_data(self, cpi, fed, treasury):
        return (
            f"### Macro Summary\n"
            f"- CPI (YoY): **{cpi}%**\n"
            f"- Fed Funds Rate: **{fed}%**\n"
            f"- Treasury Yield: **{treasury}%**"
        )
