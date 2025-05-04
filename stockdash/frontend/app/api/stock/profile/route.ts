import { NextRequest, NextResponse } from 'next/server';
import { getFmpProfile } from '@/lib/fmp';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'Missing "symbol" parameter' }, { status: 400 });
  }
  try {
    const profile = await getFmpProfile(symbol);
    if (!profile) {
      return NextResponse.json({ error: `Profile data not found for symbol ${symbol}` }, { status: 404 });
    }
    return NextResponse.json(profile);
  } catch (error) {
    console.error(`Error fetching FMP profile for ${symbol}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to fetch profile data for ${symbol}`, details: errorMessage }, { status: 500 });
  }
}
