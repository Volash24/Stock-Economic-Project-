import { NextRequest, NextResponse } from 'next/server';
import { getFmpPeers } from '@/lib/fmp';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'Missing “symbol” parameter' }, { status: 400 });
  }
  try {
    const peers: string[] = await getFmpPeers(symbol);
    return NextResponse.json(peers);
  } catch (err) {
    console.error('getFmpPeers error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch peers', details: errorMessage }, { status: 500 });
  }
}
