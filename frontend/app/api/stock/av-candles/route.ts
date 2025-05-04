import { NextRequest, NextResponse } from 'next/server';
import { getFmpHistoricalData } from '@/lib/fmp';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')
  if (!symbol) {
    return NextResponse.json({ error: 'Missing symbol' }, { status: 400 })
  }
  try {
    const candles = await getFmpHistoricalData(symbol)
    if (!candles || candles.length === 0) {
      console.warn(`No historical candle data returned from FMP for ${symbol}`);
      return NextResponse.json([]);
    }
    return NextResponse.json(candles)
  } catch (err) {
    console.error(`Error fetching FMP historical data for ${symbol}:`, err)
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        error: `Failed to fetch historical candle data for ${symbol}`,
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
