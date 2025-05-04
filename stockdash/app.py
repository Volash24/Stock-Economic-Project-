from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "Econometrics API is running."

@app.route("/fundamental_stock_data/<symbol>")
def get_fundamental_data(symbol):
    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        price = info.get("regularMarketPrice", None)
        previous_close = info.get("regularMarketPreviousClose", price)
        change_percent = ((price - previous_close) / previous_close * 100) if previous_close else 0

        return jsonify({
            "price": price,
            "change": change_percent
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/technical_stock_data/<symbol>")
def get_technical_data(symbol):
    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period="1mo")

        if hist.empty:
            return jsonify({"statistics": {"30": []}})

        data = [
            [int(date.timestamp() * 1000), row["Close"]]
            for date, row in hist.iterrows()
        ]
        return jsonify({
            "statistics": {
                "30": data[-30:] if len(data) >= 30 else data
            }
        })
    except Exception as e:
        return jsonify({"statistics": {"30": []}, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
