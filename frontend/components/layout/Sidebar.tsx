"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, BookmarkIcon, Home, LineChart, Settings, Star, Search } from "lucide-react"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useSearch } from "@/context/SearchContext"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"

export function Sidebar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { openSearch } = useSearch()

  const isActive = (path: string) => {
    return pathname === path
  }

  const getInitials = (name?: string | null) => {
    if (!name) return ""
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <SidebarComponent>
      <SidebarHeader className="border-b">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Logo className="h-6 w-6" />
            Trade Lens
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground -mr-2"
            onClick={openSearch}
            aria-label="Open search"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/")}>
                  <Link href="/frontend/public">
                    <Home className="h-4 w-4" />
                    <span>Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/market")}>
                  <Link href="/market">
                    <BarChart3 className="h-4 w-4" />
                    <span>Market</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/portfolio")}>
                  <Link href="/portfolio">
                    <LineChart className="h-4 w-4" />
                    <span>Portfolio</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/favorites")}>
                  <Link href="/favorites">
                    <Star className="h-4 w-4" />
                    <span>Favorites</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Watchlists</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/watchlist/tech")}>
                  <Link href="/watchlist/tech">
                    <BookmarkIcon className="h-4 w-4" />
                    <span>Tech Stocks</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/watchlist/finance")}>
                  <Link href="/watchlist/finance">
                    <BookmarkIcon className="h-4 w-4" />
                    <span>Finance</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/watchlist/energy")}>
                  <Link href="/watchlist/energy">
                    <BookmarkIcon className="h-4 w-4" />
                    <span>Energy</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        {status === "loading" ? (
          <div className="h-10 w-full animate-pulse rounded bg-muted"></div>
        ) : session?.user ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? ""} />
              <AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{session.user.name}</span>
              <span className="text-xs text-muted-foreground">{session.user.email}</span>
            </div>
          </div>
        ) : null }
        <SidebarMenu className="mt-4">
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/settings")}>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarComponent>
  )
}
