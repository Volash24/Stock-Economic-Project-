# config.py
import os
from dotenv import load_dotenv

# explicitly point at your secrets file:
load_dotenv(dotenv_path="secrets.env")


class Config:
    # Alpha Vantage
    API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "")
    BASE_URL = "https://www.alphavantage.co/query"
    ALLOWED_MATURITIES = ["3month", "2year", "5year", "7year", "10year", "30year"]
    ALLOWED_INTERVALS = ["daily", "weekly", "monthly"]
    FRED_API_KEY = 'b5d4869000f2cdd5f9972cfc41d81b8c'

    # Flask & Security
    DEBUG = os.getenv("DEBUG", "False") == "True"
    SECRET_KEY = os.getenv("SECRET_KEY", "")

    # (Optional) DB / Caching
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///app.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CACHE_TYPE = os.getenv("CACHE_TYPE", "simple")
    CACHE_DEFAULT_TIMEOUT = int(os.getenv("CACHE_DEFAULT_TIMEOUT", "300"))
