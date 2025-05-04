// static/script.js

document.addEventListener('DOMContentLoaded', () => {

  // === 1. Load TradingView chart ===
  const tvScript = document.createElement('script');
  tvScript.src = 'https://s3.tradingview.com/tv.js';
  tvScript.onload = () => initTradingView('SPY');
  document.head.appendChild(tvScript);

  function initTradingView(symbol) {
    if (typeof TradingView === 'undefined') return;
    const container = document.getElementById('tv_chart');
    if (!container) return;
    container.innerHTML = '';
    new TradingView.widget({
      container_id: 'tv_chart',
      width: '100%',
      height: 400,
      symbol: symbol.toUpperCase(),
      interval: 'D',
      timezone: 'America/Denver',
      theme: 'light',
      style: '1',
      toolbar_bg: '#f1f3f6',
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: true
    });
  }

  // === 2. JSON output helper ===
  function displayData(data, divId) {
    const output = document.getElementById(divId);
    if (!output) return;
    output.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }

  // === 3. Stock Data handler ===
  const stockForm = document.getElementById('stock-data-form');
  if (stockForm) {
    stockForm.addEventListener('submit', e => {
      e.preventDefault();
      const symbol = document.getElementById('stock-symbol').value.trim().toUpperCase();
      if (!symbol) return alert('Please enter a stock symbol.');
      const out = document.getElementById('stock-data-results');
      out.innerHTML = '<p>Loading stock data...</p>';
      fetch(`/fundamental_stock_data/${encodeURIComponent(symbol)}`)
        .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
        .then(json => {
          displayData(json, 'stock-data-results');
          initTradingView(symbol);
        })
        .catch(err => {
          out.innerHTML = `<p style="color:red;">Error: ${err}</p>`;
        });
    });
  }

  // === 4. Reusable economic data binder ===
  function bindForm(formId, urlFn, outId, loadingText) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const out = document.getElementById(outId);
      out.innerHTML = `<p>${loadingText}</p>`;
      fetch(urlFn())
        .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
        .then(json => displayData(json, outId))
        .catch(err => {
          out.innerHTML = `<p style="color:red;">Error: ${err}</p>`;
        });
    });
  }

  // Treasury
  bindForm(
    'treasury-data-form',
    () => {
      const maturity = document.getElementById('treasury-maturity').value;
      return `/economic_data?type=treasury&maturity=${encodeURIComponent(maturity)}`;
    },
    'treasury-data-results',
    'Loading treasury yields...'
  );

  // Fed Funds Rate
  bindForm(
    'federal-funds-data-form',
    () => {
      const interval = document.getElementById('federal-funds-interval').value;
      return `/economic_data?type=fed_funds&interval=${encodeURIComponent(interval)}`;
    },
    'federal-funds-data-results',
    'Loading Fed Funds Rate...'
  );

  // CPI
  bindForm(
    'cpi-data-form',
    () => `/economic_data?type=cpi`,
    'cpi-data-results',
    'Loading CPI YoY data...'
  );

  // === 5. Macro Quadrant (with image) ===
  const quadBtn = document.getElementById('quad-btn');
  if (quadBtn) {
    quadBtn.addEventListener('click', e => {
      e.preventDefault();
      const out = document.getElementById('quad-results');
      const img = document.getElementById('macro-box-img');
      out.innerHTML = '<p>Loading macro quadrant...</p>';
      img.style.display = 'none';
      fetch('/macro_box')
        .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
        .then(json => {
          displayData(json, 'quad-results');
          if (json.img) {
            img.src = json.img;
            img.style.display = 'block';
          }
        })
        .catch(err => {
          out.innerHTML = `<p style="color:red;">Error: ${err}</p>`;
        });
    });
  }

  // === 6. Market News ===
  const newsBtn = document.getElementById('news-btn');
  if (newsBtn) {
    newsBtn.addEventListener('click', e => {
      e.preventDefault();
      const out = document.getElementById('news-results');
      out.innerHTML = '<p>Loading market news...</p>';
      fetch('/market_news')
        .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
        .then(json => {
          if (json.news && json.news.length) {
            out.innerHTML = json.news
              .map(item =>
                `<p><a href="${item.link}" target="_blank">${item.title}</a><br><small>${item.published}</small></p>`
              )
              .join('');
          } else {
            out.innerHTML = '<p>No news available.</p>';
          }
        })
        .catch(err => {
          out.innerHTML = `<p style="color:red;">Error: ${err}</p>`;
        });
    });
  }

});
