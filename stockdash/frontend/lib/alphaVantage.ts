import { URLSearchParams } from "url";
import { UTCTimestamp } from "lightweight-charts";
import { Candle } from "@/components/chart/CandlestickChart";
import Redis from 'ioredis';

const AV_BASE_URL = "https://www.alphavantage.co/query";
// Array of environment variable names for API keys
const AV_KEY_NAMES = [
  'ALPHA_VANTAGE_API_KEY',
  'ALPHA_VANTAGE_API_KEY2',
  'ALPHA_VANTAGE_API_KEY3',
  'ALPHA_VANTAGE_API_KEY4',
  'ALPHA_VANTAGE_API_KEY5',
  'ALPHA_VANTAGE_API_KEY6',
  'ALPHA_VANTAGE_API_KEY7',
  'ALPHA_VANTAGE_API_KEY8',
  'ALPHA_VANTAGE_API_KEY9',
  'ALPHA_VANTAGE_API_KEY10',
  'ALPHA_VANTAGE_API_KEY11',
  'ALPHA_VANTAGE_API_KEY12'
];

// Initialize Redis client
// Uses REDIS_URL env var if set, otherwise defaults to localhost:6379
// Consider moving this to a dedicated lib/redis.ts for better organization
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  // Optional: Add connection options if needed
  maxRetriesPerRequest: 3, // Example: Don't retry forever if Redis is down
});

redis.on('error', (err) => console.error('Redis Client Error:', err)); // Log Redis errors

// Helper to get available keys from environment
function getAvailableAVKeys(): string[] {
    return AV_KEY_NAMES.map(name => process.env[name]).filter((key): key is string => !!key);
}


async function fetchAVWithCache(
  params: Record<string, string>,
  revalidateSeconds: number = 86400, // Default cache duration set to 24 hours
  keyIndex: number = 0 // Track which key we are trying
): Promise<any> {

  // 1. Generate a unique Redis key based on essential params
  const functionName = params.function || 'unknown_func';
  const symbol = params.symbol || 'nosymbol';
  const interval = params.interval || 'nointerval';
  const outputSize = params.outputsize || 'nosize';
  // Add other relevant params as needed to ensure uniqueness
  const cacheKey = `avcache:${functionName}:${symbol}:${interval}:${outputSize}`;

  // 2. Check Redis cache first
  if (!process.env.DISABLE_REDIS_CACHE) { // Allow disabling cache via env var if needed
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        console.log(`Redis cache hit for ${cacheKey}`);
        return JSON.parse(cachedData); // Return parsed data from cache
      }
      console.log(`Redis cache miss for ${cacheKey}`);
    } catch (redisError) {
      console.error(`Redis GET error for ${cacheKey}. Proceeding without cache. Error:`, redisError);
      // Continue without cache if Redis read fails, but log the error
    }
  } else {
      console.log('Redis cache is disabled via environment variable.');
  }


  // 3. Cache Miss or Redis Disabled: Proceed with API fetch logic
  const availableKeys = getAvailableAVKeys();

  if (availableKeys.length === 0) {
    throw new Error(
      "No Alpha Vantage API keys found in environment variables (checked ALPHA_VANTAGE_API_KEY, ALPHA_VANTAGE_API_KEY2, ALPHA_VANTAGE_API_KEY3)."
    );
  }

  if (keyIndex >= availableKeys.length) {
     // We have tried all available keys and they are all rate-limited
     throw new Error("All available Alpha Vantage API keys are rate-limited.");
  }

  const currentKey = availableKeys[keyIndex];
  console.log(`Using Alpha Vantage Key Index: ${keyIndex}`); // Log which key index is being used

  const queryParams = new URLSearchParams({
    ...params,
    apikey: currentKey, // Use the current key
  }).toString();
  const url = `${AV_BASE_URL}?${queryParams}`;

  console.log(`Fetching Alpha Vantage: ${url}`); // Log the URL

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(
        `Alpha Vantage API Error (${res.status}) using key index ${keyIndex}: ${res.statusText}. Body: ${errorBody}`
      );
      // Do not retry on general HTTP errors, let the caller handle it or caching take over.
      throw new Error(
        `Alpha Vantage API request failed with status ${res.status}: ${res.statusText}`
      );
    }

    const data = await res.json();

    // Check for Alpha Vantage specific logic errors first
    if (data["Error Message"]) {
      console.error(
        `Alpha Vantage API Error (Logic) using key index ${keyIndex}: ${data["Error Message"]}`
      );
      // Do not retry on logic errors reported by the API.
      throw new Error(`Alpha Vantage API Error: ${data["Error Message"]}`);
    }

    // Check for rate limiting *before* attempting to cache
    // Adjusted the check slightly to be more robust
    const isRateLimited = (data["Information"] && typeof data["Information"] === 'string' && data["Information"].includes("API rate limit")) ||
                          (data["Note"] && typeof data["Note"] === 'string' && data["Note"].includes("API rate limit"));

    if (isRateLimited) {
      console.warn(`Rate limit detected for key index ${keyIndex} for ${symbol}. Response: ${data["Information"] || data["Note"]}. Attempting to rotate key.`);
      // IMPORTANT: Do *not* cache the rate limit response. Try the next key.
      return fetchAVWithCache(params, revalidateSeconds, keyIndex + 1);
    }

    // Handle other informational messages if needed (optional)
    if (data["Information"]) {
      console.warn(`Alpha Vantage API Info using key index ${keyIndex}: ${data["Information"]}`);
    }

    // 4. Fetch Success & Not Rate Limited: Store in Redis cache
    if (!process.env.DISABLE_REDIS_CACHE) {
        try {
          // Use 'EX' for setting expiry in seconds
          await redis.set(cacheKey, JSON.stringify(data), 'EX', revalidateSeconds);
          console.log(`Stored successful response in Redis cache for ${cacheKey} with TTL ${revalidateSeconds}s`);
        } catch (redisError) {
          console.error(`Redis SET error for ${cacheKey}. Data fetched but not cached. Error:`, redisError);
          // Proceed returning data even if Redis write fails, but log the error
        }
    }

    // console.log(`Received data from Alpha Vantage using key index ${keyIndex}:`, data); // Optional log
    return data; // Success!

  } catch (error) {
    // Catch network errors or errors thrown from above checks
    if (!(error instanceof Error && error.message.includes("All available Alpha Vantage API keys are rate-limited"))) {
         console.error(`Error fetching ${url} using key index ${keyIndex}:`, error);
    }
    // Re-throw the error to be handled by the caller (could be the rate limit error or another fetch/logic error)
    throw error;
  }
}

