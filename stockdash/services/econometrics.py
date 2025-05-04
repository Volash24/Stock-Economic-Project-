import yfinance as yf
import pandas as pd
import statsmodels.api as sm
from datetime import datetime, timedelta


def run_ols_model(stock_symbol: str, index_symbol: str = "^GSPC", period="6mo"):
  stock = yf.download(stock_symbol, period=period)["Adj Close"]
  index = yf.download(index_symbol, period=period)["Adj Close"]

  df = pd.DataFrame({
      "stock": stock.pct_change().dropna(),
      "index": index.pct_change().dropna()
  }).dropna()

  X = sm.add_constant(df["index"])
  model = sm.OLS(df["stock"], X).fit()
  return {
      "alpha": model.params["const"],
      "beta": model.params["index"],
      "r_squared": model.rsquared,
      "summary": model.summary().as_text()
  }


from statsmodels.tsa.arima.model import ARIMA

def run_arima_forecast(stock_symbol: str, period="3mo"):
    stock = yf.download(stock_symbol, period=period)["Adj Close"].dropna()

    # Fit ARIMA(p,d,q) model (keep simple: ARIMA(1,1,1))
    model = ARIMA(stock, order=(1, 1, 1))
    fitted_model = model.fit()

    forecast = fitted_model.forecast(steps=1)
    return {
        "latest_price": stock.iloc[-1],
        "next_day_forecast": forecast.iloc[0],
        "model_summary": fitted_model.summary().as_text()
    }
