import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { CourseManager } from "@/components/admin/course-manager"

export default async function CoursesPage() {
  const supabase = await getSupabaseServerClient()
  const [{ data: courses }, { data: programs }, { data: professors }] =
    await Promise.all([
      supabase
        .from("courses")
        .select(
          "*, programs(name, code), professors(faculty_id, users(name)), prerequisite:prerequisite_course_id(course_code, name)"
        )
        .order("course_code"),
      supabase.from("programs").select("id, name, code").order("name"),
      supabase
        .from("professors")
        .select("user_id, faculty_id, users(name)")
        .order("faculty_id"),
    ])

  return (
    <div>
      <PageHeader
        title="Courses"
        description="Create and manage course offerings"
      />
      <CourseManager
        courses={courses ?? []}
        programs={programs ?? []}
        professors={professors ?? []}
      />
    </div>
  )
}
