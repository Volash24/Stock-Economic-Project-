import { Card } from '@/components/ui/card'
import { CandlestickChart, Candle } from '@/components/chart/CandlestickChart'
import {
  ArrowDown,
  ArrowUp,
  Clock,
  DollarSign,
  Percent,
  TrendingUp,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const dynamic = 'force-dynamic'  // ensures this page is always server-rendered

export default async function StockDetail({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  // 0) await params
  const { symbol } = await params

  // 1) Fetch profile & quote
  const [profileRes, quoteRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/stock/profile?symbol=${symbol}`),
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/stock/quote?symbol=${symbol}`),
  ])
  if (!profileRes.ok || !quoteRes.ok) {
    return <div>Stock not found</div>
  }
  const profile = await profileRes.json()
  const quote = await quoteRes.json()

  // 2) Compute key metrics
  const price = quote.c as number
  const changePct = ((quote.c - quote.pc) / quote.pc) * 100

  // 3) Fetch historical candles from Alpha Vantage
  const histRes = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/stock/av-candles?symbol=${symbol}`,
    { cache: 'no-store' }
  )
  if (!histRes.ok) {
    return <div>Could not load history</div>
  }
  const stockHistory = (await histRes.json()) as Candle[]

  // 4) Fetch peers & their change%
  const peersRes = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/stock/peers?symbol=${symbol}`
  )
  const peers: string[] = peersRes.ok ? await peersRes.json() : []
  const peerQuotes = await Promise.all(
    peers.slice(0, 4).map(async (peer) => {
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/stock/quote?symbol=${peer}`
      )
      const q = await r.json()
      return {
        symbol: peer,
        change: ((q.c - q.pc) / q.pc) * 100,
      }
    })
  )

  // 5) Render
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">{symbol}</h1>
          <div className={`flex items-center text-lg ${changePct > 0 ? 'text-positive' : 'text-negative'}`}>
            {changePct > 0
              ? <ArrowUp className="h-5 w-5 mr-1" />
              : <ArrowDown className="h-5 w-5 mr-1" />
            }
            {changePct.toFixed(2)}%
          </div>
        </div>
        <p className="text-2xl font-semibold">${price.toFixed(2)}</p>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="md:col-span-2">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Price Chart</h3>
            <p className="text-sm text-muted-foreground">Historical price data</p>
          </div>
          <div className="p-6 pt-0">
            <Tabs defaultValue="1D">
              <TabsList>
                {['1D','1W','1M','3M','1Y','ALL'].map(v => (
                  <TabsTrigger key={v} value={v}>{v}</TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="1D" className="h-[400px]">
                <CandlestickChart data={stockHistory.slice(-24)} />
              </TabsContent>
              <TabsContent value="1W" className="h-[400px]">
                <CandlestickChart data={stockHistory.slice(-7 * 24)} />
              </TabsContent>
              <TabsContent value="1M" className="h-[400px]">
                <CandlestickChart data={stockHistory.slice(-30 * 24)} />
              </TabsContent>
              <TabsContent value="3M" className="h-[400px]">
                <CandlestickChart data={stockHistory.slice(-90 * 24)} />
              </TabsContent>
              <TabsContent value="1Y" className="h-[400px]">
                <CandlestickChart data={stockHistory.slice(-365 * 24)} />
              </TabsContent>
              <TabsContent value="ALL" className="h-[400px]">
                <CandlestickChart data={stockHistory} />
              </TabsContent>
            </Tabs>
          </div>
        </Card>

        {/* Info & Peers */}
        <div className="space-y-6">
          <Card>
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-xl font-semibold leading-none tracking-tight">Stock Information</h3>
              <p className="text-sm text-muted-foreground">Key metrics and data</p>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <InfoRow
                icon={<DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />}
                label="Price"
                value={`$${price.toFixed(2)}`}
              />
              <InfoRow
                icon={<Percent className="h-4 w-4 mr-2 text-muted-foreground" />}
                label="Change"
                value={`${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%`}
                valueClass={changePct > 0 ? 'text-positive' : 'text-negative'}
              />
              <InfoRow
                icon={<TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />}
                label="Volume"
                value={stockHistory[stockHistory.length - 1]?.volume?.toLocaleString() ?? '—'}
              />
              <InfoRow
                icon={<Clock className="h-4 w-4 mr-2 text-muted-foreground" />}
                label="Market Cap"
                value={`$${profile.marketCapitalization.toLocaleString()}B`}
              />
            </div>
          </Card>

          <Card>
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-xl font-semibold leading-none tracking-tight">Related Stocks</h3>
              <p className="text-sm text-muted-foreground">Peers in industry</p>
            </div>
            <div className="p-6 pt-0 space-y-4">
              {peerQuotes.map(({ symbol: peer, change }) => (
                <div key={peer} className="flex items-center justify-between">
                  <a href={`/stocks/${peer}`} className="font-medium hover:underline">
                    {peer}
                  </a>
                  <span className={change > 0 ? 'text-positive' : 'text-negative'}>
                    {change > 0 ? '+' : ''}{change.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
  valueClass = '',
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  )
}
