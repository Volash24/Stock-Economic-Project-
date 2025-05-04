import { URLSearchParams } from "url"; // Node.js environment, ensure 'url' is available
import Redis from 'ioredis';

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const token = process.env.FINNHUB_API_KEY;

// Initialize Redis client (similar to alphaVantage.ts)
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => console.error('Redis Client Error (Finnhub):', err));

// Helper function to handle fetch requests and caching
async function fetchWithCache(
  endpoint: string,
  params: Record<string, string | number>,
  revalidateSeconds: number = 900 // Default cache TTL set to 15 minutes
) {
  if (!token) {
    throw new Error("FINNHUB_API_KEY is not set in environment variables.");
  }

  // 1. Generate a consistent cache key
  // Sort parameters to ensure consistent key regardless of order
  const sortedParamString = Object.entries(params)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  const cacheKey = `fincache:${endpoint}:${sortedParamString}`;

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

  // 3. Cache Miss or Redis Disabled: Fetch from Finnhub API
  const queryParams = new URLSearchParams({ ...params, token }).toString();
  const url = `${FINNHUB_BASE_URL}${endpoint}?${queryParams}`;

  console.log(`Fetching Finnhub: ${url}`); // Log the URL being fetched

  try {
    // Remove Next.js revalidate as Redis handles caching now
    const res = await fetch(url);

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(
        `Finnhub API Error (${res.status}): ${res.statusText}. Body: ${errorBody}`
      );
      throw new Error(
        `Finnhub API request failed with status ${res.status}: ${res.statusText}`
      );
    }

    const data = await res.json();

    // 4. Store successful response in Redis cache
    if (!process.env.DISABLE_REDIS_CACHE) {
      try {
        await redis.set(cacheKey, JSON.stringify(data), 'EX', revalidateSeconds);
        console.log(`Stored successful Finnhub response in Redis cache for ${cacheKey} with TTL ${revalidateSeconds}s`);
      } catch (redisError) {
        console.error(`Redis SET error for ${cacheKey}. Data fetched but not cached. Error:`, redisError);
      }
    }

    return data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

// --- Refactored API Functions ---

export const lookupSymbols = (q: string) => fetchWithCache("/search", { q });

export const getCompanyProfile = (symbol: string) =>
  fetchWithCache("/stock/profile2", { symbol });

export const getQuote = (symbol: string) =>
  fetchWithCache("/quote", { symbol });

export const getPeers = (symbol: string) =>
  fetchWithCache("/stock/peers", { symbol });

export const getCandles = (
  symbol: string,
  resolution: string,
  from: number,
  to: number
) => fetchWithCache("/stock/candle", { symbol, resolution, from, to });

export const getMarketNews = (category: string) =>
  fetchWithCache("/news", { category });

export const getCompanyNews = (
  symbol: string,
  from: string, // Keep as string 'YYYY-MM-DD'
  to: string // Keep as string 'YYYY-MM-DD'
) => fetchWithCache("/company-news", { symbol, from, to });
