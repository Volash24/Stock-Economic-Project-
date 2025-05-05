"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Sparkline } from "@/components/chart/Sparkline"
import { ArrowDown, ArrowUp } from "lucide-react"
import { motion } from "framer-motion"

interface Stock {
  symbol: string
  price: number
  change: number
  history: number[]
}

interface StockCardProps {
  title: string
  description: string
  stocks: Stock[]
  emptyState?: React.ReactNode
}

export function StockCard({ title, description, stocks, emptyState }: StockCardProps) {
  if (stocks.length === 0 && emptyState) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{emptyState}</CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {stocks.map((stock, index) => (
            <motion.div
              key={stock.symbol}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex flex-col">
                <Link href={`/stocks/${stock.symbol}`} className="font-medium hover:underline">
                  {stock.symbol}
                </Link>
                <div className="flex items-center text-sm">
                  <span className="text-muted-foreground mr-2">${stock.price.toFixed(2)}</span>
                  <span className={`flex items-center ${stock.change > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {stock.change > 0 ? (
                      <ArrowUp className="h-3 w-3 mr-0.5" />
                    ) : (
                      <ArrowDown className="h-3 w-3 mr-0.5" />
                    )}
                    {stock.change > 0 ? "+" : ""}
                    {stock.change.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="w-24 h-12">
                <Sparkline data={stock.history} color={stock.change > 0 ? "#10b981" : "#f43f5e"} />
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
