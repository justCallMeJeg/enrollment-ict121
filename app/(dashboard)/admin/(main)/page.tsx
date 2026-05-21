import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export default async function AdminDashboard() {
  const supabase = await getSupabaseServerClient()
  const { data: year } = await supabase
    .from("academic_years")
    .select("id")
    .in("status", ["active", "upcoming", "draft"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (year) redirect(`/admin/${year.id}`)
  redirect("/admin/academic-years")
}
