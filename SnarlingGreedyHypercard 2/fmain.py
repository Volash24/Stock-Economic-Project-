# fmain.py
import os
from flask import Flask, render_template, request, jsonify, send_from_directory

from config import Config
from services.econdata import (
    get_treasury_data,
    get_federal_funds_data,
    get_inflation_data,
    get_cpi_data
)
from services.four_quadrant import get_macro_analysis
from services.news import get_sa_news
from services.PTC import fetch_intraday_data, compute_statistics
from services.fundamental import calculate_fundamental_analysis as calculate_stock_data

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config.from_object(Config)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/journal.html")
def journal():
    return render_template("journal.html")

@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory("static", filename)

@app.route("/economic_data")
def economic_data():
    maturity = request.args.get("maturity", "10year")
    if maturity not in Config.ALLOWED_MATURITIES:
        return jsonify({"error": "Invalid maturity"}), 400

    interval = request.args.get("interval", "monthly")
    if interval not in Config.ALLOWED_INTERVALS:
        return jsonify({"error": "Invalid interval"}), 400

    try:
        treasury   = get_treasury_data()
        fed_funds  = get_federal_funds_data()
        inflation  = get_inflation_data()
        cpi        = get_cpi_data()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({
        "treasury_yield": treasury,
        "fed_funds_rate": fed_funds,
        "inflation": inflation,
        "CPI": cpi
    })

@app.route("/four_quadrant")
def four_quadrant():
    dummy_growth    = [["2022-01-01", 2.0], ["2024-01-01", 2.8]]
    dummy_inflation = [["2022-01-01", 5.0], ["2024-01-01", 3.0]]
    analysis = get_macro_analysis(dummy_growth, dummy_inflation)
    return jsonify(analysis)

@app.route("/market_news")
def market_news():
    try:
        articles = get_sa_news(limit=10)
        return jsonify({"news": articles})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/fundamental_stock_data/<symbol>")
def fundamental_stock_data(symbol):
    try:
        result = calculate_stock_data(symbol)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/technical_stock_data/<symbol>")
def technical_stock_data(symbol):
    try:
        raw = fetch_intraday_data(symbol)
        intervals = [30, 60, 90, 120, 150]
        stats = compute_statistics(raw, intervals)
        return jsonify({"statistics": stats})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(
        debug=Config.DEBUG,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000))
    )
