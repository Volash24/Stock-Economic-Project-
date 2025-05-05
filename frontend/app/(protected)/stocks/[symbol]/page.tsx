import { CandlestickChart, type Candle } from "@/components/chart/CandlestickChart"
import { ArrowDown, Maximize, Settings, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { StockChartSection } from "@/components/stock/StockChartSection"
import { StockAboutSection } from "@/components/stock/StockAboutSection"

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

          {/* --- Render the new Client Component for Chart and Tabs --- */}
          <StockChartSection symbol={symbol} />
          {/* --- End Client Component --- */}

          {/* About Section */}
          <StockAboutSection
            description={profile.description}
            companyName={profile.companyName}
            symbol={symbol}
          />

          {/* Key Info Section (Moved outside About) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 mb-8 mt-8">
            <div>
              <p className="text-zinc-400 text-sm mb-1">CEO</p>
              <p className="text-white">{profile.ceo || "N/A"}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-1">Employees</p>
              <p className="text-white">
                {profile.fullTimeEmployees
                  ? parseInt(profile.fullTimeEmployees).toLocaleString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-1">Headquarters</p>
              <p className="text-white">
                {profile.city
                  ? `${profile.city}, ${profile.state || profile.country}`
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-1">Founded</p>
              <p className="text-white">
                {profile.ipoDate ? new Date(profile.ipoDate).getFullYear() : "N/A"}
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-4">Key statistics</h2>
          <Separator className="mb-4 bg-zinc-800" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 mb-6">
            <div>
              <p className="text-zinc-400 text-sm mb-1">Market cap</p>
              <p className="text-white">
                {profile.mktCap
                  ? `${(profile.mktCap / 1_000_000_000_000).toFixed(2)}T`
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-1">Price-Earnings ratio</p>
              <p className="text-white">{profile.pe?.toFixed(2) || "N/A"}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-1">Dividend yield</p>
              <p className="text-white">N/A</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-1">Average volume</p>
              <p className="text-white">{quote.avgVolume ? `${(quote.avgVolume / 1_000_000).toFixed(2)}M` : "N/A"}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-1">High today</p>
              <p className="text-white">${quote.h?.toFixed(2) || "N/A"}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-1">Low today</p>
              <p className="text-white">${quote.l?.toFixed(2) || "N/A"}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-1">Open price</p>
              <p className="text-white">${quote.o?.toFixed(2) || "N/A"}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-1">Volume</p>
              <p className="text-white">{quote.v ? `${(quote.v / 1_000_000).toFixed(2)}M` : "N/A"}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-1">52 Week high</p>
              <p className="text-white">
                {profile.range ? `$${profile.range.split('-')[1]}` : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm mb-1">52 Week low</p>
              <p className="text-white">
                {profile.range ? `$${profile.range.split('-')[0]}` : "N/A"}
              </p>
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
