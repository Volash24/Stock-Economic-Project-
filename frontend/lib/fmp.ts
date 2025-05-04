import { type Candle } from "@/components/chart/CandlestickChart";
import { UTCTimestamp } from "lightweight-charts";
import Redis from 'ioredis';
import { URLSearchParams } from "url";

const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";
// Ensure your FMP API key is set in your environment variables
const API_KEY = process.env.FMP_API_KEY;

// Initialize Redis client (similar to other libs)
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => console.error('Redis Client Error (FMP):', err));

if (!API_KEY) {
  console.warn("FMP API key is missing. Please set the FMP_API_KEY environment variable.");
  // Potentially throw an error or provide a default behavior if needed
}

/**
 * Appends the API key to a given URL.
 * @param url The URL to append the API key to.
 * @returns The URL with the API key appended.
 */
const withApiKey = (url: string): string => {
  // Ensure API_KEY check happens before usage
  if (!API_KEY) {
      throw new Error("FMP API key is missing. Cannot make requests.");
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}apikey=${API_KEY}`;
};

// Helper function to handle fetch requests and caching for FMP
async function fetchFmpWithCache(
  endpointPath: string, // e.g., /profile/AAPL or /historical-price-eod/AAPL
  params: Record<string, string | number> = {}, // Optional query params
  revalidateSeconds: number = 900 // Default cache TTL set to 15 minutes
): Promise<any> {

  // 1. Generate a consistent cache key
  const sortedParamString = Object.entries(params)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  const cacheKey = `fmpcache:${endpointPath}:${sortedParamString}`;

  // 2. Check Redis cache first
  if (!process.env.DISABLE_REDIS_CACHE) {
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log(`Redis cache hit for ${cacheKey}`);
        return JSON.parse(cachedData);
      }
      console.log(`Redis cache miss for ${cacheKey}`);
    } catch (redisError) {
      console.error(`Redis GET error for ${cacheKey}. Proceeding without cache. Error:`, redisError);
    }
  } else {
    console.log('Redis cache is disabled via environment variable.');
  }

  // 3. Cache Miss or Redis Disabled: Fetch from FMP API
  const queryParams = new URLSearchParams(params as Record<string, string>).toString();
  const url = withApiKey(`${FMP_BASE_URL}${endpointPath}${queryParams ? '?' + queryParams : ''}`);

  console.log(`Fetching FMP: ${url}`); // Log the URL being fetched

  try {
    const response = await fetch(url);

    if (!response.ok) {
        const errorBody = await response.text();
        // Check for FMP specific rate limit or error messages if applicable
        // Example: FMP might return a specific message in the body for rate limits
        if (response.status === 429 || errorBody.includes("Limit Reach")) {
             console.error(`FMP Rate Limit Hit for ${url}: ${response.status} ${errorBody}`);
             // Decide on retry logic or just throwing an error
             throw new Error(`FMP API request failed: Rate limit likely hit.`);
        }
        console.error(
          `FMP API Error (${response.status}) for ${url}: ${response.statusText}. Body: ${errorBody}`
        );
        throw new Error(
          `FMP API request failed with status ${response.status}: ${response.statusText}`
        );
    }

    const data = await response.json();

    // Check for potential errors within the JSON response itself if FMP uses that pattern
    // e.g., if (data["Error Message"]) { ... throw ... }

    // --- ADD CHECK: Prevent caching empty array for historical data ---
    // Treat '[]' from historical endpoint as a failure, preventing cache pollution.
    if (endpointPath.startsWith('/historical-price-eod/') && Array.isArray(data) && data.length === 0) {
      console.warn(`Received empty array from FMP endpoint ${endpointPath}, treating as fetch failure, not caching.`);
      // Throw an error to prevent caching and signal failure to the caller.
      // The caller (getFmpHistoricalData) will catch this and return [] appropriately.
      throw new Error(`FMP endpoint ${endpointPath} returned an unexpected empty array.`);
    }
    // --- END CHECK ---

    // 4. Store successful response in Redis cache
    if (!process.env.DISABLE_REDIS_CACHE) {
      try {
        // This code now only runs if the data wasn't an empty array for historical endpoint
        await redis.set(cacheKey, JSON.stringify(data), 'EX', revalidateSeconds);
        console.log(`Stored successful FMP response in Redis cache for ${cacheKey} with TTL ${revalidateSeconds}s`);
      } catch (redisError) {
        console.error(`Redis SET error for ${cacheKey}. Data fetched but not cached. Error:`, redisError);
      }
    }

    return data;

  } catch (error) {
    console.error(`Error in fetchFmpWithCache for ${url}:`, error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

// --- Type Definitions (Based on fmp.md and common usage) ---

interface FmpProfile {
  symbol: string;
  price: number;
  beta: number;
  volAvg: number;
  mktCap: number;
  lastDiv: number;
  range: string; // e.g., "164.08-199.62"
  changes: number;
  companyName: string;
  currency: string;
  cik: string;
  isin: string;
  cusip: string;
  exchange: string;
  exchangeShortName: string;
  industry: string;
  website: string;
  description: string;
  ceo: string;
  sector: string;
  country: string;
  fullTimeEmployees: string; // Note: API returns string
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  dcfDiff: number;
  dcf: number;
  image: string;
  ipoDate: string; // e.g., "1980-12-12"
  defaultImage: boolean;
  isEtf: boolean;
  isActivelyTrading: boolean;
  isAdr: boolean;
  isFund: boolean;
  // Add other fields as needed from the Profile endpoint
}

interface FmpQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  exchange: string;
  volume: number;
  avgVolume: number;
  open: number;
  previousClose: number;
  eps: number | null;
  pe: number | null;
  earningsAnnouncement: string | null; // e.g., "2023-11-02T16:30:00.000+0000"
  sharesOutstanding: number;
  timestamp: number;
}

interface FmpHistoricalPrice {
  date: string; // "YYYY-MM-DD"
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
  unadjustedVolume: number;
  change: number;
  changePercent: number;
  vwap: number;
  label: string; // e.g., "December 12, 1980"
  changeOverTime: number;
}

interface FmpHistoricalResponse {
    symbol: string;
    historical: FmpHistoricalPrice[];
}

// +++ START NEW FMP INTRADAY TYPES +++
interface FmpHistoricalChartItem {
  date: string; // "YYYY-MM-DD HH:MM:SS"
  open: number;
  low: number;
  high: number;
  close: number;
  volume: number;
}
// +++ END NEW FMP INTRADAY TYPES +++


// --- API Functions (Now using fetchFmpWithCache) ---

/**
 * Fetches company profile information.
 * Ref: /stable/profile?symbol=AAPL
 * @param symbol - The stock symbol.
 * @returns The company profile data.
 */
export const getFmpProfile = async (symbol: string): Promise<FmpProfile | null> => {
  try {
    // FMP returns an array for profile endpoint
    const data: FmpProfile[] = await fetchFmpWithCache(`/profile/${symbol}`, {}, 3600); // Cache profile for 1 hour
    return data?.[0] || null; // Return the first element or null
  } catch (error) {
    console.error(`Failed to get FMP profile for ${symbol}:`, error);
    return null;
  }
};

/**
 * Fetches real-time stock quote.
 * Ref: /stable/quote?symbol=AAPL
 * @param symbol - The stock symbol.
 * @returns The stock quote data.
 */
export const getFmpQuote = async (symbol: string): Promise<FmpQuote | null> => {
    try {
        // FMP returns an array for quote endpoint
        const data: FmpQuote[] = await fetchFmpWithCache(`/quote/${symbol}`, {}, 900); // Cache quote for 15 mins
        return data?.[0] || null; // Return the first element or null
    } catch (error) {
        console.error(`Failed to get FMP quote for ${symbol}:`, error);
        return null;
    }
};

/**
 * Fetches daily historical stock data (EOD prices).
 * Ref: /stable/historical-price-eod/full?symbol=AAPL
 * We'll adapt the FMP response to the Candle format expected by the chart component.
 * @param symbol - The stock symbol.
 * @param limit - Optional limit for number of historical data points. Applied *after* fetch.
 * @returns An array of closing prices for the sparkline.
 */
export const getFmpHistoricalData = async (symbol: string, limit?: number): Promise<number[]> => {
  // Note: FMP free plan might have limitations on historical data range.
  // Consider adding 'from'/'to' params to fetchFmpWithCache if needed for paid plans.
  // Caching historical data: Use a longer TTL as EOD data doesn't change intraday.
  const cacheTTL = 43200; // 12 hours
  const dataPointsToFetch = 35; // Fetch slightly more than limit in case of weekends/holidays

  try {
    // --- Use the standard EOD endpoint with timeseries param ---
    // Expecting response like: { symbol: string, historical: FmpHistoricalPrice[] }
    const data: FmpHistoricalResponse = await fetchFmpWithCache(
        `/historical-price-eod/${symbol}`, 
        { timeseries: dataPointsToFetch }, // Request specific number of data points
        cacheTTL
    );
    // --- END ENDPOINT CHANGE ---

    // --- BEGIN MODIFIED LOGGING & VALIDATION for standard endpoint ---
    console.log(`Raw FMP EOD historical data received for ${symbol}:`, JSON.stringify(data, null, 2));

    // Validate the response structure
    if (!data || !Array.isArray(data.historical)) {
        console.error(`Invalid historical data format received for ${symbol} from FMP /historical-price-eod endpoint. Received:`, data);
        return [];
    }
    if (data.historical.length === 0) {
        console.warn(`Empty 'historical' array received for ${symbol} from FMP /historical-price-eod endpoint.`);
        // Returning empty array is valid here, chart will just be empty
    }
    // --- END MODIFIED LOGGING & VALIDATION ---


    // Transform FMP historical data to just closing prices
    const prices: number[] = data.historical
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Ensure chronological order by date
      .map(item => item.close); // Extract the closing price

    // Apply limit if specified (after fetch and transformation)
    const limitedPrices = limit ? prices.slice(-limit) : prices;
    console.log(`Returning ${limitedPrices.length} historical prices for ${symbol} (FMP /historical-price-eod)`);
    return limitedPrices;

  } catch (error) {
    console.error(`Failed to get FMP EOD historical data for ${symbol}:`, error);
    return [];
  }
};


// +++ START NEW FMP INTRADAY FUNCTION +++
/**
 * Fetches intraday historical stock data from FMP.
 * Ref: /stable/historical-chart/{interval}/{symbol}
 * @param symbol - The stock symbol.
 * @param interval - The chart interval (e.g., '1min', '5min', '15min', '30min', '1hour', '4hour').
 * @returns An array of Candle data.
 */
export const getFmpIntradayCandles = async (symbol: string, interval: string): Promise<Candle[]> => {
  // Validate interval - add more FMP intervals as needed
  const validIntervals = ['1min', '5min', '15min', '30min', '1hour', '4hour'];
  if (!validIntervals.includes(interval)) {
    console.error(`Invalid interval provided for getFmpIntradayCandles: ${interval}`);
    throw new Error(`Invalid interval: ${interval}. Must be one of ${validIntervals.join(', ')}`);
  }

  // Intraday data is more volatile, shorter cache time? 5 minutes = 300 seconds
  const cacheTTL = 300;
  const endpointPath = `/historical-chart/${interval}/${symbol}`;

  try {
    // Fetch raw data from FMP. Expects an array of FmpHistoricalChartItem.
    const data: FmpHistoricalChartItem[] = await fetchFmpWithCache(
      endpointPath,
      {}, // No extra params like 'from'/'to' for now, FMP provides recent data by default
      cacheTTL
    );

    console.log(`Raw FMP ${interval} intraday data received for ${symbol}: ${data?.length} points`);

    // Validate the response structure (fetchFmpWithCache handles basic fetch errors)
    if (!Array.isArray(data)) {
        console.error(`Invalid intraday data format received for ${symbol} from FMP ${endpointPath}. Expected array, Received:`, data);
        return []; // Return empty on unexpected format
    }
    if (data.length === 0) {
        console.warn(`Empty array received for ${symbol} from FMP ${endpointPath}.`);
        // Returning empty array is valid here, chart will just be empty
        return [];
    }

    // Transform FMP historical data to Candle format
    const candles: Candle[] = data
      .map(item => {
        // Attempt to parse the date string. Assume UTC if no timezone specified.
        // Add 'Z' to indicate UTC for consistent parsing.
        const timestampSeconds = Math.floor(new Date(item.date + 'Z').getTime() / 1000);

        if (isNaN(timestampSeconds)) {
          console.warn(`Skipping candle due to invalid date format from FMP: ${item.date} for ${symbol}`);
          return null; // Skip invalid data point
        }
        if (item.open == null || item.high == null || item.low == null || item.close == null) {
            console.warn(`Skipping candle due to missing price data from FMP: ${JSON.stringify(item)} for ${symbol}`);
            return null; // Skip incomplete data point
        }

        return {
          time: timestampSeconds as UTCTimestamp,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          // Omitting volume for now unless chart component needs it
        };
      })
      .filter((candle): candle is Candle => candle !== null); // Remove nulls from mapping failures

    // Sort chronologically (FMP often returns reverse-chronological)
    candles.sort((a, b) => a.time - b.time);

    console.log(`Returning ${candles.length} formatted ${interval} candles for ${symbol} (FMP ${endpointPath})`);
    return candles;

  } catch (error) {
    // fetchFmpWithCache might throw specific errors (e.g., for empty array on EOD endpoint, handle that if necessary)
    // For now, just log the generic error for intraday fetching
    console.error(`Failed to get FMP ${interval} intraday candles for ${symbol}:`, error);
    // Check if the error message indicates an empty array was treated as error by fetchFmpWithCache (if that logic applies here)
    if (error instanceof Error && error.message.includes("unexpected empty array")) {
        console.warn(`FMP endpoint ${endpointPath} returned an empty array, which might be valid for intraday.`);
        return []; // Return empty array if the underlying fetch treated empty as error
    }
    // Otherwise, rethrow or return empty based on desired behavior
    return []; // Return empty array on fetch failure
  }
};
// +++ END NEW FMP INTRADAY FUNCTION +++

/**
 * Fetches stock peers.
 * Ref: /stable/stock-peers?symbol=AAPL
 * @param symbol - The stock symbol.
 * @returns An array of peer symbols.
 */
export const getFmpPeers = async (symbol: string): Promise<string[]> => {
  try {
    // Cache peers for 1 hour
    const data = await fetchFmpWithCache(`/stock-peers?symbol=${symbol}`, {}, 3600);
    // Assuming the response structure is [{ symbol: "AAPL", peersList: ["MSFT", "GOOGL", ...] }]
    return data?.[0]?.peersList || [];
  } catch (error) {
    console.error(`Failed to get FMP peers for ${symbol}:`, error);
    return [];
  }
};

// Add more FMP functions here as needed (e.g., search, news, financials)
// Remember to wrap them with try/catch and use fetchFmpWithCache

// Add more FMP functions here as needed (e.g., search, news, financials) 