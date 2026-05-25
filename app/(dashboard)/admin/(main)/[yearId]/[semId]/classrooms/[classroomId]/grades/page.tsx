import { getSupabaseServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { AdminGradeTable } from "@/components/admin/admin-grade-table"
import type { GradeRow } from "@/components/admin/admin-grade-table"
import { semesterLabel } from "@/types"
import type { SemesterTerm } from "@/types"

export default async function ClassroomGradesPage({
  params,
}: {
  params: Promise<{ yearId: string; semId: string; classroomId: string }>
}) {
  const { yearId, semId, classroomId } = await params
  await headers()

  const supabase = await getSupabaseServerClient()

  const [{ data: classroom }, { data: enrollments }, { data: year }, { data: semester }] =
    await Promise.all([
      supabase
        .from("classrooms")
        .select(`
          id, section, year_level,
          courses!course_id(course_code, name),
          programs!program_id(code)
        `)
        .eq("id", classroomId)
        .single(),
      supabase
        .from("enrollments")
        .select(`
          id,
          students!inner(student_id, section, users!inner(name)),
          grades(grade, remarks)
        `)
        .eq("classroom_id", classroomId)
        .eq("status", "enrolled")
        .order("created_at"),
      supabase.from("academic_years").select("id, label").eq("id", yearId).single(),
      supabase.from("semesters").select("id, term").eq("id", semId).single(),
    ])

  if (!classroom) notFound()

  const course = Array.isArray(classroom.courses) ? classroom.courses[0] : classroom.courses
  const prog = Array.isArray(classroom.programs) ? classroom.programs[0] : classroom.programs
  const section = prog
    ? `${(prog as { code: string }).code}-${classroom.year_level}${classroom.section}`
    : classroom.section

  const courseCode = (course as { course_code?: string } | null)?.course_code ?? "—"
  const courseName = (course as { name?: string } | null)?.name ?? "—"

  const semLabel = semester?.term ? semesterLabel(semester.term as SemesterTerm) : ""
  const yearLabel = year?.label ?? ""

  const rows: GradeRow[] = (enrollments ?? []).map((e) => {
    const student = Array.isArray(e.students) ? e.students[0] : e.students
    const user = student
      ? Array.isArray(student.users) ? student.users[0] : student.users
      : null
    const grade = Array.isArray(e.grades) ? e.grades[0] : e.grades
    return {
      enrollmentId: e.id,
      studentId: (student as { student_id?: string } | null)?.student_id ?? "—",
      studentName: (user as { name?: string } | null)?.name ?? "—",
      section,
      courseCode,
      courseName,
      grade: (grade as { grade?: number | null } | null)?.grade ?? null,
      remarks: (grade as { remarks?: string | null } | null)?.remarks ?? null,
    }
  })

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="space-y-1">
        <Link
          href={`/admin/${yearId}/${semId}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-3" />
          {yearLabel}{semLabel ? ` — ${semLabel}` : ""}
        </Link>
        <div>
          <Link
            href={`/admin/${yearId}/${semId}/classrooms/${classroomId}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-3" />
            {courseCode} — {section}
          </Link>
        </div>
      </div>

      <PageHeader
        title="Grades"
        description={`${courseCode} · ${courseName} · ${section}`}
      />

      <AdminGradeTable rows={rows} semesterLabel={semLabel} />
    </div>
  )
}
