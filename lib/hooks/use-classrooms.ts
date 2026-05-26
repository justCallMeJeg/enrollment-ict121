import useSWR from "swr"
import { fetcher } from "./fetcher"

export function useClassrooms(yearId: string | null | undefined, semId: string | null | undefined) {
  const key = yearId && semId ? `/api/admin/classrooms?yearId=${yearId}&semId=${semId}` : null
  const { data, isLoading, error, mutate } = useSWR(key, fetcher)
  return { classrooms: data ?? [], isLoading, error, mutate }
}
