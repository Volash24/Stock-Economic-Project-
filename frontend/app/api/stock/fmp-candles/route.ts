import { NextRequest, NextResponse } from 'next/server';
import { UTCTimestamp } from 'lightweight-charts'; // Assuming lightweight-charts types might be useful

// Define the structure for the data points we'll return
// Even though it's a line chart, fetching OHLCV is needed for aggregation
interface Candle {
  time: number; // Unix timestamp (seconds) - Must match lightweight-charts UTCTimestamp if used directly
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// Define expected query parameter types (adjust as needed)
type Range = '1D' | '1W' | '1M' | '3M' | 'YTD' | '1Y' | '5Y'; // Removed 'MAX'
type Interval = '5min' | '15min' | '30min' | '1hour' | '4hour' | '1day';

// FMP API Response Structures (add more fields as needed based on actual API responses)
interface FmpHistoricalPrice {
  date: string; // "YYYY-MM-DD"
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  // ... other fields like adjClose, vwap, etc., if available and needed
}

interface FmpHistoricalEodResponse {
  symbol: string;
  historical: FmpHistoricalPrice[];
}

interface FmpHistoricalChartItem {
  date: string; // "YYYY-MM-DD HH:MM:SS"
  open: number;
  low: number;
  high: number;
  close: number;
  volume: number;
}

// --- Helper Functions (To be implemented) ---

// Calculates 'from' and 'to' dates based on the range string
function calculateDateRange(range: Range): { from: string; to: string } {
  const to = new Date();
  let from = new Date();

  // Helper to format Date object to 'YYYY-MM-DD' string
  const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  switch (range) {
    case '1D':
      // For intraday, FMP might need a range. Set 'from' to yesterday.
      // If today is Monday, this will correctly fetch Friday's data assuming
      // the API handles non-trading days appropriately.
      from.setDate(to.getDate() - 1); // Set from to the previous day
      break;
    case '1W':
      from.setDate(to.getDate() - 7);
      break;
    case '1M':
      from.setMonth(to.getMonth() - 1);
      break;
    case '3M':
      from.setMonth(to.getMonth() - 3);
      break;
    case 'YTD':
      from = new Date(to.getFullYear(), 0, 1); // January 1st of the current year
      break;
    case '1Y':
      from.setFullYear(to.getFullYear() - 1);
      break;
    case '5Y':
      from.setFullYear(to.getFullYear() - 5);
      break;
    default:
      // Should not happen if validation is correct, but default to 1Y
      // Log the invalid range for debugging
      const exhaustiveCheck: never = range;
      console.warn(`Unhandled range: ${exhaustiveCheck}, defaulting to 1Y`);
      from.setFullYear(to.getFullYear() - 1);
  }

  return {
    from: formatDate(from),
    to: formatDate(to),
  };
}

// Helper to get the start of the week (Monday) in UTC for a given timestamp
function getWeekStartDate(timestampSeconds: number): Date {
    const date = new Date(timestampSeconds * 1000);
    const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = date.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    const weekStartDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff));
    return weekStartDate;
}