/** 60-minute intraday for the past ~day */
export async function getAVIntraday(symbol: string): Promise<Candle[]> {
  // Initial call starts with keyIndex 0
  const data = await fetchAVWithCache({
    function: "TIME_SERIES_INTRADAY",
    symbol,
    interval: "60min",
    outputsize: "compact", // last 100 points
  });

  const seriesKey = "Time Series (60min)"; // Key might vary based on function/interval
  const series = data[seriesKey] as Record<string, any>;

  if (!series) {
    console.error(
      `Could not find series key "${seriesKey}" in Alpha Vantage response for ${symbol}. Data:`,
      data
    );
    // Attempt to find *any* time series key if the expected one isn't present
    const potentialKeys = Object.keys(data).filter((k) =>
      k.toLowerCase().includes("time series")
    );
    if (potentialKeys.length > 0) {
      console.warn(
        `Falling back to alternative series key: ${potentialKeys[0]}`
      );
      const fallbackSeries = data[potentialKeys[0]] as Record<string, any>;
      if (fallbackSeries) return parseAVSeries(fallbackSeries);
    }
    // Throw error only if no series data found at all after checking fallbacks
     throw new Error(
        `No time series data found in Alpha Vantage response for ${symbol}`
      );

  }

  return parseAVSeries(series);
}

function parseAVSeries(series: Record<string, any>): Candle[] {
  return Object.entries(series)
    .map(([ts, ohlc]) => ({
      time: (new Date(ts).getTime() / 1000) as UTCTimestamp,
      open: +ohlc["1. open"],
      high: +ohlc["2. high"],
      low: +ohlc["3. low"],
      close: +ohlc["4. close"],
      volume: +ohlc["5. volume"],
    }))
    .sort((a, b) => a.time - b.time);
}
