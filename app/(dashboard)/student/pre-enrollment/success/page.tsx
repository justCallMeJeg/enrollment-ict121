import { getSupabaseServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PreEnrollmentSuccessRedirect } from "@/components/student/pre-enrollment-success"
import { semesterLabel } from "@/types"
import type { SemesterTerm } from "@/types"

export default async function PreEnrollmentSuccessPage() {
  const headersList = await headers()
  const userId = headersList.get("x-user-id")!

  const supabase = await getSupabaseServerClient()

  const { data: preEnrollments } = await supabase
    .from("enrollments")
    .select(`
      id,
      classrooms!inner(
        section, year_level,
        programs!program_id(code),
        courses!course_id(course_code, name, units, semester),
        semesters!semester_id!inner(term, academic_years!inner(label))
      )
    `)
    .eq("student_id", userId)
    .eq("status", "pre_enrolled")
    .order("created_at")

  if (!preEnrollments || preEnrollments.length === 0) {
    redirect("/student")
  }

  type Row = {
    id: string
    course_code: string
    course_name: string
    semester: string
    units: number
    section: string
  }

  const rows: Row[] = preEnrollments.map((pe) => {
    const classroom = Array.isArray(pe.classrooms) ? pe.classrooms[0] : pe.classrooms
    const course = classroom?.courses
      ? Array.isArray(classroom.courses) ? classroom.courses[0] : classroom.courses
      : null
    const prog = classroom?.programs
      ? Array.isArray(classroom.programs) ? classroom.programs[0] : classroom.programs
      : null

    const programCode = (prog as { code: string } | null)?.code
    const section = programCode
      ? `${programCode}-${classroom?.year_level}${classroom?.section}`
      : classroom?.section ?? "—"

    return {
      id: pe.id,
      course_code: (course as { course_code: string } | null)?.course_code ?? "—",
      course_name: (course as { name: string } | null)?.name ?? "—",
      semester: (course as { semester: string } | null)?.semester ?? "—",
      units: (course as { units: number } | null)?.units ?? 0,
      section,
    }
  })

  const totalUnits = rows.reduce((sum, r) => sum + r.units, 0)

  // Extract semester + year label from the first entry for the page subtitle
  const firstClassroom = Array.isArray(preEnrollments[0].classrooms)
    ? preEnrollments[0].classrooms[0]
    : preEnrollments[0].classrooms
  const firstSem = firstClassroom?.semesters
    ? Array.isArray(firstClassroom.semesters) ? firstClassroom.semesters[0] : firstClassroom.semesters
    : null
  const firstYear = firstSem?.academic_years
    ? Array.isArray(firstSem.academic_years) ? firstSem.academic_years[0] : firstSem.academic_years
    : null
  const semTerm = (firstSem as { term: string } | null)?.term
  const yearLabel = (firstYear as { label: string } | null)?.label ?? ""
  const semLabel = semTerm ? semesterLabel(semTerm as SemesterTerm) : ""
  const periodLabel = [semLabel, yearLabel].filter(Boolean).join(" — ")

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8">
      {/* Success header */}
      <div className="flex flex-col items-center text-center gap-3">
        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
          <CheckCircle2 className="size-10 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Pre-Enrollment Confirmed</h1>
          {periodLabel && (
            <p className="text-sm text-muted-foreground mt-1">{periodLabel}</p>
          )}
        </div>
        <div className="flex gap-3 text-sm">
          <span className="font-semibold">{rows.length}</span>
          <span className="text-muted-foreground">course{rows.length !== 1 ? "s" : ""}</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-semibold">{totalUnits}</span>
          <span className="text-muted-foreground">total units</span>
        </div>
      </div>

      {/* Course table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Section</TableHead>
              <TableHead className="text-right">Units</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-sm font-semibold">{row.course_code}</TableCell>
                <TableCell>{row.course_name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{row.semester} Sem</Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{row.section}</TableCell>
                <TableCell className="text-right">{row.units}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Total row */}
      <div className="flex justify-end text-sm">
        <span className="text-muted-foreground mr-2">Total units:</span>
        <span className="font-semibold">{totalUnits}</span>
      </div>

      {/* Redirect countdown */}
      <div className="flex justify-center">
        <PreEnrollmentSuccessRedirect />
      </div>
    </div>
  )
}
