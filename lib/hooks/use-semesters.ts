import useSWR from "swr"
import { fetcher } from "./fetcher"
import type { AdminSemesterContext } from "@/types"

export function useSemesters(yearId: string | null | undefined) {
  const key = yearId ? `/api/admin/semesters?yearId=${yearId}` : null
  const { data, isLoading, error, mutate } = useSWR<AdminSemesterContext[]>(key, fetcher)
  return { semesters: data ?? [], isLoading, error, mutate }
}
