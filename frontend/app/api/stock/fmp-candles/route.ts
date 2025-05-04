import { NextResponse, type NextRequest } from 'next/server';
import { getFmpIntradayCandles } from '@/lib/fmp';
import { type Candle } from '@/components/chart/CandlestickChart'; // Adjust path as needed

export const dynamic = 'force-dynamic'; // Ensure fresh data on each request

/**
 * API route handler to fetch FMP intraday candle data.
 * Expects 'symbol' and 'interval' query parameters.
 * Interval must be one of: '1min', '5min', '15min', '30min', '1hour', '4hour'.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval');

  // --- Validation ---
  if (!symbol) {
    return NextResponse.json({ error: 'Missing required query parameter: symbol' }, { status: 400 });
  }
  if (!interval) {
    return NextResponse.json({ error: 'Missing required query parameter: interval' }, { status: 400 });
  }

  const validIntervals = ['1min', '5min', '15min', '30min', '1hour', '4hour'];
  if (!validIntervals.includes(interval)) {
    return NextResponse.json({
      error: `Invalid interval: ${interval}. Must be one of ${validIntervals.join(', ')}`
    }, { status: 400 });
  }

  // --- Fetch Data ---
  try {
    console.log(`API route: Fetching FMP ${interval} candles for ${symbol}`);
    const candles: Candle[] = await getFmpIntradayCandles(symbol, interval);

    // Check if data fetching returned empty array (might be valid, might be error indication)
    if (!candles || candles.length === 0) {
        console.warn(`API route: getFmpIntradayCandles returned empty or null for ${symbol}/${interval}`);
        // Optionally, you could return a different status code like 204 No Content,
        // but returning an empty array might be simpler for the frontend.
    }

    // +++ Log raw candles before returning +++
    console.log(`API route: Raw candles data being sent for ${symbol}/${interval}:`, JSON.stringify(candles.slice(0, 5), null, 2)); // Log first 5 candles

    console.log(`API route: Successfully fetched ${candles.length} candles for ${symbol}/${interval}`);
    return NextResponse.json(candles);

  } catch (error) {
    console.error(`API route error fetching FMP candles for ${symbol}/${interval}:`, error);

    // Determine appropriate status code based on error type if possible
    let status = 500;
    let message = 'Failed to fetch FMP intraday data.';

    if (error instanceof Error) {
        message = error.message; // Pass through specific errors if safe/desired
        // Could check error message for specific conditions like rate limits if needed
    }

    return NextResponse.json({ error: message }, { status });
  }
} 