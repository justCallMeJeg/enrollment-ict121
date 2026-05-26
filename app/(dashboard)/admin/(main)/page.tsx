import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { AcademicYearManager } from "@/components/admin/academic-year-manager"

export default async function AdminHomePage() {
  const supabase = await getSupabaseServerClient()
  const [{ data: years }, { data: semesterRows }] = await Promise.all([
    supabase.from("academic_years").select("*").order("created_at", { ascending: false }),
    supabase.from("semesters").select("academic_year_id"),
  ])

  const semesterCounts: Record<string, number> = {}
  for (const s of semesterRows ?? []) {
    semesterCounts[s.academic_year_id] = (semesterCounts[s.academic_year_id] ?? 0) + 1
  }

  return (
    <div>
      <PageHeader title="Academic Years" description="Select an academic year to manage its semesters and courses" />
      <AcademicYearManager years={years ?? []} semesterCounts={semesterCounts} />
    </div>
  )
}
