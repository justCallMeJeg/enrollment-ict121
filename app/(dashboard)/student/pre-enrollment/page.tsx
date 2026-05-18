import { getSupabaseServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { PageHeader } from "@/components/shared/page-header"
import { PreEnrollmentList } from "@/components/student/pre-enrollment-list"
import { EmptyState } from "@/components/shared/empty-state"
import type { CourseWithEligibility } from "@/types"

export default async function PreEnrollmentPage() {
  const headersList = await headers()
  const userId = headersList.get("x-user-id")!

  const supabase = await getSupabaseServerClient()

  const { data: upcomingYear } = await supabase
    .from("academic_years")
    .select("id, label")
    .eq("status", "upcoming")
    .single()

  if (!upcomingYear) {
    return (
      <div>
        <PageHeader
          title="Pre-Enrollment"
          description="Select courses for the upcoming academic year"
        />
        <EmptyState
          title="No upcoming academic year"
          description="Pre-enrollment is only available when an upcoming academic year has been set up by the admin."
        />
      </div>
    )
  }

  const { data: student } = await supabase
    .from("students")
    .select("year_level, program_id")
    .eq("user_id", userId)
    .single()

  if (!student) {
    return <EmptyState title="Student profile not found" />
  }

  const { data: courses } = await supabase
    .from("courses")
    .select("*, professors(faculty_id, users(name)), prerequisite:prerequisite_course_id(id, course_code, name)")
    .eq("program_id", student.program_id)
    .eq("year_level", student.year_level)
    .order("course_code")

  const { data: preEnrolled } = await supabase
    .from("pre_enrollments")
    .select("course_id")
    .eq("student_id", userId)
    .eq("academic_year_id", upcomingYear.id)
    .eq("status", "pending")

  const preEnrolledIds = new Set((preEnrolled ?? []).map((p) => p.course_id))

  // Check prerequisites for each course
  const coursesWithEligibility: CourseWithEligibility[] = await Promise.all(
    (courses ?? []).map(async (course) => {
      const prereqId = (course as { prerequisite?: { id: string } | null }).prerequisite?.id
      let eligible = true
      if (prereqId) {
        const { data: passingGrade } = await supabase
          .from("enrollments")
          .select("id, grades(grade)")
          .eq("student_id", userId)
          .eq("course_id", prereqId)
          .eq("status", "enrolled")
          .single()

        const grade = passingGrade?.grades
          ? Array.isArray(passingGrade.grades)
            ? passingGrade.grades[0]?.grade
            : (passingGrade.grades as { grade: number | null })?.grade
          : null

        eligible = grade !== null && grade !== undefined && grade <= 3.0
      }

      return {
        ...course,
        semester: course.semester as "1st" | "2nd" | "summer",
        eligible,
        pre_enrolled: preEnrolledIds.has(course.id),
      }
    })
  )

  return (
    <div>
      <PageHeader
        title="Pre-Enrollment"
        description={`Select courses for ${upcomingYear.label}`}
      />
      <PreEnrollmentList
        courses={coursesWithEligibility}
        academicYearId={upcomingYear.id}
      />
    </div>
  )
}
