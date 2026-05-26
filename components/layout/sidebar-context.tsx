"use client"

import { createContext, useContext, useState, useEffect } from "react"

export type SidebarMode = "expanded" | "hover" | "collapsed"

const SidebarContext = createContext<{
  mode: SidebarMode
  setMode: (m: SidebarMode) => void
}>({ mode: "expanded", setMode: () => {} })

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<SidebarMode>("expanded")

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-mode") as SidebarMode | null
    if (stored === "expanded" || stored === "hover" || stored === "collapsed") {
      setModeState(stored)
    }
  }, [])

  function setMode(m: SidebarMode) {
    setModeState(m)
    localStorage.setItem("sidebar-mode", m)
  }

  return (
    <SidebarContext.Provider value={{ mode, setMode }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
