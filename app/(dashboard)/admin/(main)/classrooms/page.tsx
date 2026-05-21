import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export default async function ClassroomsRedirectPage() {
  const supabase = await getSupabaseServerClient()
  const { data: year } = await supabase
    .from("academic_years")
    .select("id")
    .in("status", ["active", "upcoming", "draft"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (!year) redirect("/admin/academic-years")

  const { data: semester } = await supabase
    .from("semesters")
    .select("id")
    .eq("academic_year_id", year.id)
    .in("status", ["active", "pre_enrollment", "draft"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (semester) redirect(`/admin/${year.id}/${semester.id}/classrooms`)
  redirect(`/admin/${year.id}`)
}
