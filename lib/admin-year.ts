import { cookies } from "next/headers"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { AdminYearContext } from "@/types"

export async function getAdminYearContext(): Promise<{
  year: AdminYearContext | null
  years: AdminYearContext[]
}> {
  const cookieStore = await cookies()
  const cookieId = cookieStore.get("admin-year-id")?.value

  const supabase = await getSupabaseServerClient()
  const { data } = await supabase
    .from("academic_years")
    .select("id, label, status")
    .order("created_at", { ascending: false })

  const years = (data ?? []) as AdminYearContext[]

  if (years.length === 0) return { year: null, years: [] }

  const found = cookieId ? years.find((y) => y.id === cookieId) : null
  if (found) return { year: found, years }

  // Fallback priority: draft → upcoming → active → most recent ended
  const year =
    years.find((y) => y.status === "draft") ??
    years.find((y) => y.status === "upcoming") ??
    years.find((y) => y.status === "active") ??
    years[0]

  return { year: year ?? null, years }
}
