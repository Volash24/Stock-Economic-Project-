def build_full_report(symbol):
  fundamentals = get_fundamentals(symbol)
  regression = run_model(symbol)
  macro = get_macro_summary()

  return {
      "Symbol": symbol,
      "Fundamentals": format_fundamentals(fundamentals),
      "Model": to_markdown(format_regression_output(regression)),
      "Macro": format_macro_data(**macro)
  }
