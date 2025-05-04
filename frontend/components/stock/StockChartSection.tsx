'use client'

import React, { useState, useEffect } from 'react'
import { CandlestickChart, type Candle } from "@/components/chart/CandlestickChart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UTCTimestamp } from 'lightweight-charts' // Ensure this is imported if needed

interface StockChartSectionProps {
  initialData: Candle[]
  symbol: string
  initialLineColor: string; // +++ Add prop for initial color +++
}

// Define the intervals supported by the FMP API route
// +++ Order intervals from shortest to longest (left-to-right) +++
const SUPPORTED_INTERVALS = ['5min', '15min', '30min', '1hour', '4hour'] as const;
type Interval = typeof SUPPORTED_INTERVALS[number];

// Map display labels to interval values (can customize labels here)
// +++ Update minute labels to use 'min' +++
const INTERVAL_LABELS: Record<Interval, string> = {
    '5min': '5min',     // Changed from 5M
    '15min': '15min',   // Changed from 15M
    '30min': '30min',   // Changed from 30M
    '1hour': '1H',      // Kept as 1H
    '4hour': '4H'       // Kept as 4H
};

export function StockChartSection({ initialData, symbol, initialLineColor }: StockChartSectionProps) {
  // +++ Log initialData prop +++
  console.log(`StockChartSection: Received initialData prop with ${initialData?.length ?? 0} items. First item:`, initialData?.[0]);
  console.log(`StockChartSection: Received initialLineColor: ${initialLineColor}`); // +++ Log initial color +++

  // State for the currently selected interval
  // Initialize with '1hour' as that's what the server likely fetched initially
  const [selectedInterval, setSelectedInterval] = useState<Interval>('1hour');

  // State for the chart data, initialized with server-fetched data
  const [chartData, setChartData] = useState<Candle[]>(initialData);

  // +++ State for the line color +++
  const [currentLineColor, setCurrentLineColor] = useState<string>(initialLineColor);

  // State to track loading status for feedback
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to fetch new data when the selected interval or symbol changes
  useEffect(() => {
    // Don't refetch if the selected interval is the initial one ('1hour')
    // because we already have the initialData for it.
    // This prevents an unnecessary fetch on component mount.
    if (selectedInterval === '1hour' && chartData === initialData) {
        console.log('StockChartSection: Using initial 1hour data and color.');
        // Ensure initial color is set even if we don't fetch
        setCurrentLineColor(initialLineColor);
        return;
    }

    const fetchData = async () => {
      console.log(`StockChartSection: Interval changed to ${selectedInterval}. Fetching data for ${symbol}...`);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/stock/fmp-candles?symbol=${symbol}&interval=${selectedInterval}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch data: ${response.statusText}`);
        }
        const newData: Candle[] = await response.json();

        // +++ Log raw fetched newData +++
        console.log(`StockChartSection: Fetched ${newData?.length ?? 0} candles client-side (${selectedInterval}). First item:`, newData?.[0]);

        if (!Array.isArray(newData)) {
            console.error("StockChartSection: Invalid data format received from API.", newData);
            throw new Error("Received invalid data format from server.");
        }

        // +++ Calculate color based on interval data +++
        if (newData.length > 0) {
            const firstPrice = newData[0].close;
            const lastPrice = newData[newData.length - 1].close;
            const intervalColor = lastPrice >= firstPrice ? "#22c55e" : "#ef4444";
            setCurrentLineColor(intervalColor);
            console.log(`StockChartSection: Interval (${selectedInterval}) color set to ${intervalColor} (Start: ${firstPrice}, End: ${lastPrice})`);
        } else {
            // Fallback to initial daily color if no data for interval
            setCurrentLineColor(initialLineColor);
             console.log(`StockChartSection: No data for interval (${selectedInterval}), falling back to initial color ${initialLineColor}`);
        }
        // +++ End color calculation +++

        console.log(`StockChartSection: Successfully fetched ${newData.length} candles for ${symbol} (${selectedInterval}).`);
        setChartData(newData);
      } catch (err) {
        console.error("StockChartSection: Error fetching chart data:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        // Optionally clear chart data on error or keep stale data
        // setChartData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedInterval, symbol, initialData, initialLineColor]); // +++ Add initialLineColor to dependencies +++

  // +++ Add log here +++
  console.log(`StockChartSection: Rendering CandlestickChart with ${chartData?.length ?? 0} data points and color ${currentLineColor}.`);

  return (
    <div>
      {/* Chart */}
      <div className="relative mt-6 mb-4 h-[400px]"> {/* Added relative positioning here */}
        {/* Optionally show loading/error state overlayed on chart or replace it */}
        {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white z-10"><p>Loading {INTERVAL_LABELS[selectedInterval]} data...</p></div>}
        {error && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-red-500 z-10"><p>Error: {error}</p></div>}
        <CandlestickChart
          key={selectedInterval} // Add key to force re-render on interval change if needed
          data={chartData}
          lineColor={currentLineColor} // +++ Pass the dynamic color +++
          showCandles={false} // +++ Set to false for Line Chart +++
          height={400}
        />
      </div>

      {/* Time period selectors */}
      <div className="mt-2">
        <Tabs
          defaultValue={selectedInterval} // Controlled by state
          onValueChange={(value) => setSelectedInterval(value as Interval)} // Update state on change
          className="w-full"
        >
          <TabsList className="bg-transparent border-b border-zinc-800 w-full justify-start h-auto p-0">
            {SUPPORTED_INTERVALS.map((interval) => (
              <TabsTrigger
                key={interval}
                value={interval}
                disabled={isLoading} // Disable tabs while loading
                className="px-4 py-2 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-orange-500 text-zinc-400 hover:text-white disabled:opacity-50"
              >
                {INTERVAL_LABELS[interval]}
              </TabsTrigger>
            ))}
          </TabsList>
          {/* No need for TabsContent if the chart above updates based on state */}
        </Tabs>
      </div>
    </div>
  );
} 