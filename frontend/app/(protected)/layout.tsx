import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

// Import the GET handler which contains the options, aliased as authOptions
import { GET as authOptions } from "@/app/api/auth/[...nextauth]/route"
import { SidebarProvider } from "@/components/ui/sidebar"

import { Header } from "../../components/layout/Header"
import { Sidebar } from "../../components/layout/Sidebar"

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/")
  }

  return (
    <SidebarProvider>
      {/* Explicitly set width to screen width and prevent body scroll */}
      <div className="flex h-screen w-screen overflow-hidden">
        {/* Sidebar: occupies fixed width (16rem/256px) on md+ screens, doesn't shrink */}
        <div className="hidden md:block w-64 shrink-0 border-r"> {/* Added w-64 and shrink-0 */}
          <Sidebar />
        </div>

        {/* Main layout area */}
        <div className="flex flex-col flex-1"> {/* Removed overflow-hidden from here */}
          {/* Mobile Header */}
          <div className="block md:hidden">
            <Header />
          </div>
          {/* Main content: takes remaining space, scrolls internally, has padding */}
          <main className="flex-1 overflow-y-auto p-6 w-full"> {/* Changed overflow-auto to overflow-y-auto, added w-full */}
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
