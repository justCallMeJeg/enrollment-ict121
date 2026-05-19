import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { SidebarProvider } from "@/components/layout/sidebar-context"
import { SidebarMain } from "@/components/layout/sidebar-main"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { SessionPayload } from "@/types"

export function DashboardShell({
  user,
  children,
}: {
  user: SessionPayload
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <TooltipProvider delayDuration={300}>
        <Header user={user} />
        <Sidebar role={user.role} />
        <SidebarMain>{children}</SidebarMain>
      </TooltipProvider>
    </SidebarProvider>
  )
}
