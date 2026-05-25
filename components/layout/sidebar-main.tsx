"use client"

import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"

export function SidebarMain({ children }: { children: React.ReactNode }) {
  const { mode } = useSidebar()

  return (
    <main
      className={cn(
        "mt-14 min-h-[calc(100vh-56px)] p-6 transition-[margin-left] duration-200 ease-in-out",
        mode === "expanded" ? "ml-60" : "ml-14"
      )}
    >
      {children}
    </main>
  )
}
