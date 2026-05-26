"use client"

import { createContext, useContext, useMemo } from "react"
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

  // Resolve effective semester: URL param → active → pre_enrollment → first by creation order
  const effectiveSemesterId = useMemo(() => {
    if (semId) return semId
    if (!semesters.length) return null
    return (
      semesters.find((s) => s.status === "active")?.id ??
      semesters.find((s) => s.status === "pre_enrollment")?.id ??
      semesters[0]?.id ??
      null
    )
  }, [semId, semesters])

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
        currentSemesterId: effectiveSemesterId,
        selectYear,
        selectSemester,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

const EMPTY_STATE: AdminYearState = {
  years: [],
  semesters: [],
  currentYearId: null,
  currentSemesterId: null,
  selectYear: () => {},
  selectSemester: () => {},
}

export function useAdminYearContext(): AdminYearState {
  return useContext(Ctx) ?? EMPTY_STATE
}
