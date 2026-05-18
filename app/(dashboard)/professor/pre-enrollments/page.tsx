import { getSupabaseServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function ProfessorPreEnrollmentsPage() {
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
          title="Pre-Enrollments"
          description="Students who pre-enrolled in your courses for the upcoming year"
        />
        <EmptyState
          title="No upcoming academic year"
          description="Pre-enrollment data will appear here when an upcoming year is active."
        />
      </div>
    )
  }

  const { data: preEnrollments } = await supabase
    .from("pre_enrollments")
    .select(
      "id, status, created_at, courses(course_code, name), students(student_id, section, users(name))"
    )
    .eq("academic_year_id", upcomingYear.id)
    .eq("status", "pending")
    .eq("courses.professor_id", userId)
    .order("created_at")

  const filtered = (preEnrollments ?? []).filter(
    (pe) => pe.courses !== null
  )

  return (
    <div>
      <PageHeader
        title="Pre-Enrollments"
        description={`Students who pre-enrolled for ${upcomingYear.label}`}
      />
      {filtered.length === 0 ? (
        <EmptyState
          title="No pre-enrollments yet"
          description="Students who pre-enroll in your courses will appear here."
        />
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((pe) => {
                const course = Array.isArray(pe.courses) ? pe.courses[0] : pe.courses
                const student = Array.isArray(pe.students) ? pe.students[0] : pe.students
                const user = student?.users
                  ? Array.isArray(student.users)
                    ? student.users[0]
                    : student.users
                  : null
                return (
                  <TableRow key={pe.id}>
                    <TableCell className="font-mono text-sm">
                      {student?.student_id}
                    </TableCell>
                    <TableCell>{user?.name}</TableCell>
                    <TableCell>{student?.section}</TableCell>
                    <TableCell>
                      {course?.course_code} — {course?.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Pending</Badge>
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
