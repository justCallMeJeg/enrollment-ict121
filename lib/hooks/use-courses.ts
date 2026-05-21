import useSWR from "swr"
import { fetcher } from "./fetcher"

export function useCourses() {
  const { data, isLoading, error, mutate } = useSWR("/api/admin/courses", fetcher)
  return { courses: data ?? [], isLoading, error, mutate }
}
