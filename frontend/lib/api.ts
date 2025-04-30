import type { Stock, StockInfo } from "@/types/stock"

// Mock data for stocks
const mockStocks: Stock[] = [
  {
    symbol: "AAPL",
    price: 182.63,
    change: 1.25,
    history: generateMockHistory(182.63, 30),
  },
  {
    symbol: "MSFT",
    price: 415.32,
    change: 0.78,
    history: generateMockHistory(415.32, 30),
  },
  {
    symbol: "GOOGL",
    price: 175.98,
    change: -0.45,
    history: generateMockHistory(175.98, 30),
  },
  {
    symbol: "AMZN",
    price: 178.75,
    change: 2.15,
    history: generateMockHistory(178.75, 30),
  },
  {
    symbol: "META",
    price: 485.39,
    change: -1.32,
    history: generateMockHistory(485.39, 30),
  },
  {
    symbol: "TSLA",
    price: 175.21,
    change: 3.45,
    history: generateMockHistory(175.21, 30),
  },
  {
    symbol: "NVDA",
    price: 950.02,
    change: 5.67,
    history: generateMockHistory(950.02, 30),
  },
  {
    symbol: "JPM",
    price: 198.45,
    change: -0.89,
    history: generateMockHistory(198.45, 30),
  },
  {
    symbol: "V",
    price: 275.63,
    change: 0.32,
    history: generateMockHistory(275.63, 30),
  },
  {
    symbol: "WMT",
    price: 68.92,
    change: -0.21,
    history: generateMockHistory(68.92, 30),
  },
]

// Generate mock historical data
function generateMockHistory(currentPrice: number, days: number): Array<[number, number]> {
  const now = Date.now()
  const history: Array<[number, number]> = []

  // Generate hourly data for the specified number of days
  for (let i = 0; i < days * 24; i++) {
    const timestamp = now - (days * 24 - i) * 60 * 60 * 1000
    const randomChange = (Math.random() - 0.5) * 5 // Random price change
    const price = currentPrice + randomChange
    history.push([timestamp, price])
  }

  return history
}

// Fetch list of stocks
export async function fetchStockList(): Promise<Stock[]> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))
  return mockStocks
}

// Fetch stock info by symbol
export async function fetchStockInfo(symbol: string): Promise<StockInfo | null> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  const stock = mockStocks.find((s) => s.symbol === symbol)
  if (!stock) return null

  return {
    symbol: stock.symbol,
    price: stock.price,
    change: stock.change,
  }
}

// Fetch stock info by symbol
export async function fetchStockStockInfo(symbol: string): Promise<StockInfo | null> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  const stock = mockStocks.find((s) => s.symbol === symbol)
  if (!stock) return null

  return {
    symbol: stock.symbol,
    price: stock.price,
    change: stock.change,
  }
}

// Fetch stock history by symbol
export async function fetchStockHistory(symbol: string): Promise<Array<[number, number]>> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  const stock = mockStocks.find((s) => s.symbol === symbol)
  if (!stock) return []

  return stock.history
}
