import { NextRequest, NextResponse } from 'next/server';
import { getAVIntraday } from '@/lib/alphaVantage';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')
  if (!symbol) {
    return NextResponse.json({ error: 'Missing symbol' }, { status: 400 })
  }
  try {
    const candles = await getAVIntraday(symbol)
    return NextResponse.json(candles)
  } catch (err) {
    console.error('AlphaVantage error:', err)
    return NextResponse.json({ error: 'Failed to load AV data' }, { status: 502 })
  }
}
