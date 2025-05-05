import { Card } from "@/components/ui/card"
import { fetchStockList } from "@/lib/api"
import { Sparkline } from "@/components/chart/Sparkline"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp } from "lucide-react"
import { getFavoriteStocks } from "@/lib/actions/favorites"
import { FavoriteButton } from "@/components/buttons/FavoriteButton"

// Define the list of top 50 stock symbols
const top50Symbols = [
  "MSFT", "AAPL", "NVDA", "AMZN", "GOOG", "META", "BRK.B", "AVGO", "TSLA", "WMT",
  "LLY", "JPM", "V", "MA", "NFLX", "XOM", "COST", "ORCL", "PG", "JNJ",
  "UNH", "HD", "ABBV", "BAC", "KO", "PLTR", "TMUS", "PM", "CRM", "CVX",
  "WFC", "CSCO", "ABT", "IBM", "MCD", "GE", "MRK", "NOW", "T", "AXP",
  "MS", "ISRG", "VZ", "PEP", "INTU", "UBER", "GS", "RTX", "BKNG", "BX"
];

export default async function Dashboard() {
  const [allStocks, favoriteSymbolsList] = await Promise.all([
    fetchStockList(),
    getFavoriteStocks()
  ]);

  // Filter stocks to include only those in the top50Symbols list
  const stocks = allStocks.filter(stock => top50Symbols.includes(stock.symbol));

  // Create a Set for efficient favorite lookup
  const favoriteSymbols = new Set(favoriteSymbolsList);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Market Overview</h1>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleTimeString('en-US', { timeZone: 'America/Denver', hour: 'numeric', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Market Summary</h3>
            <p className="text-sm text-muted-foreground">Top performing stocks today</p>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-4">
              {stocks
                .sort((a, b) => b.change - a.change)
                .slice(0, 5)
                .map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between">
                    <div>
                      <Link href={`/stocks/${stock.symbol}`} className="font-medium hover:underline">
                        {stock.symbol}
                      </Link>
                      <div className={stock.change > 0 ? "text-positive" : "text-negative"}>
                        {stock.change > 0 ? "+" : ""}
                        {stock.change.toFixed(2)}%
                      </div>
                    </div>
                    <div className="w-24 h-12">
                      <Sparkline data={stock.history} color={stock.change > 0 ? "#22c55e" : "#ef4444"} />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Watchlist</h3>
            <p className="text-sm text-muted-foreground">Your tracked stocks</p>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-4">
              {stocks.slice(0, 5).map((stock) => (
                <div key={stock.symbol} className="flex items-center justify-between">
                  <div>
                    <Link href={`/stocks/${stock.symbol}`} className="font-medium hover:underline">
                      {stock.symbol}
                    </Link>
                    <div className={stock.change > 0 ? "text-positive" : "text-negative"}>
                      {stock.change > 0 ? "+" : ""}
                      {stock.change.toFixed(2)}%
                    </div>
                  </div>
                  <div className="w-24 h-12">
                    <Sparkline data={stock.history} color={stock.change > 0 ? "#22c55e" : "#ef4444"} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Market Movers</h3>
            <p className="text-sm text-muted-foreground">Biggest price changes</p>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-4">
              {stocks
                .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
                .slice(0, 5)
                .map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between">
                    <div>
                      <Link href={`/stocks/${stock.symbol}`} className="font-medium hover:underline">
                        {stock.symbol}
                      </Link>
                      <div className="flex items-center">
                        <Badge variant={stock.change > 0 ? "success" : "destructive"} className="text-xs">
                          {stock.change > 0 ? (
                            <ArrowUp className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDown className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(stock.change).toFixed(2)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="w-24 h-12">
                      <Sparkline data={stock.history} color={stock.change > 0 ? "#22c55e" : "#ef4444"} />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </Card>
      </div>

      <div>
        <Card>
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">All Stocks</h3>
            <p className="text-sm text-muted-foreground">Complete market overview</p>
          </div>
          <div className="p-6 pt-0">
            <div className="rounded-md border">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Symbol</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Price</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Change</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Chart <span className="text-xs text-zinc-500">(1W)</span>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Favorite</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {stocks.map((stock) => (
                    <tr
                      key={stock.symbol}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <td className="p-4 align-middle">
                        <Link href={`/stocks/${stock.symbol}`} className="font-medium hover:underline">
                          {stock.symbol}
                        </Link>
                      </td>
                      <td className="p-4 align-middle">${stock.price.toFixed(2)}</td>
                      <td className={`p-4 align-middle ${stock.change > 0 ? "text-positive" : "text-negative"}`}>
                        <div className="flex items-center">
                          {stock.change > 0 ? (
                            <ArrowUp className="h-4 w-4 mr-1" />
                          ) : (
                            <ArrowDown className="h-4 w-4 mr-1" />
                          )}
                          {stock.change > 0 ? "+" : ""}
                          {stock.change.toFixed(2)}%
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="w-24 h-12">
                          <Sparkline data={stock.history} color={stock.change > 0 ? "#22c55e" : "#ef4444"} />
                        </div>
                      </td>
                      <td className="p-4 align-middle text-center">
                        <FavoriteButton
                          stockSymbol={stock.symbol}
                          initialIsFavorite={favoriteSymbols.has(stock.symbol)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
