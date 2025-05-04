import type React from "react"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // The parent layout frontend/app/(protected)/layout.tsx now handles the shared UI
  return <>{children}</>
} 