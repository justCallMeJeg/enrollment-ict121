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
    .select("id, course_id, status, courses(course_code, name, semester, units)")
    .eq("student_id", userId)
    .eq("academic_year_id", activeYear.id)
    .eq("status", "enrolled")

  return (
    <div>
      <PageHeader
        title="Drop Course"
        description={`Manage your enrollment for ${activeYear.label}`}
      />
      <DropCourseList enrollments={enrollments ?? []} />
    </div>
  )
}
