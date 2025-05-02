import { NextRequest, NextResponse } from 'next/server';
import { lookupSymbols } from '@/lib/finnhub';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) {
    return NextResponse.json({ error: 'Missing “q” parameter' }, { status: 400 });
  }
  try {
    const result = await lookupSymbols(q);
    return NextResponse.json(result);
  } catch (err) {
    console.error('lookupSymbols error:', err);
    return NextResponse.json({ error: 'Failed to fetch symbols' }, { status: 502 });
  }
}
