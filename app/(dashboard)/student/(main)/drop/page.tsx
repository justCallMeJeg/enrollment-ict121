import { getSupabaseServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { PageHeader } from "@/components/shared/page-header"
import { DropCourseList } from "@/components/student/drop-course-list"
import { EmptyState } from "@/components/shared/empty-state"

export default async function DropCoursePage() {
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
        <PageHeader title="Drop Course" description="Remove a course from your current enrollment" />
        <EmptyState
          title="No active academic year"
          description="Course dropping is only available during an active academic year."
        />
      </div>
    )
  }

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id, status,
      classrooms!inner(
        courses(course_code, name, semester, units),
        semesters!inner(academic_year_id)
      )
    `)
    .eq("student_id", userId)
    .eq("status", "enrolled")
    .eq("classrooms.semesters.academic_year_id", activeYear.id)

  // Normalize: bring courses up to enrollment level for DropCourseList
  const normalized = (enrollments ?? []).map((e) => {
    const classroom = Array.isArray(e.classrooms) ? e.classrooms[0] : e.classrooms
    const course = classroom?.courses
      ? Array.isArray(classroom.courses) ? classroom.courses[0] : classroom.courses
      : null
    return { id: e.id, status: e.status, courses: course }
  })

  return (
    <div>
      <PageHeader
        title="Drop Course"
        description={`Manage your enrollment for ${activeYear.label}`}
      />
      <DropCourseList enrollments={normalized} />
    </div>
  )
}
