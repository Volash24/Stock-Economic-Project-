"use client"

import { useEffect, useRef } from "react"

interface SparklineProps {
  data: Array<[number, number]>
  color?: string
}

export function Sparkline({ data, color = "var(--success)" }: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Get the device pixel ratio
    const dpr = window.devicePixelRatio || 1

    // Set the canvas dimensions accounting for device pixel ratio
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr

    // Scale the context to ensure correct drawing
    ctx.scale(dpr, dpr)

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Extract just the price values
    const prices = data.map(([_, price]) => price)

    // Find min and max for scaling
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1 // Avoid division by zero

    // Determine if trend is positive or negative
    const isPositive = prices[prices.length - 1] >= prices[0]

    // Set color based on trend
    const actualColor = isPositive
      ? getComputedStyle(document.documentElement).getPropertyValue("--success").trim() || "#22c55e"
      : getComputedStyle(document.documentElement).getPropertyValue("--destructive").trim() || "#ef4444"

    // Draw the sparkline
    ctx.beginPath()
    ctx.strokeStyle = actualColor
    ctx.lineWidth = 2.5 // Make line thicker for better visibility

    prices.forEach((price, i) => {
      const x = (i / (prices.length - 1)) * canvas.offsetWidth
      const y = canvas.offsetHeight - ((price - min) / range) * canvas.offsetHeight

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()
  }, [data, color])

  return <canvas ref={canvasRef} className="w-full h-full" />
}
