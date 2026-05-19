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

  // Courses are now scoped to the upcoming academic year
  const { data: courses } = await supabase
    .from("courses")
    .select("*, professors(faculty_id, users(name)), prerequisite:prerequisite_course_id(id, course_code, name)")
    .eq("academic_year_id", upcomingYear.id)
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

  // Collect all prerequisite course codes needed — one query covers all of them
  const prereqCodes = (courses ?? [])
    .map((c) => (c as { prerequisite?: { course_code: string } | null }).prerequisite?.course_code)
    .filter(Boolean) as string[]

  // Single query instead of N: fetch all the student's enrollments and resolve in-memory.
  // Ordered newest-first so the first seen entry per course_code is the most recent attempt.
  const passedCodes = new Set<string>()
  if (prereqCodes.length > 0) {
    const { data: allEnrollments } = await supabase
      .from("enrollments")
      .select("grades(grade), courses!inner(course_code)")
      .eq("student_id", userId)
      .eq("status", "enrolled")
      .order("created_at", { ascending: false })

    const seen = new Set<string>()
    for (const e of allEnrollments ?? []) {
      const course = Array.isArray(e.courses) ? e.courses[0] : e.courses
      const code = course?.course_code
      if (!code || !prereqCodes.includes(code) || seen.has(code)) continue
      seen.add(code)
      const gradeData = Array.isArray(e.grades) ? e.grades[0] : e.grades
      const grade = (gradeData as { grade: number | null } | null)?.grade
      if (grade !== null && grade !== undefined && grade <= 3.0) passedCodes.add(code)
    }
  }

  const coursesWithEligibility: CourseWithEligibility[] = (courses ?? []).map((course) => {
    const prereq = (course as { prerequisite?: { course_code: string } | null }).prerequisite
    const eligible = !prereq?.course_code || passedCodes.has(prereq.course_code)
    return {
      ...course,
      semester: course.semester as "1st" | "2nd" | "summer",
      eligible,
      pre_enrolled: preEnrolledIds.has(course.id),
    }
  })

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
