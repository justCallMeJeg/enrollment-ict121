import { getSupabaseServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function gradeColor(grade: number | null) {
  if (grade === null) return "text-muted-foreground"
  if (grade <= 3.0) return "text-green-600 dark:text-green-400"
  return "text-destructive"
}

export default async function StudentGradesPage() {
  const headersList = await headers()
  const userId = headersList.get("x-user-id")!

  const supabase = await getSupabaseServerClient()

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id, status,
      classrooms!inner(
        courses(course_code, name, units, semester),
        semesters!inner(academic_year_id, academic_years(id, label))
      ),
      grades(grade, remarks)
    `)
    .eq("student_id", userId)
    .order("created_at", { ascending: false })

  if (!enrollments || enrollments.length === 0) {
    return (
      <div>
        <PageHeader title="My Grades" description="Your academic history" />
        <EmptyState
          title="No enrollment history"
          description="Your grades will appear here once you are enrolled in courses."
        />
      </div>
    )
  }

  // Normalize and group by academic year
  type NormalizedRow = {
    id: string
    course_code: string
    course_name: string
    semester: string
    units: number
    grade: number | null
    remarks: string | null
    yearId: string
    yearLabel: string
  }

  const rows: NormalizedRow[] = enrollments.map((e) => {
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
      course_code: (course as { course_code: string } | null)?.course_code ?? "—",
      course_name: (course as { name: string } | null)?.name ?? "—",
      semester: (course as { semester: string } | null)?.semester ?? "—",
      units: (course as { units: number } | null)?.units ?? 0,
      grade: gradeData?.grade ?? null,
      remarks: gradeData?.remarks ?? null,
      yearId: (yearData as { id: string } | null)?.id ?? sem?.academic_year_id ?? "unknown",
      yearLabel: (yearData as { label: string } | null)?.label ?? "Unknown Year",
    }
  })

  // Group by year, preserving order
  const yearMap = new Map<string, { label: string; rows: NormalizedRow[] }>()
  for (const row of rows) {
    if (!yearMap.has(row.yearId)) {
      yearMap.set(row.yearId, { label: row.yearLabel, rows: [] })
    }
    yearMap.get(row.yearId)!.rows.push(row)
  }

  return (
    <div>
      <PageHeader title="My Grades" description="Your academic history across all years" />
      <div className="space-y-8">
        {Array.from(yearMap.entries()).map(([yearId, { label, rows: yearRows }]) => (
          <section key={yearId}>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {label}
            </h2>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yearRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-sm">{row.course_code}</TableCell>
                      <TableCell>{row.course_name}</TableCell>
                      <TableCell>{row.semester}</TableCell>
                      <TableCell>{row.units}</TableCell>
                      <TableCell className={gradeColor(row.grade)}>
                        {row.grade !== null ? row.grade.toFixed(2) : "—"}
                      </TableCell>
                      <TableCell>
                        {row.remarks ? (
                          <Badge
                            variant={
                              row.remarks === "Passed"
                                ? "default"
                                : row.remarks === "Failed" || row.remarks === "Dropped"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {row.remarks}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Pending</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
