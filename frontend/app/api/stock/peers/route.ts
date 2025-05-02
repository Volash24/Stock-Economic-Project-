import { NextRequest, NextResponse } from 'next/server';
import { getPeers } from '@/lib/finnhub';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'Missing “symbol” parameter' }, { status: 400 });
  }
  try {
    const peers: string[] = await getPeers(symbol);
    return NextResponse.json(peers);
  } catch (err) {
    console.error('getPeers error:', err);
    return NextResponse.json({ error: 'Failed to fetch peers' }, { status: 502 });
  }
}
