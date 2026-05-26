import useSWR from "swr"
import { fetcher } from "./fetcher"

export function useProfessors() {
  const { data, isLoading, error, mutate } = useSWR("/api/admin/professors", fetcher)
  return { professors: data ?? [], isLoading, error, mutate }
}
