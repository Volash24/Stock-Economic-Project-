import { NextRequest, NextResponse } from "next/server";
import { getQuote } from "@/lib/finnhub";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json(
      { error: "Missing “symbol” parameter" },
      { status: 400 }
    );
  }
  try {
    const quote = await getQuote(symbol);
    return NextResponse.json(quote);
  } catch (err) {
    console.error("getQuote error:", err);
    return NextResponse.json(
      { error: "Failed to fetch quote" },
      { status: 502 }
    );
  }
}
