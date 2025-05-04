/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios'
import { UTCTimestamp } from 'lightweight-charts'
import { Candle } from '@/components/chart/CandlestickChart'

const AV_KEY = process.env.ALPHA_VANTAGE_API_KEY
const avClient = axios.create({
  baseURL: 'https://www.alphavantage.co/query',
})

/** 60-minute intraday for the past ~day */
export async function getAVIntraday(symbol: string): Promise<Candle[]> {
  const res = await avClient.get('', {
    params: {
      function: 'TIME_SERIES_INTRADAY',
      symbol,
      interval: '60min',
      outputsize: 'compact',  // last 100 points
      apikey: AV_KEY,
    },
  })
  const series = res.data['Time Series (60min)'] as Record<string, any>
  return Object.entries(series)
    .map(([ts, ohlc]) => ({
      time: (new Date(ts).getTime() / 1000) as UTCTimestamp,
      open:  +ohlc['1. open'],
      high:  +ohlc['2. high'],
      low:   +ohlc['3. low'],
      close: +ohlc['4. close'],
      volume:+ohlc['5. volume'],
    }))
    .sort((a, b) => a.time - b.time)
}
