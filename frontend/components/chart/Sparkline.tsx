'use client'

import React, { useEffect, useRef } from 'react'

interface SparklineProps {
  data: number[]
  color?: string
}

export function Sparkline({ data, color }: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Handle high-DPI screens
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)

    // Clear
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

    const prices = data
    if (!prices || prices.length < 2) {
      console.warn('Sparkline received insufficient data:', prices)
      return
    }

    // Compute bounds
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1

    // Determine stroke color
    const cssColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--success')
      .trim() || '#22c55e'
    const actualColor = color ?? cssColor
        ctx.beginPath()
        ctx.strokeStyle = actualColor
        ctx.lineWidth = 2

    prices.forEach((price, i) => {
      const x = (i / (prices.length - 1)) * canvas.offsetWidth
      const y =
        canvas.offsetHeight - ((price - min) / range) * canvas.offsetHeight

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
