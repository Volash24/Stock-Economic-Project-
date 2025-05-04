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
  lineColor = "#f97316", // orange-500
  showCandles = false,
  height = 400,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<any> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"
  const [isContainerReady, setIsContainerReady] = useState(false)

  // First effect: Check if container is ready
  useEffect(() => {
    if (containerRef.current) {
      // Make sure the container has dimensions
      const { clientWidth, clientHeight } = containerRef.current
      if (clientWidth > 0 && clientHeight > 0) {
        setIsContainerReady(true)
      } else {
        // If container exists but has no dimensions, use a timeout to check again
        const timer = setTimeout(() => {
          if (containerRef.current) {
            setIsContainerReady(true)
          }
        }, 100)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  // Second effect: Initialize chart once container is ready
  useEffect(() => {
    // Debug data
    console.log("Chart data received:", data?.length || 0, "items")
    console.log("Container ready:", isContainerReady)

    if (!isContainerReady) {
      return // Wait until container is ready
    }

    if (!containerRef.current) {
      console.error("Chart container ref is not available")
      setError("Chart container not found")
      setIsLoading(false)
      return
    }

    if (!data || data.length === 0) {
      console.error("No data available for chart")
      setError("No data available")
      setIsLoading(false)
      return
    }

    try {
      // Ensure container has dimensions
      const containerWidth = containerRef.current.clientWidth || 800

      console.log("Creating chart with width:", containerWidth, "height:", height)

      // Chart initialization
      const chart = createChart(containerRef.current, {
        width: containerWidth,
        height,
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
      })

      let series: ISeriesApi<any>

      if (showCandles) {
        // Candlestick series
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: positiveColor,
          downColor: negativeColor,
          borderVisible: false,
          wickUpColor: positiveColor,
          wickDownColor: negativeColor,
        })

        // Prepare and set data
        const ohlcData: CandlestickData<UTCTimestamp>[] = data.map((d) => ({
          time: d.time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }))
        candlestickSeries.setData(ohlcData)
        series = candlestickSeries
      } else {
        // Line series
        const lineSeries = chart.addSeries(LineSeries, {
          color: lineColor,
          lineWidth: 2,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
          lastValueVisible: false,
          priceLineVisible: false,
        })

        // Prepare and set data
        const lineData: LineData<UTCTimestamp>[] = data.map((d) => ({
          time: d.time,
          value: d.close,
        }))
        lineSeries.setData(lineData)
        series = lineSeries
      }

      // Store references
      chartRef.current = chart
      seriesRef.current = series

      // Fit content
      chart.timeScale().fitContent()
      setIsLoading(false)
      console.log("Chart created successfully")

      // Resize handling
      const handleResize = () => {
        if (containerRef.current && chartRef.current) {
          chartRef.current.applyOptions({ width: containerRef.current.clientWidth })
        }
      }
      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
        chart.remove()
      }
    } catch (err) {
      console.error("Error creating chart:", err)
      setError(err instanceof Error ? err.message : "Failed to create chart")
      setIsLoading(false)
    }
  }, [data, positiveColor, negativeColor, lineColor, showCandles, height, isContainerReady])

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="space-y-3 w-full px-6">
          <Skeleton className="h-[300px] w-full bg-zinc-800" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-[100px] bg-zinc-800" />
            <Skeleton className="h-4 w-[60px] bg-zinc-800" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-zinc-900 rounded-md">
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to load chart</h3>
          <p className="text-zinc-400 mb-4">{error}</p>
          <p className="text-zinc-500 text-sm">Check your network connection and API configuration</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full" style={{ height: `${height}px` }}>
      <div ref={containerRef} className="w-full h-full" />
      {(!data || data.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 rounded-md">
          <div className="text-center">
            <p className="text-zinc-400">No chart data available</p>
          </div>
        </div>
      )}
    </div>
  )
}
