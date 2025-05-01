import { NextRequest, NextResponse } from 'next/server';
import { getMarketNews } from '@/lib/finnhub';

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category') || 'general';
  try {
    const news = await getMarketNews(category);
    return NextResponse.json(news);
  } catch (err) {
    console.error('getMarketNews error:', err);
    return NextResponse.json({ error: 'Failed to fetch market news' }, { status: 502 });
  }
}
