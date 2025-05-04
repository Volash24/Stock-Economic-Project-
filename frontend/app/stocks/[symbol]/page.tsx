import { CandlestickChart, type Candle } from "@/components/chart/CandlestickChart"
import { ArrowDown, Maximize, Settings, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic" // ensures this page is always server-rendered

export default async function StockDetail({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  // 0) await params
  const { symbol } = await params

  try {
    // 1) Fetch profile & quote
    const [profileRes, quoteRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/stock/profile?symbol=${symbol}`),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/stock/quote?symbol=${symbol}`),
    ])

    if (!profileRes.ok || !quoteRes.ok) {
      console.error("API Error:", {
        profile: profileRes.status,
        quote: quoteRes.status,
      })

      return (
        <div className="min-h-screen bg-black text-white">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <div className="flex items-center justify-center h-[50vh] flex-col">
              <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Stock Not Found</h2>
              <p className="text-zinc-400 mb-6">We couldn't find information for symbol {symbol}</p>
              <div className="bg-zinc-900 p-4 rounded-md text-left w-full max-w-lg">
                <h3 className="text-sm font-medium text-zinc-300 mb-2">Debug Information:</h3>
                <p className="text-xs text-zinc-500">Profile API Status: {profileRes.status}</p>
                <p className="text-xs text-zinc-500">Quote API Status: {quoteRes.status}</p>
                <p className="text-xs text-zinc-500 mt-2">Base URL: {process.env.NEXT_PUBLIC_BASE_URL || "Not set"}</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    const profile = await profileRes.json()
    const quote = await quoteRes.json()

    // 2) Compute key metrics
    const price = quote.c as number
    const changePct = ((quote.c - quote.pc) / quote.pc) * 100
    const changeAmt = quote.c - quote.pc

    // 3) Fetch historical candles from Alpha Vantage
    const histRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/stock/av-candles?symbol=${symbol}`, {
      cache: "no-store",
    })

    if (!histRes.ok) {
      console.error("Historical data API error:", histRes.status)

      return (
        <div className="min-h-screen bg-black text-white">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <div className="mb-2">
              <h1 className="text-3xl font-bold">{profile.name || symbol}</h1>
              <div className="flex flex-col mt-1">
                <span className="text-4xl font-bold">${price.toFixed(2)}</span>
                <div className="flex flex-col mt-1">
                  <div className="text-orange-500 flex items-center">
                    {changeAmt < 0 && <ArrowDown className="h-4 w-4 mr-1" />}
                    <span className="font-medium">
                      {changeAmt < 0 ? "-" : "+"}${Math.abs(changeAmt).toFixed(2)} ({Math.abs(changePct).toFixed(2)}%)
                    </span>{" "}
                    <span className="ml-1">Today</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center h-[400px] bg-zinc-900 rounded-md mt-8">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Historical Data Unavailable</h3>
                <p className="text-zinc-400">We couldn't load chart data for {symbol}</p>
                <p className="text-xs text-zinc-500 mt-4">API Status: {histRes.status}</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    const stockHistory = (await histRes.json()) as Candle[]

    if (!stockHistory || stockHistory.length === 0) {
      console.error("Empty historical data received")
    } else {
      console.log(`Received ${stockHistory.length} historical data points`)
    }

    // 4) Fetch peers & their change%
    const peersRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/stock/peers?symbol=${symbol}`)
    const peers: string[] = peersRes.ok ? await peersRes.json() : []
    const peerQuotes = await Promise.all(
      peers.slice(0, 5).map(async (peer) => {
        const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/stock/quote?symbol=${peer}`)
        const q = await r.json()
        return {
          symbol: peer,
          price: q.c,
          change: ((q.c - q.pc) / q.pc) * 100,
        }
      }),
    )

    // 5) Render
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header */}
          <div className="mb-2">
            <h1 className="text-3xl font-bold">{profile.name || symbol}</h1>
            <div className="flex flex-col mt-1">
              <span className="text-4xl font-bold">${price.toFixed(2)}</span>
              <div className="flex flex-col mt-1">
                <div className="text-orange-500 flex items-center">
                  {changeAmt < 0 && <ArrowDown className="h-4 w-4 mr-1" />}
                  <span className="font-medium">
                    {changeAmt < 0 ? "-" : "+"}${Math.abs(changeAmt).toFixed(2)} ({Math.abs(changePct).toFixed(2)}%)
                  </span>{" "}
                  <span className="ml-1">Today</span>
                </div>
                {/* After-hours data would go here if available */}
                <div className="text-orange-500 text-sm mt-0.5">
                  <span>-$0.00 (-0.00%) After-hours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 mb-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
            >
              <Maximize className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          <Separator className="my-4 bg-zinc-800" />

          {/* Chart */}
          <div className="mt-6 mb-4 h-[400px]">
            <CandlestickChart
              data={stockHistory}
              positiveColor="#22c55e"
              negativeColor="#f97316"
              lineColor="#f97316"
              showCandles={false}
              height={400}
            />
          </div>

          {/* Time period selectors */}
          <div className="mt-2">
            <Tabs defaultValue="1D" className="w-full">
              <TabsList className="bg-transparent border-b border-zinc-800 w-full justify-start h-auto p-0">
                {["1D", "1W", "1M", "3M", "YTD", "1Y", "5Y", "MAX"].map((period) => (
                  <TabsTrigger
                    key={period}
                    value={period}
                    className="px-4 py-2 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-orange-500 text-zinc-400 hover:text-white"
                  >
                    {period}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="1D" className="mt-0">
                {/* Content is the chart above, we're just using tabs for the selector UI */}
              </TabsContent>
            </Tabs>
          </div>

          {/* About Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <Separator className="mb-4 bg-zinc-800" />

            <p className="text-zinc-300 mb-2">
              {profile.name}, Inc. engages in the design, manufacture, and sale of smartphones, personal computers,
              tablets, wearables and accessories, and other varieties of related services. It operates through the
              following geographical segments: Americas, Europe, Greater China, Japan, and Rest of Asia Pacific.
            </p>
            <button className="text-orange-500 text-sm mb-8">Show more</button>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 mb-8">
              <div>
                <p className="text-zinc-400 text-sm mb-1">CEO</p>
                <p className="text-white">{profile.ceo || "Timothy Donald Cook"}</p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">Employees</p>
                <p className="text-white">{profile.employees?.toLocaleString() || "164,000"}</p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">Headquarters</p>
                <p className="text-white">
                  {profile.city ? `${profile.city}, ${profile.state || profile.country}` : "Cupertino, California"}
                </p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">Founded</p>
                <p className="text-white">{profile.ipo ? new Date(profile.ipo).getFullYear() : "1976"}</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">Key statistics</h2>
            <Separator className="mb-4 bg-zinc-800" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 mb-6">
              <div>
                <p className="text-zinc-400 text-sm mb-1">Market cap</p>
                <p className="text-white">
                  {profile.marketCapitalization ? `${profile.marketCapitalization.toFixed(2)}T` : "3.08T"}
                </p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">Price-Earnings ratio</p>
                <p className="text-white">{profile.pe || "33.91"}</p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">Dividend yield</p>
                <p className="text-white">
                  {profile.dividendYield ? `${(profile.dividendYield * 100).toFixed(2)}%` : "0.47%"}
                </p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">Average volume</p>
                <p className="text-white">{quote.v ? `${(quote.v / 1000000).toFixed(2)}M` : "52.44M"}</p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">High today</p>
                <p className="text-white">${quote.h?.toFixed(2) || "208.03"}</p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">Low today</p>
                <p className="text-white">${quote.l?.toFixed(2) || "202.16"}</p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">Open price</p>
                <p className="text-white">${quote.o?.toFixed(2) || "206.09"}</p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">Volume</p>
                <p className="text-white">{quote.v ? `${(quote.v / 1000000).toFixed(2)}M` : "101.01M"}</p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">52 Week high</p>
                <p className="text-white">${profile.high52 || "260.10"}</p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">52 Week low</p>
                <p className="text-white">${profile.low52 || "169.21"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Unhandled error in stock detail page:", error)

    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-center justify-center h-[50vh] flex-col">
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-zinc-400 mb-6">We encountered an error while loading data for {symbol}</p>
            <div className="bg-zinc-900 p-4 rounded-md text-left w-full max-w-lg">
              <h3 className="text-sm font-medium text-zinc-300 mb-2">Debug Information:</h3>
              <p className="text-xs text-zinc-500">Error: {error instanceof Error ? error.message : String(error)}</p>
              <p className="text-xs text-zinc-500 mt-2">Base URL: {process.env.NEXT_PUBLIC_BASE_URL || "Not set"}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
