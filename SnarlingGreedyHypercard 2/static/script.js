// static/script.js

document.addEventListener('DOMContentLoaded', () => {
  // 1. Dynamically load TradingView library and initialize default chart
  const tvScript = document.createElement('script');
  tvScript.src = 'https://s3.tradingview.com/tv.js';
  tvScript.onload = () => initTradingView('SPY');
  document.head.appendChild(tvScript);

  // 2. Function to initialize or update the TradingView widget
  function initTradingView(symbol) {
    if (typeof TradingView === 'undefined') return;
    const container = document.getElementById('tv_chart');
    if (!container) return;
    container.innerHTML = ''; // clear any previous widget
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

  // 3. Helper to display JSON data in a <pre> block
  function displayData(data, divId) {
    const output = document.getElementById(divId);
    if (!output) return;
    output.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }

  // 4. Stock Data form handler
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

  // 5. Generic binder for economic data forms
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

  // Bind treasury yield
  bindForm(
    'treasury-data-form',
    () => `/economic_data?maturity=${encodeURIComponent(document.getElementById('treasury-maturity').value)}&interval=monthly`,
    'treasury-data-results',
    'Loading treasury yields...'
  );

  // Bind federal funds rate
  bindForm(
    'federal-funds-data-form',
    () => `/economic_data?maturity=10year&interval=${encodeURIComponent(document.getElementById('federal-funds-interval').value)}`,
    'federal-funds-data-results',
    'Loading fed funds rate...'
  );

  // Bind CPI
  bindForm(
    'cpi-data-form',
    () => '/economic_data?maturity=10year&interval=monthly',
    'cpi-data-results',
    'Loading CPI data...'
  );

  // Bind inflation
  bindForm(
    'inflation-data-form',
    () => '/economic_data?maturity=10year&interval=monthly',
    'inflation-data-results',
    'Loading inflation data...'
  );

  // 6. Macro quadrant button
  const quadBtn = document.getElementById('quad-btn');
  if (quadBtn) {
    quadBtn.addEventListener('click', e => {
      e.preventDefault();
      const out = document.getElementById('quad-results');
      out.innerHTML = '<p>Loading macro quadrant...</p>';
      fetch('/four_quadrant')
        .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
        .then(json => displayData(json, 'quad-results'))
        .catch(err => {
          out.innerHTML = `<p style="color:red;">Error: ${err}</p>`;
        });
    });
  }

  // 7. Market news sidebar button
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
