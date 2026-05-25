import { getSupabaseServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { CoursesList } from "@/components/student/courses-list"
import type { CourseHistoryRow } from "@/components/student/courses-list"

export default async function CoursesPage() {
  const headersList = await headers()
  const userId = headersList.get("x-user-id")!

  const supabase = await getSupabaseServerClient()

  const [
    { data: enrollments },
    { data: preEnrollments },
    { data: activeSemester },
  ] = await Promise.all([
    supabase
      .from("enrollments")
      .select(`
        id, status, created_at,
        classrooms!inner(
          section, year_level,
          programs!program_id(code),
          courses!course_id(course_code, name, units, semester),
          semesters!semester_id!inner(id, academic_year_id, academic_years!inner(id, label))
        ),
        grades(grade, remarks)
      `)
      .eq("student_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("pre_enrollments")
      .select(`
        id, status, created_at,
        classrooms!inner(
          section, year_level,
          programs!program_id(code),
          courses!course_id(course_code, name, units, semester),
          semesters!semester_id!inner(id, academic_year_id, academic_years!inner(id, label))
        )
      `)
      .eq("student_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("semesters")
      .select("id, academic_year_id")
      .eq("status", "active")
      .maybeSingle(),
  ])

  function extractSection(cr: {
    section: string
    year_level: number
    programs: { code: string } | { code: string }[] | null
  }) {
    const prog = Array.isArray(cr.programs) ? cr.programs[0] : cr.programs
    const code = (prog as { code: string } | null)?.code
    return code ? `${code}-${cr.year_level}${cr.section}` : cr.section
  }

  const enrolledRows: CourseHistoryRow[] = (enrollments ?? []).map((e) => {
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
    const gradeData = Array.isArray(e.grades) ? e.grades[0] : e.grades

    return {
      id: e.id,
      type: "enrolled" as const,
      status: e.status,
      course_code: (course as { course_code: string } | null)?.course_code ?? "—",
      course_name: (course as { name: string } | null)?.name ?? "—",
      semester: (course as { semester: string } | null)?.semester ?? "—",
      units: (course as { units: number } | null)?.units ?? 0,
      section: classroom ? extractSection(classroom as Parameters<typeof extractSection>[0]) : "—",
      grade: gradeData?.grade ?? null,
      remarks: gradeData?.remarks ?? null,
      yearId: (yearData as { id: string } | null)?.id ?? sem?.academic_year_id ?? "unknown",
      yearLabel: (yearData as { label: string } | null)?.label ?? "Unknown Year",
      semesterId: sem?.id ?? "",
      canDrop: e.status === "enrolled" && !!activeSemester && sem?.id === activeSemester.id,
    }
  })

  const preEnrolledRows: CourseHistoryRow[] = (preEnrollments ?? []).map((pe) => {
    const classroom = Array.isArray(pe.classrooms) ? pe.classrooms[0] : pe.classrooms
    const course = classroom?.courses
      ? Array.isArray(classroom.courses) ? classroom.courses[0] : classroom.courses
      : null
    const sem = classroom?.semesters
      ? Array.isArray(classroom.semesters) ? classroom.semesters[0] : classroom.semesters
      : null
    const yearData = sem?.academic_years
      ? Array.isArray(sem.academic_years) ? sem.academic_years[0] : sem.academic_years
      : null

    return {
      id: pe.id,
      type: "pre_enrolled" as const,
      status: pe.status,
      course_code: (course as { course_code: string } | null)?.course_code ?? "—",
      course_name: (course as { name: string } | null)?.name ?? "—",
      semester: (course as { semester: string } | null)?.semester ?? "—",
      units: (course as { units: number } | null)?.units ?? 0,
      section: classroom ? extractSection(classroom as Parameters<typeof extractSection>[0]) : "—",
      grade: null,
      remarks: null,
      yearId: (yearData as { id: string } | null)?.id ?? sem?.academic_year_id ?? "unknown",
      yearLabel: (yearData as { label: string } | null)?.label ?? "Unknown Year",
      semesterId: sem?.id ?? "",
      canDrop: false,
    }
  })

  const allRows = [...enrolledRows, ...preEnrolledRows]

  const activeYearId = activeSemester?.academic_year_id ?? null

  if (allRows.length === 0) {
    return (
      <div>
        <PageHeader title="My Courses" description="Your enrollment history and pre-enrollments" />
        <EmptyState
          title="No courses yet"
          description="Your enrollment history and pre-enrollments will appear here."
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="My Courses" description="Your enrollment history and pre-enrollments" />
      <CoursesList
        rows={allRows}
        defaultYearId={activeYearId}
        activeSemesterId={activeSemester?.id ?? null}
      />
    </div>
  )
}
