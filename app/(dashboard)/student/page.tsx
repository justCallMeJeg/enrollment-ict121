import { getSupabaseServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, BookMarked } from "lucide-react"

export default async function StudentDashboard() {
  const headersList = await headers()
  const userId = headersList.get("x-user-id")!

  const supabase = await getSupabaseServerClient()
  const [{ data: student }, { data: activeYear }, { data: preEnrollSemester }, { count: preEnrollCount }] = await Promise.all([
    supabase
      .from("students")
      .select("*, users(name, email, contact_number), programs(name, code)")
      .eq("user_id", userId)
      .single(),
    supabase
      .from("academic_years")
      .select("label, status")
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("semesters")
      .select("id, academic_years!inner(id, label)")
      .eq("status", "pre_enrollment")
      .maybeSingle(),
    supabase
      .from("pre_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("student_id", userId)
      .eq("status", "pending"),
  ])

  const user = student?.users
    ? Array.isArray(student.users)
      ? student.users[0]
      : student.users
    : null
  const program = student?.programs
    ? Array.isArray(student.programs)
      ? student.programs[0]
      : student.programs
    : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Dashboard"
        description="Your enrollment information and profile"
      />

      {preEnrollSemester && (() => {
        const yearLabel = (() => {
          const ay = preEnrollSemester.academic_years
          return ay
            ? (Array.isArray(ay) ? ay[0] : ay).label
            : ""
        })()
        const hasEnrolled = (preEnrollCount ?? 0) > 0

        return (
          <div className={`rounded-lg border p-4 flex items-center gap-4 ${hasEnrolled ? "border-green-500/30 bg-green-500/5" : "border-primary/30 bg-primary/5"}`}>
            <div className="shrink-0">
              {hasEnrolled
                ? <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                : <BookMarked className="size-5 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">
                {hasEnrolled
                  ? `${preEnrollCount} course${preEnrollCount !== 1 ? "s" : ""} pre-enrolled${yearLabel ? ` for ${yearLabel}` : ""}`
                  : `Pre-enrollment is open${yearLabel ? ` for ${yearLabel}` : ""}`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasEnrolled
                  ? "You can still edit your course selection before enrollment closes."
                  : "Select the courses you plan to take next semester."}
              </p>
            </div>
            <Button asChild size="sm" variant={hasEnrolled ? "outline" : "default"}>
              <Link href="/student/pre-enrollment">
                {hasEnrolled ? "Edit Selection" : "Start Pre-Enrollment"}
              </Link>
            </Button>
          </div>
        )
      })()}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Academic Year</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-sm">{activeYear?.label ?? "—"}</p>
            {activeYear && (
              <Badge className="mt-1" variant="default">Active</Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Year Level</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">Year {student?.year_level ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Program</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-sm">{program?.code ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{program?.name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Section</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{student?.section ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

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
              <p className="font-medium">{user?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Student ID</p>
              <p className="font-medium">{student?.student_id ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Email</p>
              <p className="font-medium">{user?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Contact Number</p>
              <p className="font-medium">{user?.contact_number ?? "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
