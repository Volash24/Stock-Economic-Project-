'use client'

import React, { useState, useEffect } from 'react'
import { CandlestickChart, type Candle } from "@/components/chart/CandlestickChart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UTCTimestamp } from 'lightweight-charts' // Ensure this is imported if needed

// Define the time ranges supported
const SUPPORTED_RANGES = ['1D', '1W', '1M', '3M', 'YTD', '1Y', '5Y'] as const; // Updated ranges
type Range = typeof SUPPORTED_RANGES[number];

// Define the intervals supported by the FMP API route
// +++ Order intervals from shortest to longest (left-to-right) +++
const SUPPORTED_INTERVALS = ['5min', '15min', '30min', '1hour', '4hour', '1day'] as const;
type Interval = typeof SUPPORTED_INTERVALS[number];

// Map display labels to interval values (can customize labels here)
// +++ Update minute labels to use 'min' +++
const INTERVAL_LABELS: Record<Interval, string> = {
    '5min': '5 min',
    '15min': '15 min',
    '30min': '30 min',
    '1hour': '1 Hour',
    '4hour': '4 Hour',
    '1day': 'Daily' // Label for 1day
};

interface StockChartSectionProps {
  symbol: string
}

export function StockChartSection({ symbol }: StockChartSectionProps) {
  console.log(`StockChartSection: Rendering for symbol: ${symbol}`);

  // State for the selected range (Default: 1M)
  const [selectedRange, setSelectedRange] = useState<Range>('1M');

  // State for the selected interval (Default: '1day' since default range is '1M')
  const [selectedInterval, setSelectedInterval] = useState<Interval>('1day');

  // State for the chart data
  const [chartData, setChartData] = useState<Candle[]>([]);

  // State for the line color
  const [currentLineColor, setCurrentLineColor] = useState<string>("#9ca3af");

  // State to track loading status for feedback
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Effect to fetch new data when range, interval, or symbol changes
  useEffect(() => {
    const fetchData = async () => {
      console.log(`StockChartSection: Fetching data for ${symbol} - Range: ${selectedRange}, Interval: ${selectedInterval}`);
      setIsLoading(true);
      setError(null);
      setChartData([]); // Clear previous data while loading

      try {
        // --- Update API call with range and interval --- 
        const response = await fetch(`/api/stock/fmp-candles?symbol=${symbol}&range=${selectedRange}&interval=${selectedInterval}`);
        
        if (!response.ok) {
          let errorMsg = `Failed to fetch data: ${response.statusText}`;
          try {
              const errorData = await response.json();
              errorMsg = errorData.error || errorMsg;
          } catch (e) { /* Ignore JSON parse error */ }
          throw new Error(errorMsg);
        }
        
        const newData: Candle[] = await response.json();

        console.log(`StockChartSection: Fetched ${newData?.length ?? 0} candles client-side (${selectedRange}/${selectedInterval}). First item:`, newData?.[0]);

        if (!Array.isArray(newData)) {
            console.error("StockChartSection: Invalid data format received from API.", newData);
            throw new Error("Received invalid data format from server.");
        }

        // Set chart data
        setChartData(newData);

        // Calculate color based on fetched data for the range
        if (newData.length > 0) {
            const firstPrice = newData[0].close;
            const lastPrice = newData[newData.length - 1].close;
            const rangeColor = lastPrice >= firstPrice ? "#22c55e" : "#ef4444"; // Green up, Red down
            setCurrentLineColor(rangeColor);
            console.log(`StockChartSection: Range (${selectedRange}) color set to ${rangeColor} (Start: ${firstPrice}, End: ${lastPrice})`);
        } else {
            setCurrentLineColor("#9ca3af"); // Gray if no data
            console.log(`StockChartSection: No data for range/interval, color set to gray.`);
        }

      } catch (err) {
        console.error("StockChartSection: Error fetching chart data:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setCurrentLineColor("#9ca3af"); // Gray on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedRange, selectedInterval, symbol]); // Depend on range, interval, symbol

  console.log(`StockChartSection: Rendering CandlestickChart with ${chartData?.length ?? 0} data points and color ${currentLineColor}.`);

  // Function to determine appropriate intervals for a range.
  // Allows most intervals but filters very short ones for long ranges as a UX hint.
  const getAvailableIntervals = (range: Range): Interval[] => {
    switch (range) {
      case '1D':
        // Allow all intervals, maybe prioritize shorter ones?
        return ['5min', '15min', '30min', '1hour', '4hour']; // Exclude '1day' for 1D range
      case '1W':
        return ['5min', '15min', '30min', '1hour', '4hour', '1day'];
      case '1M':
      case '3M':
         return ['30min', '1hour', '4hour', '1day']; // Exclude shortest intervals
      case 'YTD':
      case '1Y':
      case '5Y':
         return ['1hour', '4hour', '1day']; // Only allow longer intervals
      default:
        // Should not happen
        const exhaustiveCheck: never = range;
        console.warn(`Unhandled range in getAvailableIntervals: ${exhaustiveCheck}`);
        return ['1day']; // Fallback to daily
    }
  };

  const availableIntervals = getAvailableIntervals(selectedRange);

  // Adjust selected interval if it becomes unavailable for the new range
  useEffect(() => {
      console.log(`StockChartSection: Range changed to ${selectedRange}. Available intervals: ${availableIntervals.join(', ')}. Current interval: ${selectedInterval}`);
      if (!availableIntervals.includes(selectedInterval)) {
          // If current interval is not available, try to find the closest available one.
          // Simple approach: pick the first available (usually shortest suitable).
          // Or, more robustly, pick '1day' if available, else the first.
          const newInterval = availableIntervals.includes('1day') ? '1day' : availableIntervals[0];
          console.log(`StockChartSection: Adjusting interval from ${selectedInterval} to ${newInterval}`);
          setSelectedInterval(newInterval);
      }
  }, [selectedRange, availableIntervals]); // Rerun when range or the list of available intervals changes

  return (
    <div>
      {/* Chart */}
      <div className="relative mb-4 h-[400px]">
        {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
              <p className="text-white">Loading {selectedRange} data ({INTERVAL_LABELS[selectedInterval]})...</p>
            </div>
        )}
        {error && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
              <p className="text-red-500 text-center px-4">Error loading {selectedRange} data: {error}</p>
            </div>
        )}
        {!isLoading && !error && chartData.length === 0 && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
               <p className="text-zinc-500">No data available for {selectedRange} ({INTERVAL_LABELS[selectedInterval]})</p>
             </div>
        )}
        <CandlestickChart
          key={`${selectedRange}-${selectedInterval}`} // Force re-render on range/interval change
          data={chartData}
          lineColor={currentLineColor} 
          showCandles={false} // Keep as line chart
          height={400}
        />
      </div>

      {/* Time Range and Interval Selectors */}
      <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Range Selector */}
          <Tabs 
            value={selectedRange} 
            onValueChange={(value: string) => setSelectedRange(value as Range)}
            className="w-full sm:w-auto"
          >
            <TabsList className="bg-transparent p-0 h-auto flex flex-wrap justify-start">
              {SUPPORTED_RANGES.map((range) => (
                <TabsTrigger
                  key={range}
                  value={range}
                  disabled={isLoading} 
                  className="px-3 py-1 rounded-md data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400 hover:text-white text-xs sm:text-sm flex-shrink-0"
                  style={{ flexBasis: 'auto' }} // Allow wrapping
                >
                  {range}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Interval Selector */}
          <div className="w-full sm:w-auto flex-shrink-0">
              <Select
                value={selectedInterval}
                onValueChange={(value: string) => setSelectedInterval(value as Interval)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full sm:w-[120px] bg-zinc-900 border-zinc-800 text-xs sm:text-sm h-8">
                  <SelectValue placeholder="Interval" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  {availableIntervals.map(interval => (
                      <SelectItem key={interval} value={interval} className="text-xs sm:text-sm">
                          {INTERVAL_LABELS[interval]}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
      </div>
    </div>
  );
} 