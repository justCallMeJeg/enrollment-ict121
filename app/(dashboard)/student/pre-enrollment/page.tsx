import { getSupabaseServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { PageHeader } from "@/components/shared/page-header"
import { PreEnrollmentList } from "@/components/student/pre-enrollment-list"
import { EmptyState } from "@/components/shared/empty-state"
import type { ClassroomWithEligibility } from "@/types"

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

  // Fetch all classrooms for the upcoming year with junction table data
  const { data: classrooms } = await supabase
    .from("classrooms")
    .select(`
      id, section,
      courses!course_id!inner(
        id, course_code, name, semester, units, year_level,
        course_programs(program_id),
        course_prerequisites!course_prerequisites_course_id_fkey(
          prerequisite_course_id,
          prereq_course:courses!course_prerequisites_prerequisite_course_id_fkey(id, course_code)
        )
      ),
      professors!professor_id(faculty_id, users!user_id(name)),
      semesters!semester_id!inner(academic_year_id)
    `)
    .eq("semesters.academic_year_id", upcomingYear.id)
    .order("created_at")

  // Filter classrooms to those matching the student's program and year level
  const relevant = (classrooms ?? []).filter((cr) => {
    const course = Array.isArray(cr.courses) ? cr.courses[0] : cr.courses
    if (!course) return false
    const coursePrograms = (course.course_programs ?? []) as { program_id: string }[]
    return (
      course.year_level === student.year_level &&
      (coursePrograms.length === 0 || coursePrograms.some((cp) => cp.program_id === student.program_id))
    )
  })

  // Which classrooms is this student already pre-enrolled in?
  const { data: preEnrolled } = await supabase
    .from("pre_enrollments")
    .select("classroom_id")
    .eq("student_id", userId)
    .eq("status", "pending")

  const preEnrolledIds = new Set((preEnrolled ?? []).map((p) => p.classroom_id))

  // Collect all prerequisite course codes needed for eligibility checking
  const allPrereqCodes = new Set<string>()
  for (const cr of relevant) {
    const course = Array.isArray(cr.courses) ? cr.courses[0] : cr.courses
    const prereqs = (course?.course_prerequisites ?? []) as {
      prerequisite_course_id: string
      prereq_course: { id: string; course_code: string } | { id: string; course_code: string }[] | null
    }[]
    for (const p of prereqs) {
      const prereqCourse = Array.isArray(p.prereq_course) ? p.prereq_course[0] : p.prereq_course
      if (prereqCourse?.course_code) allPrereqCodes.add(prereqCourse.course_code)
    }
  }

  // Fetch passed courses for prerequisite eligibility checking
  const passedCodes = new Set<string>()
  if (allPrereqCodes.size > 0) {
    const { data: allEnrollments } = await supabase
      .from("enrollments")
      .select("grades(grade), classrooms!inner(courses!inner(course_code))")
      .eq("student_id", userId)
      .eq("status", "enrolled")
      .order("created_at", { ascending: false })

    const seen = new Set<string>()
    for (const e of allEnrollments ?? []) {
      const classroom = Array.isArray(e.classrooms) ? e.classrooms[0] : e.classrooms
      const course = classroom?.courses
        ? Array.isArray(classroom.courses) ? classroom.courses[0] : classroom.courses
        : null
      const code = (course as { course_code: string } | null)?.course_code
      if (!code || !allPrereqCodes.has(code) || seen.has(code)) continue
      seen.add(code)
      const gradeData = Array.isArray(e.grades) ? e.grades[0] : e.grades
      const grade = (gradeData as { grade: number | null } | null)?.grade
      if (grade !== null && grade !== undefined && grade <= 3.0) passedCodes.add(code)
    }
  }

  const classroomsWithEligibility: ClassroomWithEligibility[] = relevant.map((cr) => {
    const course = Array.isArray(cr.courses) ? cr.courses[0] : cr.courses
    const professor = Array.isArray(cr.professors) ? cr.professors[0] : cr.professors
    const professorUser = professor
      ? Array.isArray(professor.users) ? professor.users[0] : professor.users
      : null

    const prereqs = (course?.course_prerequisites ?? []) as {
      prerequisite_course_id: string
      prereq_course: { id: string; course_code: string } | { id: string; course_code: string }[] | null
    }[]

    const prerequisiteCodes = prereqs
      .map((p) => {
        const prereqCourse = Array.isArray(p.prereq_course) ? p.prereq_course[0] : p.prereq_course
        return prereqCourse?.course_code ?? null
      })
      .filter(Boolean) as string[]

    const eligible =
      prerequisiteCodes.length === 0 || prerequisiteCodes.every((code) => passedCodes.has(code))

    return {
      id: cr.id,
      section: cr.section,
      course_id: course?.id ?? "",
      course_code: course?.course_code ?? "",
      course_name: course?.name ?? "",
      semester: course?.semester ?? "",
      units: course?.units ?? 0,
      year_level: course?.year_level ?? 0,
      professor_name: (professorUser as { name: string } | null)?.name ?? null,
      prerequisite_codes: prerequisiteCodes,
      eligible,
      pre_enrolled: preEnrolledIds.has(cr.id),
    }
  })

  return (
    <div>
      <PageHeader
        title="Pre-Enrollment"
        description={`Select courses for ${upcomingYear.label}`}
      />
      <PreEnrollmentList classrooms={classroomsWithEligibility} />
    </div>
  )
}
