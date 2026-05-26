import { getSupabaseServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { GradesList } from "@/components/student/grades-list"
import type { GradeRow } from "@/components/student/grades-list"

export default async function StudentGradesPage() {
  const headersList = await headers()
  const userId = headersList.get("x-user-id")!

  const supabase = await getSupabaseServerClient()

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id, status, created_at,
      classrooms!inner(
        section, year_level,
        programs!program_id(code),
        courses!course_id(course_code, name, units),
        semesters!semester_id!inner(id, term, academic_year_id, academic_years!inner(id, label))
      ),
      grades(grade, remarks)
    `)
    .eq("student_id", userId)
    .in("status", ["enrolled", "dropped"])
    .order("created_at", { ascending: false })

  if (!enrollments || enrollments.length === 0) {
    return (
      <div>
        <PageHeader title="My Grades" description="Your academic record" />
        <EmptyState
          title="No enrollment history"
          description="Your grades will appear here once you are enrolled in courses."
        />
      </div>
    )
  }

  const rows: GradeRow[] = enrollments.map((e) => {
    const classroom = Array.isArray(e.classrooms) ? e.classrooms[0] : e.classrooms
    const course = classroom?.courses
      ? Array.isArray(classroom.courses) ? classroom.courses[0] : classroom.courses
      : null
    const sem = classroom?.semesters
      ? Array.isArray(classroom.semesters) ? classroom.semesters[0] : classroom.semesters
      : null
    const yearData = sem?.academic_years
      ? Array.isArray(sem.academic_years) ? sem.academic_years[0] : sem.academic_years
      : null
    const prog = classroom?.programs
      ? Array.isArray(classroom.programs) ? classroom.programs[0] : classroom.programs
      : null
    const gradeData = Array.isArray(e.grades) ? e.grades[0] : e.grades

    const programCode = (prog as { code: string } | null)?.code
    const section = programCode
      ? `${programCode}-${classroom?.year_level}${classroom?.section}`
      : classroom?.section ?? "—"

    return {
      id: e.id,
      course_code: (course as { course_code: string } | null)?.course_code ?? "—",
      course_name: (course as { name: string } | null)?.name ?? "—",
      units: (course as { units: number } | null)?.units ?? 0,
      section,
      grade: gradeData?.grade ?? null,
      remarks: gradeData?.remarks ?? null,
      status: e.status,
      yearId: (yearData as { id: string } | null)?.id ?? sem?.academic_year_id ?? "unknown",
      yearLabel: (yearData as { label: string } | null)?.label ?? "Unknown Year",
      semId: sem?.id ?? "unknown",
      semTerm: (sem as { term: string } | null)?.term ?? "1st",
    }
  })

  return (
    <div>
      <PageHeader
        title="My Grades"
        description="Your academic record by year and semester"
      />
      <GradesList rows={rows} />
    </div>
  )
}