// Aggregates daily candles to weekly
function aggregateCandlesToWeekly(dailyCandles: Candle[]): Candle[] {
    if (!dailyCandles || dailyCandles.length === 0) {
        return [];
    }

    const weeklyCandlesMap = new Map<number, Candle[]>();

    // Group daily candles by the timestamp of the start of their UTC week (Monday)
    for (const candle of dailyCandles) {
        const weekStartTime = getWeekStartDate(candle.time).getTime() / 1000; // Use timestamp as key
        if (!weeklyCandlesMap.has(weekStartTime)) {
            weeklyCandlesMap.set(weekStartTime, []);
        }
        weeklyCandlesMap.get(weekStartTime)?.push(candle);
    }

    const aggregatedCandles: Candle[] = [];

    // Sort the map keys (week start timestamps) to ensure chronological order
    const sortedWeekKeys = Array.from(weeklyCandlesMap.keys()).sort((a, b) => a - b);

    for (const weekStartTime of sortedWeekKeys) {
        const weekCandles = weeklyCandlesMap.get(weekStartTime);
        if (!weekCandles || weekCandles.length === 0) continue;

        // Ensure candles within the week are sorted (should already be, but double-check)
        weekCandles.sort((a, b) => a.time - b.time);

        const open = weekCandles[0].open;
        const close = weekCandles[weekCandles.length - 1].close;
        let high = -Infinity;
        let low = Infinity;
        let volume = 0;

        for (const candle of weekCandles) {
            high = Math.max(high, candle.high);
            low = Math.min(low, candle.low);
            volume += candle.volume || 0;
        }

        aggregatedCandles.push({
            time: weekStartTime, // Time represents the start of the week (Monday)
            open,
            high,
            low,
            close,
            volume,
        });
    }

    console.log(`Aggregated ${dailyCandles.length} daily candles into ${aggregatedCandles.length} weekly candles.`);
    return aggregatedCandles;
}

// Aggregates daily candles to monthly
function aggregateCandlesToMonthly(dailyCandles: Candle[]): Candle[] {
    if (!dailyCandles || dailyCandles.length === 0) {
        return [];
    }

    const monthlyCandlesMap = new Map<string, Candle[]>(); // Key: "YYYY-MM"

    // Group daily candles by month
    for (const candle of dailyCandles) {
        const date = new Date(candle.time * 1000);
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // 01-12
        const monthKey = `${year}-${month}`;

        if (!monthlyCandlesMap.has(monthKey)) {
            monthlyCandlesMap.set(monthKey, []);
        }
        monthlyCandlesMap.get(monthKey)?.push(candle);
    }

    const aggregatedCandles: Candle[] = [];

    // Sort the map keys (YYYY-MM strings) to ensure chronological order
    const sortedMonthKeys = Array.from(monthlyCandlesMap.keys()).sort();

    for (const monthKey of sortedMonthKeys) {
        const monthCandles = monthlyCandlesMap.get(monthKey);
        if (!monthCandles || monthCandles.length === 0) continue;

        // Ensure candles within the month are sorted
        monthCandles.sort((a, b) => a.time - b.time);

        const open = monthCandles[0].open;
        const close = monthCandles[monthCandles.length - 1].close;
        let high = -Infinity;
        let low = Infinity;
        let volume = 0;

        for (const candle of monthCandles) {
            high = Math.max(high, candle.high);
            low = Math.min(low, candle.low);
            volume += candle.volume || 0;
        }

        // Use the timestamp of the first candle of the month for the aggregated candle
        const monthStartTime = monthCandles[0].time;

        aggregatedCandles.push({
            time: monthStartTime, // Time represents the first trading day's timestamp of the month
            open,
            high,
            low,
            close,
            volume,
        });
    }

    console.log(`Aggregated ${dailyCandles.length} daily candles into ${aggregatedCandles.length} monthly candles.`);
    return aggregatedCandles;
}

