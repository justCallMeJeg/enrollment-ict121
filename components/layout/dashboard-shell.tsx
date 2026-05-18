import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
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
    <TooltipProvider delayDuration={300}>
      <Header user={user} />
      <Sidebar role={user.role} />
      <main className="ml-[240px] mt-14 min-h-[calc(100vh-56px)] p-6">
        {children}
      </main>
    </TooltipProvider>
  )
}
