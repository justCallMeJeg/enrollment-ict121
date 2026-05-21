"use client"

import { createContext, useContext } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAcademicYears } from "@/lib/hooks/use-academic-years"
import { useSemesters } from "@/lib/hooks/use-semesters"
import type { AdminYearContext, AdminSemesterContext } from "@/types"

interface AdminYearState {
  years: AdminYearContext[]
  semesters: AdminSemesterContext[]
  currentYearId: string | null
  currentSemesterId: string | null
  selectYear: (id: string) => void
  selectSemester: (id: string) => void
}

const Ctx = createContext<AdminYearState | null>(null)

export function AdminYearContextProvider({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const yearId = (params?.yearId as string) ?? null
  const semId = (params?.semId as string) ?? null

  const { years } = useAcademicYears()
  const { semesters } = useSemesters(yearId)

  function selectYear(id: string) {
    router.push(`/admin/${id}`)
  }

  function selectSemester(id: string) {
    if (yearId) router.push(`/admin/${yearId}/${id}`)
  }

  return (
    <Ctx.Provider
      value={{
        years,
        semesters,
        currentYearId: yearId,
        currentSemesterId: semId,
        selectYear,
        selectSemester,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useAdminYearContext(): AdminYearState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useAdminYearContext must be used within AdminYearContextProvider")
  return ctx
}
