import { getSupabaseServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { PageHeader } from "@/components/shared/page-header"
import { GradeTable } from "@/components/professor/grade-table"
import { EmptyState } from "@/components/shared/empty-state"

export default async function ProfessorGradesPage() {
  const headersList = await headers()
  const userId = headersList.get("x-user-id")!

  const supabase = await getSupabaseServerClient()

  const { data: activeYear } = await supabase
    .from("academic_years")
    .select("id, label")
    .eq("status", "active")
    .single()

  if (!activeYear) {
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
    .eq("academic_year_id", activeYear.id)
    .eq("status", "enrolled")
    .eq("courses.professor_id", userId)
    .order("created_at")

  const filtered = (enrollments ?? []).filter((e) => e.courses !== null)

  return (
    <div>
      <PageHeader
        title="Grade Management"
        description={`Grades for ${activeYear.label}`}
      />
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
