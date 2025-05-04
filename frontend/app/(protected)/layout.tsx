import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { GET as authOptions } from "@/app/api/auth/[...nextauth]/route" // Import the GET handler which contains the options
import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/") // Redirect to landing page if not authenticated
  }

  // If session exists, render the children within the shared layout
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
