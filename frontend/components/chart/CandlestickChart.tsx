"use client"

import { useEffect, useRef, useState } from "react"
import {
  createChart,
  type UTCTimestamp,
  CandlestickSeries,
  LineSeries,
  type CandlestickData,
  type LineData,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts"
import { useTheme } from "next-themes"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"

// Full OHLC object shape
export interface Candle {
  time: UTCTimestamp
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

interface CandlestickChartProps {
  data: Candle[]
  positiveColor?: string
  negativeColor?: string
  lineColor?: string
  showCandles?: boolean
  height?: number
}

export function CandlestickChart({
  data,
  positiveColor = "#22c55e", // green-500
  negativeColor = "#ef4444", // red-500
  lineColor = "#22c55e",     // +++ Default line color to green +++
  showCandles = false,
  height = 400,
}: CandlestickChartProps) {
  console.log(`CandlestickChart: Received data prop with ${data?.length ?? 0} items. First item:`, data?.[0]);

  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<any> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"

  useEffect(() => {
    console.log("CandlestickChart: Chart effect running. Data length:", data?.length || 0);

    // Ensure data is valid
    if (!data || data.length === 0) {
      console.log("CandlestickChart: No data, skipping chart creation.");
      setIsLoading(false); // Stop loading if no data
      setError(null); // Clear previous errors if data becomes empty
      return;
    }

    // Ensure container ref is available
    if (!containerRef.current) {
      console.error("CandlestickChart: Container ref is not available yet.");
      // This might happen on fast refreshes, potentially retry or log error
      // For now, we'll just prevent chart creation this cycle.
      setError("Chart container not found during initialization.")
      setIsLoading(false);
      return;
    }

    // Ensure container has dimensions before creating chart
    const { clientWidth, clientHeight } = containerRef.current;
    console.log(`CandlestickChart: Container check inside main effect - Width: ${clientWidth}, Height: ${clientHeight}`);
    if (clientWidth === 0 || clientHeight === 0) {
        console.warn("CandlestickChart: Container has zero dimensions. Chart creation delayed.");
        // We could implement a small delay/retry here, but often the next data update will trigger the effect again when dimensions are ready.
        // If this happens consistently, layout issues might need fixing.
        setError("Chart container not ready (zero dimensions)."); // Optional error state
        setIsLoading(false); // Stop visual loading state
        return; // Stop chart creation for now
    }

    // If we reach here, data and container are ready
    setIsLoading(true); // Show loading specifically for chart creation/update
    setError(null); // Clear previous errors

    try {
      console.log("CandlestickChart: Attempting to create/update chart with dimensions:", clientWidth, "x", clientHeight);
      console.log("CandlestickChart: Container ref object:", containerRef.current);

      // Cleanup previous chart instance if it exists
      if (chartRef.current) {
        console.log("CandlestickChart: Removing previous chart instance.");
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }

      const chart = createChart(containerRef.current, {
        width: clientWidth,
        height: clientHeight,
        layout: {
          background: { color: "#000000" },
          textColor: "#9ca3af", // gray-400
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        grid: {
          vertLines: { color: "#27272a", style: 1 }, // zinc-800
          horzLines: { color: "#27272a", style: 1 }, // zinc-800
        },
        rightPriceScale: {
          scaleMargins: { top: 0.1, bottom: 0.1 },
          borderVisible: false,
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderVisible: false,
        },
        crosshair: {
          vertLine: {
            color: "rgba(255, 255, 255, 0.1)",
            width: 1,
            style: 1,
          },
          horzLine: {
            color: "rgba(255, 255, 255, 0.1)",
            width: 1,
            style: 1,
          },
        },
        handleScale: {
          axisPressedMouseMove: true,
        },
      });

      let series: ISeriesApi<any>;
      if (showCandles) {
        // Candlestick series
        console.log("CandlestickChart: Creating Candlestick series");
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: positiveColor,
          downColor: negativeColor,
          borderVisible: false,
          wickUpColor: positiveColor,
          wickDownColor: negativeColor,
        });
        const ohlcData: CandlestickData<UTCTimestamp>[] = data.map((d) => ({
          time: d.time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));
        candlestickSeries.setData(ohlcData);
        series = candlestickSeries;
      } else {
        // Line series
        console.log(`CandlestickChart: Creating Line series with color: ${lineColor}`);
        const lineSeries = chart.addSeries(LineSeries, {
          color: lineColor,
          lineWidth: 2,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        const lineData: LineData<UTCTimestamp>[] = data.map((d) => ({
          time: d.time,
          value: d.close,
        }));
        lineSeries.setData(lineData);
        series = lineSeries;
      }

      chartRef.current = chart;
      seriesRef.current = series;
      chart.timeScale().fitContent();
      console.log("CandlestickChart: Chart created/updated successfully");

    } catch (err) {
      console.error("CandlestickChart: Error during chart creation/update:", err);
      setError(err instanceof Error ? err.message : "Failed to create/update chart");
    } finally {
      setIsLoading(false); // Finish loading state
    }

    // Setup resize listener
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        console.log("CandlestickChart: Cleaning up chart instance.");
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [data, positiveColor, negativeColor, lineColor, showCandles, height]);

  return (
    <div className="relative w-full" style={{ height: `${height}px` }}>
      <div ref={containerRef} className="w-full h-full bg-black" />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
          <div className="space-y-3 w-full px-6">
            <Skeleton className="h-[80%] w-full bg-zinc-800" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-[100px] bg-zinc-800" />
              <Skeleton className="h-4 w-[60px] bg-zinc-800" />
            </div>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
          <div className="text-center p-6 bg-zinc-900 rounded-md">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Failed to load chart</h3>
            <p className="text-zinc-400 mb-4 text-sm">{error}</p>
          </div>
        </div>
      )}

      {!isLoading && !error && (!data || data.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
          <div className="text-center">
            <p className="text-zinc-400">No chart data available</p>
          </div>
        </div>
      )}
    </div>
  );
}
