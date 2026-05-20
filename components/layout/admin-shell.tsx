import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { SidebarProvider } from "@/components/layout/sidebar-context"
import { SidebarMain } from "@/components/layout/sidebar-main"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ContextBreadcrumb } from "@/components/layout/context-breadcrumb"
import type { SessionPayload, AdminYearContext, AdminSemesterContext } from "@/types"

export function AdminShell({
  user,
  years,
  semesters,
  currentYearId,
  currentSemesterId,
  children,
}: {
  user: SessionPayload
  years: AdminYearContext[]
  semesters: AdminSemesterContext[]
  currentYearId: string | null
  currentSemesterId: string | null
  children: React.ReactNode
}) {
  const currentSem = semesters.find((s) => s.id === currentSemesterId)
  const currentYear = years.find((y) => y.id === currentYearId)
  const semesterContext =
    currentSem && currentYear
      ? { id: currentSem.id, term: currentSem.term, ayLabel: currentYear.label }
      : undefined

  return (
    <SidebarProvider>
      <TooltipProvider delayDuration={300}>
        <Header
          user={user}
          breadcrumb={
            <ContextBreadcrumb
              years={years}
              semesters={semesters}
              currentYearId={currentYearId}
              currentSemesterId={currentSemesterId}
            />
          }
        />
        <Sidebar role={user.role} semesterContext={semesterContext} />
        <SidebarMain>{children}</SidebarMain>
      </TooltipProvider>
    </SidebarProvider>
  )
}
