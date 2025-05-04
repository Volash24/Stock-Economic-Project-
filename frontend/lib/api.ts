import { getFmpQuote, getFmpHistoricalData } from './fmp'; // Import FMP functions

export interface StockListItem {
  symbol: string
  price: number
  change: number // Represents percentage change
  history: number[]
}

// Define symbols here or import from a central config if preferred
const SYMBOLS_TO_FETCH = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA']; // Example list - adjust as needed

export async function fetchStockList(): Promise<StockListItem[]> {
  // Removed: const res = await fetch(...)

  try {
    const stockListPromises = SYMBOLS_TO_FETCH.map(async (symbol) => {
      // Fetch quote and historical data in parallel for each symbol directly
      const [quote, historyData] = await Promise.all([
        getFmpQuote(symbol),
        // Fetch ~7 days of historical data for the sparkline
        getFmpHistoricalData(symbol, 7) // historyData is already number[]
      ]);

      if (!quote) {
        // If quote fails, skip this stock or return partial data
        console.warn(`Could not fetch quote for ${symbol} in stock list`);
        return null; // Skip this stock if quote is missing
      }

      // Calculate percentage change
      const changePercent = quote.previousClose !== 0
        ? ((quote.price - quote.previousClose) / quote.previousClose) * 100
        : 0;

      // historyData should already be number[] or [] from getFmpHistoricalData
      const historyValues: number[] = historyData || [];

      return {
        symbol: symbol,
        price: quote.price,
        change: changePercent, // Use percentage change
        history: historyValues, // Array of closing prices
      } as StockListItem;
    });

    // Wait for all promises and filter out any null results (failed fetches)
    const stockListResults = (await Promise.all(stockListPromises))
                                .filter((stock): stock is StockListItem => stock !== null);

    return stockListResults; // Return the processed data directly

  } catch (error) {
    console.error('Error fetching stock list directly from FMP helpers:', error);
    // Re-throw or return empty array/handle error as appropriate for the page
    // throw new Error('Failed to fetch stock list data');
    return []; // Return empty array on failure
  }
}

// No changes needed to the interface
