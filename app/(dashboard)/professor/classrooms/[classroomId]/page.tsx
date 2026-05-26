import { getSupabaseServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Users, BookOpen, CalendarDays, GraduationCap } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClassroomStudentTable } from "@/components/professor/classroom-student-table"
import type { StudentEnrollment } from "@/components/professor/classroom-student-table"
import { semesterLabel } from "@/types"
import type { SemesterStatus, SemesterTerm } from "@/types"

const STATUS_BADGE: Record<SemesterStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  pre_enrollment: "secondary",
  draft: "outline",
  ended: "outline",
}

const STATUS_LABEL: Record<SemesterStatus, string> = {
  active: "Active",
  pre_enrollment: "Pre-Enrollment",
  draft: "Draft",
  ended: "Ended",
}

export default async function ProfessorClassroomDetailPage({
  params,
}: {
  params: Promise<{ classroomId: string }>
}) {
  const { classroomId } = await params
  const headersList = await headers()
  const userId = headersList.get("x-user-id")!

  const supabase = await getSupabaseServerClient()

  const { data: classroom } = await supabase
    .from("classrooms")
    .select(`
      id, section, year_level,
      courses!course_id(course_code, name, units, semester),
      programs!program_id(id, name, code),
      semesters!semester_id(term, status, academic_years!inner(label))
    `)
    .eq("id", classroomId)
    .eq("professor_id", userId)
    .maybeSingle()

  if (!classroom) notFound()

  const { data: rawEnrollments } = await supabase
    .from("enrollments")
    .select(`
      id, status,
      students!inner(student_id, users!user_id(name)),
      grades(grade, remarks)
    `)
    .eq("classroom_id", classroomId)
    .order("created_at")

  // Normalize nested objects
  const course = Array.isArray(classroom.courses) ? classroom.courses[0] : classroom.courses
  const prog = Array.isArray(classroom.programs) ? classroom.programs[0] : classroom.programs
  const sem = Array.isArray(classroom.semesters) ? classroom.semesters[0] : classroom.semesters
  const yearData = sem?.academic_years
    ? Array.isArray(sem.academic_years) ? sem.academic_years[0] : sem.academic_years
    : null

  const sectionLabel = prog
    ? `${(prog as { code: string }).code}-${classroom.year_level}${classroom.section}`
    : classroom.section
  const semTerm = sem?.term ? semesterLabel(sem.term as SemesterTerm) : "—"
  const yearLabel = (yearData as { label: string } | null)?.label ?? "—"
  const status = (sem?.status ?? "draft") as SemesterStatus
  const isActive = status === "active"

  // Normalize enrollments into flat StudentEnrollment shape
  const enrollments: StudentEnrollment[] = (rawEnrollments ?? []).map((e) => {
    const student = Array.isArray(e.students) ? e.students[0] : e.students
    const user = student?.users
      ? Array.isArray(student.users) ? student.users[0] : student.users
      : null
    const grade = Array.isArray(e.grades) ? e.grades[0] : e.grades
    return {
      id: e.id,
      status: e.status as StudentEnrollment["status"],
      student_id: (student as { student_id: string } | null)?.student_id ?? "—",
      student_name: (user as { name: string } | null)?.name ?? "—",
      grade: grade?.grade ?? null,
      remarks: grade?.remarks ?? null,
    }
  })

  const activeCount = enrollments.filter((e) => e.status === "enrolled").length
  const preEnrolledCount = enrollments.filter((e) => e.status === "pre_enrolled").length
  const totalStudents = activeCount + preEnrolledCount

  const statCards = [
    {
      label: "Total Students",
      value: totalStudents,
      sub: activeCount > 0 ? `${activeCount} enrolled` : preEnrolledCount > 0 ? `${preEnrolledCount} pre-enrolled` : "None yet",
      icon: Users,
    },
    {
      label: "Section",
      value: sectionLabel,
      sub: `Year ${classroom.year_level}`,
      icon: GraduationCap,
    },
    {
      label: "Semester",
      value: semTerm,
      sub: yearLabel,
      icon: CalendarDays,
    },
    {
      label: "Course Units",
      value: (course as { units?: number } | null)?.units ?? "—",
      sub: (course as { semester?: string } | null)?.semester ? `${(course as { semester: string }).semester} Sem` : "",
      icon: BookOpen,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/professor/classrooms"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-3" />
          My Classrooms
        </Link>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex-1">
          <PageHeader
            title={`${(course as { course_code?: string } | null)?.course_code ?? ""} — ${(course as { name?: string } | null)?.name ?? "Unnamed Course"}`}
            description={`${sectionLabel} · ${semTerm} · ${yearLabel}`}
          />
        </div>
        <Badge variant={STATUS_BADGE[status]} className="capitalize text-xs mt-1 shrink-0">
          {STATUS_LABEL[status]}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold leading-none">{s.value}</p>
                {s.sub && <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Students</h2>
          {isActive && (
            <p className="text-xs text-muted-foreground">
              Enter grades between 1.00 and 5.00 and click Save.
            </p>
          )}
        </div>
        <ClassroomStudentTable enrollments={enrollments} isActive={isActive} />
      </div>
    </div>
  )
}
