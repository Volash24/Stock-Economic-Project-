import { NextRequest, NextResponse } from "next/server";
import { getFmpQuote } from "@/lib/fmp";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json(
      { error: "Missing “symbol” parameter" },
      { status: 400 }
    );
  }
  try {
    const quote = await getFmpQuote(symbol);

    if (!quote) {
      return NextResponse.json(
        { error: `Quote data not found for symbol ${symbol}` },
        { status: 404 }
      );
    }

    const mappedQuote = {
      c: quote.price,
      pc: quote.previousClose,
      h: quote.dayHigh,
      l: quote.dayLow,
      o: quote.open,
      v: quote.volume,
      t: quote.timestamp,
      name: quote.name,
      change: quote.change,
      changesPercentage: quote.changesPercentage,
      marketCap: quote.marketCap,
      avgVolume: quote.avgVolume
    };

    return NextResponse.json(mappedQuote);
  } catch (error) {
    console.error(`Error fetching FMP quote for ${symbol}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch quote data for ${symbol}`, details: errorMessage },
      { status: 500 }
    );
  }
}
