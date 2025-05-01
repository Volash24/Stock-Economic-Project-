export interface StockListItem {
  symbol: string
  price: number
  change: number
  history: number[]
}

export async function fetchStockList(): Promise<StockListItem[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/stock/list`)
  if (!res.ok) throw new Error('Failed to fetch stock list')
  return res.json()
}
