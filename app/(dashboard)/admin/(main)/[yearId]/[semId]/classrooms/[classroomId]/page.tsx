import { getSupabaseServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { semesterLabel } from "@/types"
import type { SemesterTerm } from "@/types"

export default async function ClassroomDetailPage({
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
          courses!course_id(course_code, name, units, semester),
          professors!professor_id(faculty_id, users!user_id(name)),
          programs!program_id(code, name)
        `)
        .eq("id", classroomId)
        .single(),
      supabase
        .from("enrollments")
        .select(`
          id,
          students!inner(student_id, users!inner(name)),
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
  const professor = classroom.professors
  const professorUser = professor
    ? Array.isArray(professor.users) ? professor.users[0] : professor.users
    : null
  const professorName = (professorUser as { name?: string } | null)?.name
    ?? (professor as { faculty_id?: string } | null)?.faculty_id
    ?? null

  const section = prog
    ? `${(prog as { code: string }).code}-${classroom.year_level}${classroom.section}`
    : classroom.section

  const semLabel = semester?.term ? semesterLabel(semester.term as SemesterTerm) : ""
  const yearLabel = year?.label ?? ""

  type StudentRow = {
    id: string
    studentId: string
    name: string
    grade: number | null
    remarks: string | null
  }

  const students: StudentRow[] = (enrollments ?? []).map((e) => {
    const student = Array.isArray(e.students) ? e.students[0] : e.students
    const user = student
      ? Array.isArray(student.users) ? student.users[0] : student.users
      : null
    const gradeData = Array.isArray(e.grades) ? e.grades[0] : e.grades
    return {
      id: e.id,
      studentId: (student as { student_id?: string } | null)?.student_id ?? "—",
      name: (user as { name?: string } | null)?.name ?? "—",
      grade: (gradeData as { grade?: number | null } | null)?.grade ?? null,
      remarks: (gradeData as { remarks?: string | null } | null)?.remarks ?? null,
    }
  })

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href={`/admin/${yearId}/${semId}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-3" />
          {yearLabel}{semLabel ? ` — ${semLabel}` : ""}
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold font-mono">{(course as { course_code?: string } | null)?.course_code ?? "—"}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{(course as { name?: string } | null)?.name ?? "—"}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Section</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="font-mono text-sm">{section}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Professor</CardTitle>
          </CardHeader>
          <CardContent>
            {professorName ? (
              <p className="font-semibold text-sm">{professorName}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Unassigned</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Students Enrolled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl leading-none">{students.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Units</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl leading-none">{(course as { units?: number } | null)?.units ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled students */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Enrolled Students</h2>
        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center border rounded-md">
            No students enrolled in this classroom yet.
          </p>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Grade</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-sm">{s.studentId}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell className={`text-right font-mono text-sm ${
                      s.grade !== null
                        ? s.grade <= 3.0
                          ? "text-green-600 dark:text-green-400"
                          : "text-destructive"
                        : "text-muted-foreground"
                    }`}>
                      {s.grade !== null ? s.grade.toFixed(2) : "—"}
                    </TableCell>
                    <TableCell>
                      {s.remarks ? (
                        <Badge
                          variant={
                            s.remarks === "Passed"
                              ? "default"
                              : s.remarks === "Failed" || s.remarks === "Dropped"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {s.remarks}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Pending</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
