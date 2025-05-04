from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from services.fundamental import calculate_fundamental_analysis
from services.econdata import EconomicDataFetcher
from services.news import get_news
from services.four_quadrant import get_macro_analysis
from services.quadrant_visual import draw_macro_quadrant_box
from services.PTC import fetch_intraday_data, compute_statistics
import os

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)  # Allow frontend requests
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
    try:
        fetcher = EconomicDataFetcher()
        data_type = request.args.get("type")
        maturity = request.args.get("maturity", "10y")
        interval = request.args.get("interval", "monthly")

        if data_type == "cpi":
            value = fetcher.get_cpi_yoy()
            label = "CPI YoY (%)"
        elif data_type == "treasury":
            value = fetcher.get_treasury_yield(maturity)
            label = f"Treasury Yield ({maturity})"
        elif data_type == "fed_funds":
            value = fetcher.get_fed_funds_rate(interval)
            label = f"Fed Funds Rate ({interval})"
        else:
            return jsonify({"error": "Invalid type"}), 400

        return jsonify({"label": label, "value": value})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/fundamental_stock_data/<symbol>")
def fundamental_stock_data(symbol):
    try:
        result = calculate_fundamental_analysis(symbol)
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

@app.route("/four_quadrant")
def four_quadrant():
    try:
        analysis = get_macro_analysis()
        return jsonify(analysis)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/macro_box")
def macro_box():
    try:
        data = get_macro_analysis()
        image_path = draw_macro_quadrant_box(
            growth=data["growth_rate"],
            inflation=data["inflation_rate"]
        )
        return jsonify({
            "img": f"/{image_path}",
            "quadrant": data["quadrant"],
            "description": data["description"]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/market_news")
def market_news():
    try:
        return jsonify(get_news())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(
        debug=Config.DEBUG,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000))
    )
