import { URLSearchParams } from "url"; // Node.js environment, ensure 'url' is available

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const token = process.env.FINNHUB_API_KEY;

// Helper function to handle fetch requests and caching
async function fetchWithCache(
  endpoint: string,
  params: Record<string, string | number>,
  revalidateSeconds: number = 900
) {
  if (!token) {
    throw new Error("FINNHUB_API_KEY is not set in environment variables.");
  }
  const queryParams = new URLSearchParams({ ...params, token }).toString();
  const url = `${FINNHUB_BASE_URL}${endpoint}?${queryParams}`;

  console.log(`Fetching: ${url}`); // Log the URL being fetched

  try {
    const res = await fetch(url, {
      next: { revalidate: revalidateSeconds }, // Apply Next.js caching
    });

    if (!res.ok) {
      // Log more details on error
      const errorBody = await res.text();
      console.error(
        `Finnhub API Error (${res.status}): ${res.statusText}. Body: ${errorBody}`
      );
      throw new Error(
        `Finnhub API request failed with status ${res.status}: ${res.statusText}`
      );
    }

    const data = await res.json();
    // console.log(`Received data for ${endpoint}:`, data); // Optional: log successful data
    return data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    // Re-throw the error to be handled by the caller
    throw error;
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
