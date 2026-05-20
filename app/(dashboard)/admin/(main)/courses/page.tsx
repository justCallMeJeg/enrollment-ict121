import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getAdminYearContext } from "@/lib/admin-year"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { CourseManager } from "@/components/admin/course-manager"

export default async function CoursesPage() {
  const { year, semester } = await getAdminYearContext()

  if (!year) {
    return (
      <div>
        <PageHeader title="Courses" description="Create and manage course offerings" />
        <EmptyState
          title="No academic year selected"
          description="Create an academic year first to manage courses."
        />
      </div>
    )
  }

  const supabase = await getSupabaseServerClient()
  const [{ data: courses }, { data: programs }, { data: professors }] =
    await Promise.all([
      supabase
        .from("courses")
        .select(
          "*, programs(name, code), professors(faculty_id, users(name)), prerequisite:prerequisite_course_id(course_code, name)"
        )
        .eq("academic_year_id", year.id)
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
        description={`Course offerings for ${year.label}`}
      />
      <CourseManager
        courses={courses ?? []}
        programs={programs ?? []}
        professors={professors ?? []}
        academicYearId={year.id}
        defaultTermFilter={semester?.term}
      />
    </div>
  )
}
