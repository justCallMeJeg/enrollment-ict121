import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export default async function AdminDashboard() {
  const supabase = await getSupabaseServerClient()

  const { data: years } = await supabase
    .from("academic_years")
    .select("id, status")
    .not("status", "eq", "ended")
    .order("created_at", { ascending: false })
    .limit(10)

  const year =
    years?.find((y) => y.status === "active") ??
    years?.find((y) => y.status === "upcoming") ??
    years?.[0]

  if (!year) redirect("/admin/academic-years")

  const { data: semesters } = await supabase
    .from("semesters")
    .select("id, status")
    .eq("academic_year_id", year.id)
    .not("status", "eq", "ended")
    .order("created_at", { ascending: true })

  const sem =
    semesters?.find((s) => s.status === "active") ??
    semesters?.find((s) => s.status === "pre_enrollment") ??
    semesters?.[0]

  if (sem) redirect(`/admin/${year.id}/${sem.id}`)
  redirect(`/admin/${year.id}`)
}
