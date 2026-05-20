import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getAdminYearContext } from "@/lib/admin-year"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { AdminGradeTable } from "@/components/admin/admin-grade-table"
import { semesterLabel } from "@/types"
import type { GradeRow } from "@/components/admin/admin-grade-table"

export default async function GradesPage() {
  const { year, semester } = await getAdminYearContext()

  if (!year || !semester) {
    return (
      <div>
        <PageHeader title="Grade Management" description="View grades for the current semester" />
        <EmptyState
          title="No semester selected"
          description="Navigate to an academic year and select a semester to view grades."
        />
      </div>
    )
  }

  const supabase = await getSupabaseServerClient()

  // Get courses for this AY + semester term
  const { data: semCourses } = await supabase
    .from("courses")
    .select("id, course_code, name")
    .eq("academic_year_id", year.id)
    .eq("semester", semester.term)

  const courseMap = new Map(
    (semCourses ?? []).map((c) => [c.id, { code: c.course_code, name: c.name }])
  )
  const courseIds = [...courseMap.keys()]

  // Get enrollments with student info and grades
  const { data: enrollments } =
    courseIds.length > 0
      ? await supabase
          .from("enrollments")
          .select(
            "id, course_id, students!inner(student_id, section, users!inner(name)), grades(grade, remarks)"
          )
          .in("course_id", courseIds)
          .eq("status", "enrolled")
          .order("created_at")
      : { data: [] }

  const rows: GradeRow[] = (enrollments ?? []).map((e) => {
    const student = Array.isArray(e.students) ? e.students[0] : e.students
    const grade = Array.isArray(e.grades) ? e.grades[0] : e.grades
    const user = student
      ? Array.isArray(student.users) ? student.users[0] : student.users
      : null
    const course = courseMap.get(e.course_id)
    return {
      enrollmentId: e.id,
      studentId: student?.student_id ?? "—",
      studentName: user?.name ?? "—",
      section: student?.section ?? "—",
      courseCode: course?.code ?? "—",
      courseName: course?.name ?? "—",
      grade: grade?.grade ?? null,
      remarks: grade?.remarks ?? null,
    }
  })

  const semLabel = semesterLabel(semester.term)

  return (
    <div>
      <PageHeader
        title="Grade Management"
        description={`Read-only grade overview for ${year.label} — ${semLabel}`}
      />
      <AdminGradeTable rows={rows} semesterLabel={semLabel} />
    </div>
  )
}
