import { notFound } from "next/navigation"
import Link from "next/link"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { SetContextCookies } from "@/components/admin/set-context-cookies"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { semesterLabel } from "@/types"
import type { SemesterStatus, SemesterTerm } from "@/types"
import { BookOpen, ChevronLeft, ClipboardList, Star } from "lucide-react"

const STATUS_BADGE: Record<SemesterStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  pre_enrollment: "secondary",
  draft: "outline",
  ended: "outline",
}

const STATUS_LABEL: Record<SemesterStatus, string> = {
  draft: "Draft",
  pre_enrollment: "Open for Pre-Enrollment",
  active: "Active",
  ended: "Ended",
}

export default async function SemesterDetailPage({
  params,
}: {
  params: Promise<{ yearId: string; semId: string }>
}) {
  const { yearId, semId } = await params
  const supabase = await getSupabaseServerClient()

  const [{ data: academicYear }, { data: semester }] = await Promise.all([
    supabase
      .from("academic_years")
      .select("id, label")
      .eq("id", yearId)
      .single(),
    supabase
      .from("semesters")
      .select("id, academic_year_id, term, status, created_at")
      .eq("id", semId)
      .eq("academic_year_id", yearId)
      .single(),
  ])

  if (!academicYear || !semester) notFound()

  const term = semester.term as SemesterTerm
  const status = semester.status as SemesterStatus

  // Stats: courses in this semester
  const { data: semCourses, count: courseCount } = await supabase
    .from("courses")
    .select("id", { count: "exact" })
    .eq("academic_year_id", yearId)
    .eq("semester", term)

  // Stats: enrolled students in those courses
  const courseIds = semCourses?.map((c) => c.id) ?? []
  const { count: enrollmentCount } =
    courseIds.length > 0
      ? await supabase
          .from("enrollments")
          .select("*", { count: "exact", head: true })
          .in("course_id", courseIds)
          .eq("status", "enrolled")
      : { count: 0 }

  const stats = [
    { label: "Courses", value: courseCount ?? 0, icon: BookOpen },
    { label: "Enrolled Students", value: enrollmentCount ?? 0, icon: Star },
  ]

  const title = `${academicYear.label} — ${semesterLabel(term)}`

  return (
    <div>
      <SetContextCookies yearId={yearId} semesterId={semId} />

      <div className="mb-1">
        <Link
          href={`/admin/academic-years/${yearId}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-3" />
          {academicYear.label}
        </Link>
      </div>

      <div className="flex items-start gap-3 mb-6">
        <div className="flex-1">
          <PageHeader
            title={title}
            description={`${STATUS_LABEL[status]} · Semester overview and quick actions`}
          />
        </div>
        <Badge
          variant={STATUS_BADGE[status]}
          className="capitalize text-xs mt-1 shrink-0"
        >
          {STATUS_LABEL[status]}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin/courses">
              <BookOpen className="size-4 mr-2" />
              View Courses
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/classrooms">
              <ClipboardList className="size-4 mr-2" />
              View Classrooms
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/grades">
              <Star className="size-4 mr-2" />
              View Grades
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
