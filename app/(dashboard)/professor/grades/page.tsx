import { getSupabaseServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { PageHeader } from "@/components/shared/page-header"
import { GradeTable } from "@/components/professor/grade-table"
import { YearFilter } from "@/components/professor/year-filter"
import { EmptyState } from "@/components/shared/empty-state"

export default async function ProfessorGradesPage({
  searchParams,
}: {
  searchParams: Promise<{ year_id?: string }>
}) {
  const { year_id } = await searchParams
  const headersList = await headers()
  const userId = headersList.get("x-user-id")!

  const supabase = await getSupabaseServerClient()

  // Fetch years that have grade data (active + ended) for the filter
  const { data: availableYears } = await supabase
    .from("academic_years")
    .select("id, label, status")
    .in("status", ["active", "ended"])
    .order("created_at", { ascending: false })

  const years = availableYears ?? []

  // Resolve selected year: use param → active year → most recent ended
  const selectedYear =
    (year_id ? years.find((y) => y.id === year_id) : null) ??
    years.find((y) => y.status === "active") ??
    years[0] ??
    null

  if (!selectedYear) {
    return (
      <div>
        <PageHeader
          title="Grade Management"
          description="Set grades for your enrolled students"
        />
        <EmptyState
          title="No active academic year"
          description="Grade management is available during an active academic year."
        />
      </div>
    )
  }

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      "id, status, courses(id, course_code, name, professor_id), students(student_id, section, users(name)), grades(id, grade, remarks)"
    )
    .eq("academic_year_id", selectedYear.id)
    .eq("status", "enrolled")
    .eq("courses.professor_id", userId)
    .order("created_at")

  const filtered = (enrollments ?? []).filter((e) => e.courses !== null)

  return (
    <div>
      <PageHeader
        title="Grade Management"
        description={`Grades for ${selectedYear.label}`}
      />
      {years.length > 1 && (
        <div className="mb-4">
          <YearFilter years={years} selectedId={selectedYear.id} />
        </div>
      )}
      {filtered.length === 0 ? (
        <EmptyState
          title="No enrolled students"
          description="Students enrolled in your courses will appear here."
        />
      ) : (
        <GradeTable enrollments={filtered} />
      )}
    </div>
  )
}
