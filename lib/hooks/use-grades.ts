import useSWR from "swr"
import { fetcher } from "./fetcher"

export function useGrades(yearId: string | null, semId: string | null) {
  const key = yearId && semId ? `/api/admin/grades?yearId=${yearId}&semId=${semId}` : null
  const { data, isLoading, error, mutate } = useSWR(key, fetcher)
  return { grades: data ?? [], isLoading, error, mutate }
}
