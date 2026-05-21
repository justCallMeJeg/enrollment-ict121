"use client"

import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"
import { useAdminYearContext } from "./admin-year-context"

export function SidebarMain({ children }: { children: React.ReactNode }) {
  const { mode } = useSidebar()
  const { years } = useAdminYearContext()
  const hasSidebar = years.length > 0

  return (
    <main
      className={cn(
        "mt-14 min-h-[calc(100vh-56px)] p-6 transition-[margin-left] duration-200 ease-in-out",
        hasSidebar ? (mode === "expanded" ? "ml-[240px]" : "ml-14") : "ml-0"
      )}
    >
      {children}
    </main>
  )
}
