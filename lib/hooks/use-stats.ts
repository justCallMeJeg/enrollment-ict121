import useSWR from "swr"
import { fetcher } from "./fetcher"

interface Stats {
  students: number
  professors: number
  courses: number
}

export function useStats(yearId: string | null | undefined) {
  const key = yearId ? `/api/admin/stats?yearId=${yearId}` : null
  const { data, isLoading, error, mutate } = useSWR<Stats>(key, fetcher)
  return {
    stats: data ?? { students: 0, professors: 0, courses: 0 },
    isLoading,
    error,
    mutate,
  }
}
