import { cookies } from "next/headers"
import { unstable_cache } from "next/cache"
import { createClient } from "@supabase/supabase-js"
import { cache } from "react"
import type { AdminYearContext } from "@/types"

// Cookie-free Supabase client safe for use inside unstable_cache
function makeClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_SECRET_SUPABASE_ANON_KEY!
  )
}

// Cross-request cache: persists until revalidateTag('academic-years') is called
const fetchYears = unstable_cache(
  async (): Promise<AdminYearContext[]> => {
    const supabase = makeClient()
    const { data } = await supabase
      .from("academic_years")
      .select("id, label, status")
      .order("created_at", { ascending: false })
    return (data ?? []) as AdminYearContext[]
  },
  ["academic-years"],
  { tags: ["academic-years"] }
)

// Within-request cache: deduplicates layout + page calls in the same render
export const getAdminYearContext = cache(async (): Promise<{
  year: AdminYearContext | null
  years: AdminYearContext[]
}> => {
  const cookieStore = await cookies()
  const cookieId = cookieStore.get("admin-year-id")?.value

  const years = await fetchYears()

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
})
