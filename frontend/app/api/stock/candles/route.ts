import { NextRequest, NextResponse } from 'next/server';
import { getCandles } from '@/lib/finnhub';

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const symbol = url.searchParams.get('symbol');
  const resolution = url.searchParams.get('resolution');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  if (!symbol || !resolution || !from || !to) {
    return NextResponse.json(
      { error: 'Missing one of required parameters: symbol, resolution, from, to' },
      { status: 400 }
    );
  }

  const fromTs = parseInt(from, 10);
  const toTs = parseInt(to, 10);

  if (isNaN(fromTs) || isNaN(toTs)) {
    return NextResponse.json({ error: 'Invalid “from” or “to” timestamp' }, { status: 400 });
  }

  try {
    const candles = await getCandles(symbol, resolution, fromTs, toTs);
    return NextResponse.json(candles);
  } catch (err) {
    console.error('getCandles error:', err);
    return NextResponse.json({ error: 'Failed to fetch candlestick data' }, { status: 502 });
  }
}
