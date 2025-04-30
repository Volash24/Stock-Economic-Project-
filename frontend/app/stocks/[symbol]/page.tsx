import { Card } from "@/components/ui/card"
import { CandlestickChart } from "@/components/chart/CandlestickChart"
import { fetchStockHistory, fetchStockStockInfo } from "@/lib/api"
import { ArrowDown, ArrowUp, Clock, DollarSign, Percent, TrendingUp } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function StockDetail({
  params,
}: {
  params: { symbol: string }
}) {
  const { symbol } = params
  const stockInfo = await fetchStockStockInfo(symbol)
  const stockHistory = await fetchStockHistory(symbol)

  if (!stockInfo) {
    return <div>Stock not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">{symbol}</h1>
          <div className={`flex items-center text-lg ${stockInfo.change > 0 ? "text-positive" : "text-negative"}`}>
            {stockInfo.change > 0 ? <ArrowUp className="h-5 w-5 mr-1" /> : <ArrowDown className="h-5 w-5 mr-1" />}
            {stockInfo.change > 0 ? "+" : ""}
            {stockInfo.change.toFixed(2)}%
          </div>
        </div>
        <p className="text-2xl font-semibold">${stockInfo.price.toFixed(2)}</p>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleTimeString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Price Chart</h3>
            <p className="text-sm text-muted-foreground">Historical price data</p>
          </div>
          <div className="p-6 pt-0">
            <Tabs defaultValue="1D">
              <TabsList>
                <TabsTrigger value="1D">1D</TabsTrigger>
                <TabsTrigger value="1W">1W</TabsTrigger>
                <TabsTrigger value="1M">1M</TabsTrigger>
                <TabsTrigger value="3M">3M</TabsTrigger>
                <TabsTrigger value="1Y">1Y</TabsTrigger>
                <TabsTrigger value="ALL">ALL</TabsTrigger>
              </TabsList>
              <TabsContent value="1D" className="h-[400px]">
                <CandlestickChart
                  data={stockHistory.slice(-24)}
                  positiveColor="var(--success)"
                  negativeColor="var(--destructive)"
                />
              </TabsContent>
              <TabsContent value="1W" className="h-[400px]">
                <CandlestickChart
                  data={stockHistory.slice(-7 * 24)}
                  positiveColor="var(--success)"
                  negativeColor="var(--destructive)"
                />
              </TabsContent>
              <TabsContent value="1M" className="h-[400px]">
                <CandlestickChart
                  data={stockHistory.slice(-30 * 24)}
                  positiveColor="var(--success)"
                  negativeColor="var(--destructive)"
                />
              </TabsContent>
              <TabsContent value="3M" className="h-[400px]">
                <CandlestickChart
                  data={stockHistory.slice(-90 * 24)}
                  positiveColor="var(--success)"
                  negativeColor="var(--destructive)"
                />
              </TabsContent>
              <TabsContent value="1Y" className="h-[400px]">
                <CandlestickChart
                  data={stockHistory.slice(-365 * 24)}
                  positiveColor="var(--success)"
                  negativeColor="var(--destructive)"
                />
              </TabsContent>
              <TabsContent value="ALL" className="h-[400px]">
                <CandlestickChart
                  data={stockHistory}
                  positiveColor="var(--success)"
                  negativeColor="var(--destructive)"
                />
              </TabsContent>
            </Tabs>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-xl font-semibold leading-none tracking-tight">Stock Information</h3>
              <p className="text-sm text-muted-foreground">Key metrics and data</p>
            </div>
            <div className="p-6 pt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Price</span>
                  </div>
                  <span className="font-medium">${stockInfo.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Percent className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Change</span>
                  </div>
                  <span className={`font-medium ${stockInfo.change > 0 ? "text-positive" : "text-negative"}`}>
                    {stockInfo.change > 0 ? "+" : ""}
                    {stockInfo.change.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Volume</span>
                  </div>
                  <span className="font-medium">{(Math.random() * 10000000).toFixed(0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Market Cap</span>
                  </div>
                  <span className="font-medium">${(Math.random() * 1000).toFixed(2)}B</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-xl font-semibold leading-none tracking-tight">Related Stocks</h3>
              <p className="text-sm text-muted-foreground">Similar companies</p>
            </div>
            <div className="p-6 pt-0">
              <div className="space-y-4">
                {["AAPL", "MSFT", "GOOGL", "AMZN", "META"]
                  .filter((s) => s !== symbol)
                  .slice(0, 4)
                  .map((sym) => (
                    <div key={sym} className="flex items-center justify-between">
                      <a href={`/stocks/${sym}`} className="font-medium hover:underline">
                        {sym}
                      </a>
                      <div className={Math.random() > 0.5 ? "text-positive" : "text-negative"}>
                        {Math.random() > 0.5 ? "+" : ""}
                        {(Math.random() * 5).toFixed(2)}%
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
