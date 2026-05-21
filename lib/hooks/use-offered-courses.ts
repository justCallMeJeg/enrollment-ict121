import useSWR from "swr"
import { fetcher } from "./fetcher"

export function useOfferedCourses(yearId: string | null | undefined) {
  const key = yearId ? `/api/admin/courses/offered?yearId=${yearId}` : null
  const { data, isLoading, error, mutate } = useSWR(key, fetcher)
  return { courses: data ?? [], isLoading, error, mutate }
}
