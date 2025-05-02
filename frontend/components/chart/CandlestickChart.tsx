'use client'

import { useEffect, useRef } from 'react'
import {
  createChart,
  UTCTimestamp,
  CandlestickSeries,
  HistogramSeries,
  CandlestickData,
  HistogramData,
  IChartApi,
  ISeriesApi,
} from 'lightweight-charts'
import { useTheme } from 'next-themes'

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
  height?: number
}

export function CandlestickChart({
  data,
  positiveColor = 'var(--success)',
  negativeColor = 'var(--destructive)',
  height = 400,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === 'dark'

  useEffect(() => {
    if (!containerRef.current) return

    // Chart initialization
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: isDarkTheme ? '#0f172a' : '#ffffff' },
        textColor: isDarkTheme ? '#e2e8f0' : '#1e293b',
      },
      grid: {
        vertLines: { color: isDarkTheme ? '#1e293b' : '#f1f5f9' },
        horzLines: { color: isDarkTheme ? '#1e293b' : '#f1f5f9' },
      },
      rightPriceScale: { scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { timeVisible: true, secondsVisible: false },
    })

    // Candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: positiveColor,
      downColor: negativeColor,
      borderVisible: false,
      wickUpColor: positiveColor,
      wickDownColor: negativeColor,
    })

    // Volume histogram series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    })
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })

    // Store references
    chartRef.current = chart
    candleSeriesRef.current = candlestickSeries
    volumeSeriesRef.current = volumeSeries

    // Prepare and set data
    const ohlcData: CandlestickData<UTCTimestamp>[] = data.map(d => ({
      time: d.time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }))
    candlestickSeries.setData(ohlcData)

    const volumeData: HistogramData<UTCTimestamp>[] = data.map(d => ({
      time: d.time,
      value: d.volume ?? 0,
      color: d.close >= d.open ? positiveColor : negativeColor,
    }))
    volumeSeries.setData(volumeData)

    // Fit content
    chart.timeScale().fitContent()

    // Resize handling
    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [data, positiveColor, negativeColor, isDarkTheme, height])

  return <div ref={containerRef} style={{ width: '100%' }} />
}
