import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { AcademicYearManager } from "@/components/admin/academic-year-manager"

export default async function AcademicYearsPage() {
  const supabase = await getSupabaseServerClient()
  const [{ data: years }, { data: semRows }] = await Promise.all([
    supabase
      .from("academic_years")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("semesters").select("academic_year_id"),
  ])

  // Build a count map: yearId → number of semesters
  const semesterCounts: Record<string, number> = {}
  for (const row of semRows ?? []) {
    semesterCounts[row.academic_year_id] =
      (semesterCounts[row.academic_year_id] ?? 0) + 1
  }

  return (
    <div>
      <PageHeader
        title="Academic Years"
        description="Select an academic year to manage its semesters and courses"
      />
      <AcademicYearManager years={years ?? []} semesterCounts={semesterCounts} />
    </div>
  )
}
