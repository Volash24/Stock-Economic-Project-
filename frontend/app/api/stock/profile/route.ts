import { NextRequest, NextResponse } from 'next/server';
import { getCompanyProfile } from '@/lib/finnhub';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'Missing “symbol” parameter' }, { status: 400 });
  }
  try {
    const profile = await getCompanyProfile(symbol);
    return NextResponse.json(profile);
  } catch (err) {
    console.error('getCompanyProfile error:', err);
    return NextResponse.json({ error: 'Failed to fetch company profile' }, { status: 502 });
  }
}
