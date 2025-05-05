"use client"

import { Card } from "@/components/ui/card"
import { FavoriteButton } from "@/components/buttons/FavoriteButton"
import { Sparkline } from "@/components/chart/Sparkline"
import Link from "next/link"
import { ArrowDown, ArrowUp, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { motion } from "framer-motion"

interface Stock {
  symbol: string
  price: number
  change: number
  history: number[]
}

interface StockTableProps {
  stocks: Stock[]
  favoriteSymbols: Set<string>
}

export function StockTable({ stocks, favoriteSymbols }: StockTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<"symbol" | "price" | "change">("change")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Filter stocks based on search query
  const filteredStocks = stocks.filter((stock) => stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()))

  // Sort stocks based on sort field and direction
  const sortedStocks = [...filteredStocks].sort((a, b) => {
    if (sortField === "symbol") {
      return sortDirection === "asc" ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol)
    } else if (sortField === "price") {
      return sortDirection === "asc" ? a.price - b.price : b.price - a.price
    } else {
      // Sort by absolute change for "change" field
      return sortDirection === "asc" ? a.change - b.change : b.change - a.change
    }
  })

  // Handle sort click
  const handleSort = (field: "symbol" | "price" | "change") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Render sort indicator
  const renderSortIndicator = (field: "symbol" | "price" | "change") => {
    if (sortField !== field) return null

    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 inline" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 inline" />
    )
  }

  return (
    <Card>
      <div className="p-4 flex items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search stocks..."
            className="w-full pl-8 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="ml-auto text-sm text-muted-foreground">{filteredStocks.length} stocks</div>
      </div>

      <div className="rounded-md border mx-4 mb-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th
                  className="h-10 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("symbol")}
                >
                  Symbol {renderSortIndicator("symbol")}
                </th>
                <th
                  className="h-10 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("price")}
                >
                  Price {renderSortIndicator("price")}
                </th>
                <th
                  className="h-10 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("change")}
                >
                  Change {renderSortIndicator("change")}
                </th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                  Chart <span className="text-xs text-muted-foreground">(1W)</span>
                </th>
                <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground">Favorite</th>
              </tr>
            </thead>
            <tbody>
              {sortedStocks.length > 0 ? (
                sortedStocks.map((stock, index) => (
                  <motion.tr
                    key={stock.symbol}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="p-4 align-middle">
                      <Link href={`/stocks/${stock.symbol}`} className="font-medium hover:underline">
                        {stock.symbol}
                      </Link>
                    </td>
                    <td className="p-4 align-middle font-mono">${stock.price.toFixed(2)}</td>
                    <td className="p-4 align-middle">
                      <Badge variant={stock.change > 0 ? "success" : "destructive"} className="font-mono">
                        {stock.change > 0 ? (
                          <ArrowUp className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDown className="h-3 w-3 mr-1" />
                        )}
                        {stock.change > 0 ? "+" : ""}
                        {stock.change.toFixed(2)}%
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="w-24 h-12">
                        <Sparkline data={stock.history} color={stock.change > 0 ? "#10b981" : "#f43f5e"} />
                      </div>
                    </td>
                    <td className="p-4 align-middle text-center">
                      <FavoriteButton
                        stockSymbol={stock.symbol}
                        initialIsFavorite={favoriteSymbols.has(stock.symbol)}
                      />
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No stocks found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  )
}
