import useSWR from "swr"
import { fetcher } from "./fetcher"

export function useYearClassrooms(yearId: string | null | undefined) {
  const key = yearId ? `/api/admin/classrooms?yearId=${yearId}` : null
  const { data, isLoading, error, mutate } = useSWR(key, fetcher)
  return { classrooms: data ?? [], isLoading, error, mutate }
}
