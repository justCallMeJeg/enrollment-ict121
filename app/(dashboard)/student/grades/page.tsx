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

  // Fetch all enrollments across all years, grouped by academic year
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      "id, status, academic_year_id, academic_years(id, label), courses(course_code, name, units, semester), grades(grade, remarks)"
    )
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

  // Group by academic_year_id, preserving order (most recent first)
  const yearMap = new Map<string, { label: string; rows: typeof enrollments }>()
  for (const e of enrollments) {
    const yearData = Array.isArray(e.academic_years) ? e.academic_years[0] : e.academic_years
    const yearId = yearData?.id ?? e.academic_year_id
    const yearLabel = yearData?.label ?? "Unknown Year"
    if (!yearMap.has(yearId)) {
      yearMap.set(yearId, { label: yearLabel, rows: [] })
    }
    yearMap.get(yearId)!.rows.push(e)
  }

  return (
    <div>
      <PageHeader title="My Grades" description="Your academic history across all years" />
      <div className="space-y-8">
        {Array.from(yearMap.entries()).map(([yearId, { label, rows }]) => (
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
                  {rows.map((e) => {
                    const course = Array.isArray(e.courses) ? e.courses[0] : e.courses
                    const gradeData = Array.isArray(e.grades) ? e.grades[0] : e.grades
                    const grade = gradeData?.grade ?? null
                    const remarks = gradeData?.remarks ?? null
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-mono text-sm">
                          {course?.course_code}
                        </TableCell>
                        <TableCell>{course?.name}</TableCell>
                        <TableCell>{course?.semester}</TableCell>
                        <TableCell>{course?.units}</TableCell>
                        <TableCell className={gradeColor(grade)}>
                          {grade !== null ? grade.toFixed(2) : "—"}
                        </TableCell>
                        <TableCell>
                          {remarks ? (
                            <Badge
                              variant={
                                remarks === "Passed"
                                  ? "default"
                                  : remarks === "Failed" || remarks === "Dropped"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {remarks}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Pending</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
