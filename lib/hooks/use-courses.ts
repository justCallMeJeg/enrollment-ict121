import useSWR from "swr"
import { fetcher } from "./fetcher"

export function useCourses(yearId: string | null | undefined) {
  const key = yearId ? `/api/admin/courses?academic_year_id=${yearId}` : null
  const { data, isLoading, error, mutate } = useSWR(key, fetcher)
  return { courses: data ?? [], isLoading, error, mutate }
}
