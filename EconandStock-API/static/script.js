document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('stock-data-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const stockSymbol = document.getElementById('stock-symbol').value;
      fetchAndDisplayData(`/get_stock_data/${stockSymbol}`, 'stock-data-results');
  });

  document.getElementById('treasury-data-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const maturity = document.getElementById('treasury-maturity').value;
      fetchAndDisplayData(`/treasury_data?maturity=${maturity}`, 'treasury-data-results');
  });

  document.getElementById('federal-funds-data-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const interval = document.getElementById('federal-funds-interval').value;
      fetchAndDisplayData(`/federal_funds_data?interval=${interval}`, 'federal-funds-data-results');
  });

  document.getElementById('cpi-data-form').addEventListener('submit', function(e) {
      e.preventDefault();
      fetchAndDisplayData(`/cpi_data`, 'cpi-data-results');
  });

  // Corrected the event listener for the inflation data form
  document.getElementById('inflation-data-form').addEventListener('submit', function(e) {
      e.preventDefault();
      fetchAndDisplayData('/inflation_data', 'inflation-data-results');
  });
  document.getElementById('market-news-btn').addEventListener('click', function(e) {
    e.preventDefault();
    fetchAndDisplayData('/market_news', 'market-news-results');
    });


});

function fetchAndDisplayData(url, resultDivId) {
  const resultsDiv = document.getElementById(resultDivId);
  resultsDiv.innerHTML = '<p>Loading data...</p>'; // Show loading message

  fetch(url)
      .then(response => response.json())
      .then(data => {
          displayData(data, resultDivId);
      })
      .catch(error => {
        resultsDiv.innerHTML = `<p>Error loading data: ${error}</p>`; // Show error message
    });
}

function displayData(data, resultDivId) {
  const resultsDiv = document.getElementById(resultDivId);
  resultsDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}
