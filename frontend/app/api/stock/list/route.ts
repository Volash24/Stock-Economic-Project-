import { NextRequest, NextResponse } from 'next/server';
import { getQuote } from '@/lib/finnhub';
import { getAVIntraday } from '@/lib/alphaVantage';

// choose your “universe” of symbols
const SYMBOLS = ['AAPL','MSFT','GOOGL','AMZN','META','TSLA','NVDA']

export async function GET(req: NextRequest) {
  try {
    // 1) fetch quotes in parallel
    const quoteFetches = SYMBOLS.map(sym =>
      getQuote(sym).then(q => ({ symbol: sym, quote: q }))
    )
    // 2) fetch AV candles in parallel
    const histFetches = SYMBOLS.map(sym =>
      getAVIntraday(sym).catch(() => []) // fail-safe
    )
    const quotes = await Promise.all(quoteFetches)
    const histories = await Promise.all(histFetches)

    // 3) map into StockListItem[]
    const list = SYMBOLS.map((symbol, i) => {
      const q = quotes.find(x => x.symbol === symbol)!.quote
      const closeSeries = histories[i].map(c => c.close)
      const changePct = q.pc
        ? ((q.c - q.pc) / q.pc) * 100
        : 0
      return {
        symbol,
        price: q.c,
        change: changePct,
        history: closeSeries,
      }
    })

    return NextResponse.json(list)
  } catch (err) {
    console.error('Error in /api/stock/list:', err)
    return NextResponse.json({ error: 'Failed to load stock list' }, { status: 502 })
  }
}
