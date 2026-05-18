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

export default async function StudentGradesPage() {
  const headersList = await headers()
  const userId = headersList.get("x-user-id")!

  const supabase = await getSupabaseServerClient()

  const { data: activeYear } = await supabase
    .from("academic_years")
    .select("id, label")
    .eq("status", "active")
    .single()

  if (!activeYear) {
    return (
      <div>
        <PageHeader title="My Grades" />
        <EmptyState
          title="No active academic year"
          description="Grades are available during an active academic year."
        />
      </div>
    )
  }

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      "id, status, courses(course_code, name, units, semester), grades(grade, remarks)"
    )
    .eq("student_id", userId)
    .eq("academic_year_id", activeYear.id)
    .order("created_at")

  function gradeColor(grade: number | null) {
    if (grade === null) return "text-muted-foreground"
    if (grade <= 3.0) return "text-green-600 dark:text-green-400"
    return "text-destructive"
  }

  return (
    <div>
      <PageHeader title="My Grades" description={`Grades for ${activeYear.label}`} />
      {!enrollments || enrollments.length === 0 ? (
        <EmptyState title="No enrollments" description="You have no courses enrolled this semester." />
      ) : (
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
              {enrollments.map((e) => {
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
      )}
    </div>
  )
}
