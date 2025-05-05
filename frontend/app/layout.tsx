import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/sonner"
import { SearchProvider } from "@/context/SearchContext"
import { SearchModal } from "@/components/search/SearchModal"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Stock Dashboard",
  description: "A Next.js 15 stock dashboard prototype",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SearchProvider>
          <Providers>
            {children}
          </Providers>
          <SearchModal />
          <Toaster />
        </SearchProvider>
      </body>
    </html>
  )
}
