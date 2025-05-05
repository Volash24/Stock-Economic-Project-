import { NextRequest, NextResponse } from 'next/server';
// import { lookupSymbols } from '@/lib/finnhub'; // Removed finnhub import
import { searchFmpSymbols } from '@/lib/fmp'; // Added fmp import

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) {
    return NextResponse.json({ error: 'Missing "q" parameter' }, { status: 400 });
  }
  try {
    // Use the FMP search function instead of Finnhub
    const exchanges = 'NASDAQ,NYSE,AMEX'; // Define US exchanges
    const result = await searchFmpSymbols(q, 10, exchanges); // Pass query, limit, and exchanges
    return NextResponse.json(result);
  } catch (err: any) { // Added type annotation for err
    console.error('Symbol search error (via /api/stock/search):', err);
    // Return a more generic server error, as the issue could be FMP or our code
    return NextResponse.json({ error: 'Failed to fetch symbols' }, { status: 500 });
  }
}
