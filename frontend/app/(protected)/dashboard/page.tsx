import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchStockList } from "@/lib/api"
import { Sparkline } from "@/components/chart/Sparkline"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, Clock, RefreshCw, Star } from "lucide-react"
import { getFavoriteStocks } from "@/lib/actions/favorites"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StockCard } from "@/components/ui/stock-card"
import { StockTable } from "@/components/ui/stock-table"

// Define the list of top 50 stock symbols
const top50Symbols = [
  "MSFT",
  "AAPL",
  "NVDA",
  "AMZN",
  "GOOG",
  "META",
  "BRK.B",
  "AVGO",
  "TSLA",
  "WMT",
  "LLY",
  "JPM",
  "V",
  "MA",
  "NFLX",
  "XOM",
  "COST",
  "ORCL",
  "PG",
  "JNJ",
  "UNH",
  "HD",
  "ABBV",
  "BAC",
  "KO",
  "PLTR",
  "TMUS",
  "PM",
  "CRM",
  "CVX",
  "WFC",
  "CSCO",
  "ABT",
  "IBM",
  "MCD",
  "GE",
  "MRK",
  "NOW",
  "T",
  "AXP",
  "MS",
  "ISRG",
  "VZ",
  "PEP",
  "INTU",
  "UBER",
  "GS",
  "RTX",
  "BKNG",
  "BX",
]

export default async function Dashboard() {
  const [allStocks, favoriteSymbolsList] = await Promise.all([fetchStockList(top50Symbols), getFavoriteStocks()])

  // Filter stocks to include only those in the top50Symbols list
  const stocks = allStocks.filter((stock) => top50Symbols.includes(stock.symbol))

  // Create a Set for efficient favorite lookup
  const favoriteSymbols = new Set(favoriteSymbolsList)

  // Get favorite stocks
  const favoriteStocks = stocks.filter((stock) => favoriteSymbols.has(stock.symbol))

  // Get top performers
  const topPerformers = [...stocks].sort((a, b) => b.change - a.change).slice(0, 5)

  // Get market movers (biggest changes)
  const marketMovers = [...stocks].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 5)

  // Calculate market summary
  const marketUp = stocks.filter((stock) => stock.change > 0).length
  const marketDown = stocks.filter((stock) => stock.change < 0).length
  const marketFlat = stocks.length - marketUp - marketDown
  const averageChange = stocks.reduce((sum, stock) => sum + stock.change, 0) / stocks.length

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Market Dashboard</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            Last updated:{" "}
            {new Date().toLocaleTimeString("en-US", {
              timeZone: "America/Denver",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
          <Badge variant="outline" className="ml-2 gap-1">
            <RefreshCw className="h-3 w-3" />
            <span>Live</span>
          </Badge>
        </div>
      </div>

      {/* Market Summary Card */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Market Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-2xl font-bold">{averageChange > 0 ? "Bullish" : "Bearish"}</span>
                <span
                  className={`flex items-center text-sm ${averageChange > 0 ? "text-emerald-500" : "text-rose-500"}`}
                >
                  {averageChange > 0 ? <ArrowUp className="mr-1 h-4 w-4" /> : <ArrowDown className="mr-1 h-4 w-4" />}
                  {Math.abs(averageChange).toFixed(2)}%
                </span>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                >
                  {marketUp} ↑
                </Badge>
                <Badge variant="outline" className="bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                  {marketDown} ↓
                </Badge>
                <Badge variant="outline" className="bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-400">
                  {marketFlat} →
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Gainers Card */}
        <Card className="overflow-hidden border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Gainer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Link href={`/stocks/${topPerformers[0]?.symbol}`} className="text-2xl font-bold hover:underline">
                  {topPerformers[0]?.symbol}
                </Link>
                <span className="flex items-center text-emerald-500">
                  <ArrowUp className="mr-1 h-4 w-4" />
                  {topPerformers[0]?.change.toFixed(2)}%
                </span>
              </div>
              <div className="w-24 h-16">
                <Sparkline data={topPerformers[0]?.history || []} color="#10b981" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Losers Card */}
        <Card className="overflow-hidden border-l-4 border-l-rose-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Loser</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Link
                  href={`/stocks/${[...stocks].sort((a, b) => a.change - b.change)[0]?.symbol}`}
                  className="text-2xl font-bold hover:underline"
                >
                  {[...stocks].sort((a, b) => a.change - b.change)[0]?.symbol}
                </Link>
                <span className="flex items-center text-rose-500">
                  <ArrowDown className="mr-1 h-4 w-4" />
                  {Math.abs([...stocks].sort((a, b) => a.change - b.change)[0]?.change ?? 0).toFixed(2)}%
                </span>
              </div>
              <div className="w-24 h-16">
                <Sparkline data={[...stocks].sort((a, b) => a.change - b.change)[0]?.history || []} color="#f43f5e" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Most Active Card */}
        <Card className="overflow-hidden border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Link href={`/stocks/${stocks[0]?.symbol}`} className="text-2xl font-bold hover:underline">
                  {stocks[0]?.symbol}
                </Link>
                <span className={`flex items-center ${stocks[0]?.change > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {stocks[0]?.change > 0 ? (
                    <ArrowUp className="mr-1 h-4 w-4" />
                  ) : (
                    <ArrowDown className="mr-1 h-4 w-4" />
                  )}
                  {Math.abs(stocks[0]?.change ?? 0).toFixed(2)}%
                </span>
              </div>
              <div className="w-24 h-16">
                <Sparkline data={stocks[0]?.history || []} color={stocks[0]?.change > 0 ? "#10b981" : "#f43f5e"} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="watchlist" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span>Watchlist</span>
            {favoriteStocks.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 rounded-full px-2">
                {favoriteStocks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Stocks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <StockCard title="Top Performers" description="Best performing stocks today" stocks={topPerformers} />

            <StockCard title="Market Movers" description="Biggest price movements" stocks={marketMovers} />

            <StockCard
              title="Your Watchlist"
              description="Stocks you're tracking"
              stocks={favoriteStocks.length > 0 ? favoriteStocks : stocks.slice(0, 5)}
              emptyState={
                favoriteStocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Star className="mb-2 h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">Add stocks to your watchlist</p>
                  </div>
                ) : null
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="watchlist">
          {favoriteStocks.length > 0 ? (
            <StockTable stocks={favoriteStocks} favoriteSymbols={favoriteSymbols} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Star className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-lg font-medium">Your watchlist is empty</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add stocks to your watchlist by clicking the star icon next to any stock
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all">
          <StockTable stocks={stocks} favoriteSymbols={favoriteSymbols} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
