import { cookies } from "next/headers"
import { unstable_cache } from "next/cache"
import { createClient } from "@supabase/supabase-js"
import { cache } from "react"
import type { AdminYearContext, AdminSemesterContext } from "@/types"

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

// Cross-request cache for all semesters — revalidated by 'semesters' tag
const fetchAllSemesters = unstable_cache(
  async (): Promise<AdminSemesterContext[]> => {
    const supabase = makeClient()
    const { data } = await supabase
      .from("semesters")
      .select("id, academic_year_id, term, status")
      .order("created_at", { ascending: true })
    return (data ?? []) as AdminSemesterContext[]
  },
  ["semesters"],
  { tags: ["semesters"] }
)

// Within-request cache: deduplicates layout + page calls in the same render
export const getAdminYearContext = cache(async (): Promise<{
  year: AdminYearContext | null
  years: AdminYearContext[]
  semester: AdminSemesterContext | null
  semesters: AdminSemesterContext[]
}> => {
  const cookieStore = await cookies()
  const yearCookieId = cookieStore.get("admin-year-id")?.value
  const semCookieId = cookieStore.get("admin-semester-id")?.value

  const years = await fetchYears()

  if (years.length === 0) return { year: null, years: [], semester: null, semesters: [] }

  const found = yearCookieId ? years.find((y) => y.id === yearCookieId) : null
  const year =
    found ??
    years.find((y) => y.status === "draft") ??
    years.find((y) => y.status === "upcoming") ??
    years.find((y) => y.status === "active") ??
    years[0]

  if (!year) return { year: null, years, semester: null, semesters: [] }

  const allSemesters = await fetchAllSemesters()
  const semesters = allSemesters.filter((s) => s.academic_year_id === year.id)

  const foundSem = semCookieId ? semesters.find((s) => s.id === semCookieId) : null
  const semester =
    foundSem ??
    semesters.find((s) => s.status === "pre_enrollment") ??
    semesters.find((s) => s.status === "active") ??
    semesters.find((s) => s.status === "draft") ??
    semesters[0] ??
    null

  return { year: year ?? null, years, semester, semesters }
})