// --- API Route Handler ---

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const range = searchParams.get('range') as Range | null;
  // const interval = searchParams.get('interval') as Interval | null; // Frontend might send this, but we determine fetch/aggregation interval based on range

  // 1. Validation
  if (!symbol) {
    return NextResponse.json({ error: 'Symbol query parameter is required' }, { status: 400 });
  }
  if (!range) {
    return NextResponse.json({ error: 'Range query parameter is required' }, { status: 400 });
  }

  // TODO: Add validation for range values

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    console.error('FMP_API_KEY environment variable not set');
    return NextResponse.json({ error: 'Internal Server Error: API key not configured' }, { status: 500 });
  }

  try {
    // 2. Determine Fetch Interval & Date Range
    let fetchInterval: Interval = '1day'; // Default to daily
    let needsAggregation: 'weekly' | 'monthly' | null = null;

    switch (range) {
      case '1D':
        fetchInterval = '30min';
        break;
      case '1W':
        fetchInterval = '1hour';
        break;
      case '1M':
        fetchInterval = '1day';
        break;
      case '3M':
      case 'YTD':
      case '1Y':
        fetchInterval = '1day';
        needsAggregation = 'weekly';
        break;
      case '5Y':
        fetchInterval = '1day';
        needsAggregation = 'monthly';
        break;
      default:
        // Add exhaustive check for type safety
        const exhaustiveCheckRange: never = range;
        console.error(`Invalid range parameter received: ${exhaustiveCheckRange}`);
        return NextResponse.json({ error: 'Invalid range parameter' }, { status: 400 });
    }

    const { from, to } = calculateDateRange(range);

    // 3. Fetch Raw Data from FMP
    let fmpUrl = '';
    const baseUrl = 'https://financialmodelingprep.com/api/v3'; // Confirm this base URL

    if (fetchInterval === '1day') {
      // Use EOD endpoint
      fmpUrl = `${baseUrl}/historical-price-full/${symbol}?from=${from}&to=${to}&apikey=${apiKey}`;
    } else {
      // Use Intraday endpoint
      fmpUrl = `${baseUrl}/historical-chart/${fetchInterval}/${symbol}?from=${from}&to=${to}&apikey=${apiKey}`;
    }

    console.log(`Fetching FMP data from: ${fmpUrl}`); // Log the URL for debugging
    const fmpResponse = await fetch(fmpUrl);

    if (!fmpResponse.ok) {
      const errorBody = await fmpResponse.text();
      console.error(`FMP API Error (${fmpResponse.status}): ${errorBody}`);
      return NextResponse.json(
        { error: `Failed to fetch data from FMP: ${fmpResponse.statusText}` },
        { status: fmpResponse.status }
      );
    }

    const rawData = await fmpResponse.json();

    // 4. Transform Raw Data to Candle[]
    let transformedCandles: Candle[] = [];

    if (fetchInterval === '1day') {
      // Handle EOD response structure: { symbol: ..., historical: [...] }
      const eodData = rawData as FmpHistoricalEodResponse;
      if (eodData && Array.isArray(eodData.historical)) {
         transformedCandles = eodData.historical.map(item => ({
            time: Math.floor(new Date(item.date).getTime() / 1000),
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
            volume: item.volume,
          }));
      } else {
          console.error('Unexpected EOD data structure:', rawData);
          throw new Error('Invalid data structure received from FMP EOD endpoint');
      }
    } else {
      // Handle Intraday response structure: FmpHistoricalChartItem[]
      const intradayData = rawData as FmpHistoricalChartItem[];
        if (Array.isArray(intradayData)) {
           transformedCandles = intradayData.map(item => ({
            // Add 'Z' to assume UTC if no timezone offset is provided by FMP
            time: Math.floor(new Date(item.date.includes('+') || item.date.includes('Z') ? item.date : item.date + 'Z').getTime() / 1000),
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
            volume: item.volume,
          }));
        } else {
            console.error('Unexpected Intraday data structure:', rawData);
            throw new Error('Invalid data structure received from FMP Intraday endpoint');
        }
    }

    // Ensure chronological order (FMP might return reverse)
    transformedCandles.sort((a, b) => a.time - b.time);

    // 5. Aggregate Data (Conditionally)
    let finalCandles: Candle[] = transformedCandles;
    if (needsAggregation === 'weekly') {
      finalCandles = aggregateCandlesToWeekly(transformedCandles);
    } else if (needsAggregation === 'monthly') {
      finalCandles = aggregateCandlesToMonthly(transformedCandles);
    }

    // 6. Return Result
    return NextResponse.json(finalCandles);

  } catch (error) {
    console.error('Error fetching or processing FMP candles:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
} 