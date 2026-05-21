import useSWR from "swr"
import { fetcher } from "./fetcher"

export function usePrograms() {
  const { data, isLoading, error, mutate } = useSWR("/api/admin/programs", fetcher)
  return { programs: data ?? [], isLoading, error, mutate }
}
