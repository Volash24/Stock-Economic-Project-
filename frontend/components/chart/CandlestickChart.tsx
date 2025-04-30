"use client"

import { useEffect, useRef } from "react"
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  UTCTimestamp,
  CandlestickData,
  HistogramData,
} from "lightweight-charts"
import { useTheme } from "next-themes"

interface CandlestickChartProps {
  data: Array<[number, number]>
  positiveColor?: string
  negativeColor?: string
}

export function CandlestickChart({
  data,
  positiveColor = "var(--success)",
  negativeColor = "var(--destructive)",
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark"

  useEffect(() => {
    if (!chartContainerRef.current) return

    // Compute real CSS colors or fallbacks
    const getColorValue = (variable: string) => {
      const val = getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim()
      return val || (isDarkTheme ? "#7c3aed" : "#22c55e")
    }
    const upColor = getColorValue("--success")
    const downColor = getColorValue("--destructive")

    // Initialize chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: isDarkTheme ? "#1e293b" : "#ffffff" },
        textColor: isDarkTheme ? "#e2e8f0" : "#1e293b",
      },
      grid: {
        vertLines: { color: isDarkTheme ? "#334155" : "#e2e8f0" },
        horzLines: { color: isDarkTheme ? "#334155" : "#e2e8f0" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    })

    // Build OHLC data with UTCTimestamp
    const ohlcData: CandlestickData<UTCTimestamp>[] = data.map(
      ([ms, price], i, arr) => ({
        time: (ms / 1000) as UTCTimestamp,
        open: price,
        high: price + price * 0.01,
        low: price - price * 0.01,
        close: (arr[i + 1]?.[1] ?? price),
      })
    )

    // Candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor,
      downColor,
      borderVisible: false,
      wickUpColor: upColor,
      wickDownColor: downColor,
    })
    candlestickSeries.setData(ohlcData)

    // Volume histogram series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    })
    // Apply scale margins on the volume's price scale
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })

    // Build volume data
    const volumeData: HistogramData<UTCTimestamp>[] = ohlcData.map(d => ({
      time: d.time,
      value: Math.random() * 100_000 + 50_000,
      color: d.close >= d.open ? upColor : downColor,
    }))
    volumeSeries.setData(volumeData)

    chart.timeScale().fitContent()

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      chart.remove()
    }
  }, [data, isDarkTheme, positiveColor, negativeColor])

  return <div ref={chartContainerRef} className="w-full h-full" />
}
