import useSWR from "swr"
import { fetcher } from "./fetcher"

export function useUsers() {
  const { data, isLoading, error, mutate } = useSWR<{ users: unknown[]; programs: unknown[] }>(
    "/api/admin/users",
    fetcher
  )
  return {
    users: data?.users ?? [],
    programs: data?.programs ?? [],
    isLoading,
    error,
    mutate,
  }
}
