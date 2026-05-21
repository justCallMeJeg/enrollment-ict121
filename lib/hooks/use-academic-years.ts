import useSWR from "swr"
import { fetcher } from "./fetcher"
import type { AdminYearContext } from "@/types"

export function useAcademicYears() {
  const { data, isLoading, error, mutate } = useSWR<AdminYearContext[]>(
    "/api/admin/academic-years",
    fetcher
  )
  return { years: data ?? [], isLoading, error, mutate }
}
