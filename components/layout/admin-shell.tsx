import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { SidebarProvider } from "@/components/layout/sidebar-context"
import { SidebarMain } from "@/components/layout/sidebar-main"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ContextBreadcrumb } from "@/components/layout/context-breadcrumb"
import { AdminYearContextProvider } from "@/components/layout/admin-year-context"
import type { SessionPayload } from "@/types"

export function AdminShell({
  user,
  children,
}: {
  user: SessionPayload
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <TooltipProvider delayDuration={300}>
        <AdminYearContextProvider>
          <Header user={user} breadcrumb={<ContextBreadcrumb />} />
          <Sidebar role={user.role} />
          <SidebarMain>{children}</SidebarMain>
        </AdminYearContextProvider>
      </TooltipProvider>
    </SidebarProvider>
  )
}
