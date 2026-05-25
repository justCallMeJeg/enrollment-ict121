import { getSupabaseServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckCircle2, BookMarked } from "lucide-react"
import { semesterLabel } from "@/types"
import type { SemesterTerm } from "@/types"

export default async function StudentDashboard() {
  const headersList = await headers()
  const userId = headersList.get("x-user-id")!

  const supabase = await getSupabaseServerClient()

  const [
    { data: student },
    { data: activeSemester },
    { data: preEnrollSemester },
    { count: preEnrollCount },
    { data: enrollments },
  ] = await Promise.all([
    supabase
      .from("students")
      .select("student_id, year_level, section, users(name, email, contact_number), programs(name, code)")
      .eq("user_id", userId)
      .single(),
    supabase
      .from("semesters")
      .select("id, term, academic_years!inner(id, label)")
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("semesters")
      .select("id, academic_years!inner(id, label)")
      .eq("status", "pre_enrollment")
      .maybeSingle(),
    supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("student_id", userId)
      .eq("status", "pre_enrolled"),
    supabase
      .from("enrollments")
      .select(`
        id, status,
        classrooms!inner(
          id, section, year_level, semester_id,
          programs!program_id(code),
          courses!course_id(course_code, name, units)
        ),
        grades(grade, remarks)
      `)
      .eq("student_id", userId),
  ])

  const user = student?.users
    ? Array.isArray(student.users) ? student.users[0] : student.users
    : null
  const program = student?.programs
    ? Array.isArray(student.programs) ? student.programs[0] : student.programs
    : null

  const formattedSection =
    program && student
      ? `${program.code}-${student.year_level}${student.section}`
      : student?.section ?? "—"

  const activeYearData = activeSemester?.academic_years
    ? Array.isArray(activeSemester.academic_years) ? activeSemester.academic_years[0] : activeSemester.academic_years
    : null
  const activeYearLabel = (activeYearData as { label: string } | null)?.label ?? "—"
  const activeSemLabel = activeSemester?.term
    ? semesterLabel(activeSemester.term as SemesterTerm)
    : null

  // Compute stats from all enrollments
  const allEnrollments = enrollments ?? []
  const totalEnrolled = allEnrollments.filter((e) => e.status === "enrolled").length

  const totalUnitsEarned = allEnrollments.reduce((sum, e) => {
    const gradeData = Array.isArray(e.grades) ? e.grades[0] : e.grades
    const grade = gradeData?.grade ?? null
    if (grade === null || grade > 3.0) return sum
    const classroom = Array.isArray(e.classrooms) ? e.classrooms[0] : e.classrooms
    const course = classroom?.courses
      ? Array.isArray(classroom.courses) ? classroom.courses[0] : classroom.courses
      : null
    return sum + ((course as { units: number } | null)?.units ?? 0)
  }, 0)

  // Courses in the current active semester
  type ActiveCourse = {
    id: string
    course_code: string
    course_name: string
    units: number
    grade: number | null
    remarks: string | null
  }

  const activeCourses: ActiveCourse[] = activeSemester
    ? allEnrollments
        .filter((e) => {
          if (e.status !== "enrolled") return false
          const classroom = Array.isArray(e.classrooms) ? e.classrooms[0] : e.classrooms
          return (classroom as { semester_id: string } | null)?.semester_id === activeSemester.id
        })
        .map((e) => {
          const classroom = Array.isArray(e.classrooms) ? e.classrooms[0] : e.classrooms
          const course = classroom?.courses
            ? Array.isArray(classroom.courses) ? classroom.courses[0] : classroom.courses
            : null
          const gradeData = Array.isArray(e.grades) ? e.grades[0] : e.grades
          return {
            id: e.id,
            course_code: (course as { course_code: string } | null)?.course_code ?? "—",
            course_name: (course as { name: string } | null)?.name ?? "—",
            units: (course as { units: number } | null)?.units ?? 0,
            grade: gradeData?.grade ?? null,
            remarks: gradeData?.remarks ?? null,
          }
        })
    : []

  // Pre-enrollment banner
  const hasPreEnrolled = (preEnrollCount ?? 0) > 0
  const preEnrollYearData = preEnrollSemester?.academic_years
    ? Array.isArray(preEnrollSemester.academic_years)
      ? preEnrollSemester.academic_years[0]
      : preEnrollSemester.academic_years
    : null
  const preEnrollYearLabel = (preEnrollYearData as { label: string } | null)?.label ?? ""

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Dashboard"
        description="Your enrollment information and academic overview"
      />

      {/* Pre-enrollment banner */}
      {preEnrollSemester && (
        <div
          className={`rounded-lg border p-4 flex items-center gap-4 ${
            hasPreEnrolled
              ? "border-green-500/30 bg-green-500/5"
              : "border-primary/30 bg-primary/5"
          }`}
        >
          <div className="shrink-0">
            {hasPreEnrolled ? (
              <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
            ) : (
              <BookMarked className="size-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              {hasPreEnrolled
                ? `${preEnrollCount} course${preEnrollCount !== 1 ? "s" : ""} pre-enrolled${preEnrollYearLabel ? ` for ${preEnrollYearLabel}` : ""}`
                : `Pre-enrollment is open${preEnrollYearLabel ? ` for ${preEnrollYearLabel}` : ""}`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasPreEnrolled
                ? "Your course selection has been submitted."
                : "Select the courses you plan to take next semester."}
            </p>
          </div>
          <Button asChild size="sm" variant={hasPreEnrolled ? "outline" : "default"}>
            <Link href="/student/pre-enrollment">
              {hasPreEnrolled ? "View Selection" : "Start Pre-Enrollment"}
            </Link>
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Academic Year</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-sm leading-snug">{activeYearLabel}</p>
            {activeSemester && (
              <p className="text-xs text-muted-foreground mt-0.5">{activeSemLabel}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Section</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold font-mono text-sm">{formattedSection}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Courses Enrolled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl leading-none">{totalEnrolled}</p>
            <p className="text-xs text-muted-foreground mt-1">courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Units Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl leading-none">{totalUnitsEarned}</p>
            <p className="text-xs text-muted-foreground mt-1">units</p>
          </CardContent>
        </Card>
      </div>

      {/* Current courses */}
      {activeCourses.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Current Courses</CardTitle>
              <span className="text-xs text-muted-foreground">
                {[activeSemLabel, activeYearLabel].filter(Boolean).join(" · ")}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Grade</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-mono text-sm">{course.course_code}</TableCell>
                    <TableCell>{course.course_name}</TableCell>
                    <TableCell className="text-right">{course.units}</TableCell>
                    <TableCell
                      className={`text-right font-mono text-sm ${
                        course.grade !== null
                          ? course.grade <= 3.0
                            ? "text-green-600 dark:text-green-400"
                            : "text-destructive"
                          : "text-muted-foreground"
                      }`}
                    >
                      {course.grade !== null ? course.grade.toFixed(2) : "—"}
                    </TableCell>
                    <TableCell>
                      {course.remarks ? (
                        <Badge
                          variant={
                            course.remarks === "Passed"
                              ? "default"
                              : course.remarks === "Failed" || course.remarks === "Dropped"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {course.remarks}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Pending</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Profile */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Profile</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/student/profile">Edit Profile</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Full Name</p>
              <p className="font-medium">{(user as { name?: string } | null)?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Student ID</p>
              <p className="font-medium">{student?.student_id ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Email</p>
              <p className="font-medium">{(user as { email?: string } | null)?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Contact Number</p>
              <p className="font-medium">{(user as { contact_number?: string } | null)?.contact_number ?? "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
