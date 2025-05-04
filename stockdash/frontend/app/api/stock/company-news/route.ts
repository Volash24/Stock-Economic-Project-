import { NextRequest, NextResponse } from 'next/server';
import { getCompanyNews } from '@/lib/finnhub';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  const from = req.nextUrl.searchParams.get('from');
  const to = req.nextUrl.searchParams.get('to');

  if (!symbol || !from || !to) {
    return NextResponse.json(
      { error: 'Missing one of required parameters: symbol, from, to' },
      { status: 400 }
    );
  }

  try {
    const news = await getCompanyNews(symbol, from, to);
    return NextResponse.json(news);
  } catch (err) {
    console.error('getCompanyNews error:', err);
    return NextResponse.json({ error: 'Failed to fetch company news' }, { status: 502 });
  }
}
