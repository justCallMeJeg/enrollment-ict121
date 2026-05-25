import useSWR from "swr"
import { fetcher } from "./fetcher"

export type DistributionEntry = { id: string; name: string; count: number }
export type ProgramEntry = { id: string; name: string; code: string; count: number }
export type YearLevelEntry = { year_level: number; label: string; count: number }

export type StudentDistribution = {
  by_college: DistributionEntry[]
  by_department: (DistributionEntry & { college: string })[]
  by_program: ProgramEntry[]
  by_year_level: YearLevelEntry[]
}

const EMPTY: StudentDistribution = {
  by_college: [],
  by_department: [],
  by_program: [],
  by_year_level: [],
}

export function useStudentDistribution(yearId: string | null | undefined) {
  const key = yearId ? `/api/admin/stats/students?yearId=${yearId}` : null
  const { data, isLoading, error } = useSWR<StudentDistribution>(key, fetcher)
  return { distribution: data ?? EMPTY, isLoading, error }
}
