import { URLSearchParams } from "url";
import { UTCTimestamp } from "lightweight-charts";
import { Candle } from "@/components/chart/CandlestickChart";

const AV_BASE_URL = "https://www.alphavantage.co/query";
const AV_KEY = process.env.ALPHA_VANTAGE_API_KEY;

async function fetchAVWithCache(
  params: Record<string, string>,
  revalidateSeconds: number = 900
): Promise<any> {
  if (!AV_KEY) {
    throw new Error(
      "ALPHA_VANTAGE_API_KEY is not set in environment variables."
    );
  }
  const queryParams = new URLSearchParams({
    ...params,
    apikey: AV_KEY,
  }).toString();
  const url = `${AV_BASE_URL}?${queryParams}`;

  console.log(`Fetching Alpha Vantage: ${url}`); // Log the URL

  try {
    const res = await fetch(url, {
      next: { revalidate: revalidateSeconds }, // Apply Next.js caching
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(
        `Alpha Vantage API Error (${res.status}): ${res.statusText}. Body: ${errorBody}`
      );
      throw new Error(
        `Alpha Vantage API request failed with status ${res.status}: ${res.statusText}`
      );
    }

    const data = await res.json();
    if (data["Error Message"]) {
      // Alpha Vantage specific error check
      console.error(
        `Alpha Vantage API Error (Logic): ${data["Error Message"]}`
      );
      throw new Error(`Alpha Vantage API Error: ${data["Error Message"]}`);
    }
    if (data["Information"]) {
      // Handle rate limiting info
      console.warn(`Alpha Vantage API Info: ${data["Information"]}`);
      // Potentially throw an error or handle differently if rate limited
    }
    // console.log(`Received data from Alpha Vantage:`, data); // Optional log
    return data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

/** 60-minute intraday for the past ~day */
export async function getAVIntraday(symbol: string): Promise<Candle[]> {
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
    } else {
      throw new Error(
        `No time series data found in Alpha Vantage response for ${symbol}`
      );
    }
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
