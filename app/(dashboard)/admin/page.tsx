import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getAdminYearContext } from "@/lib/admin-year"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, GraduationCap, BookOpen, Calendar } from "lucide-react"
import type { AcademicYearStatus } from "@/types"

const STATUS_BADGE: Record<AcademicYearStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  upcoming: "secondary",
  draft: "outline",
  ended: "outline",
}

async function getStats(yearId: string) {
  const supabase = await getSupabaseServerClient()
  const [
    { count: students },
    { count: professors },
    { count: courses },
  ] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("professors").select("*", { count: "exact", head: true }),
    supabase
      .from("courses")
      .select("*", { count: "exact", head: true })
      .eq("academic_year_id", yearId),
  ])
  return { students, professors, courses }
}

export default async function AdminDashboard() {
  const { year } = await getAdminYearContext()

  if (!year) {
    return (
      <div>
        <PageHeader
          title="Admin Dashboard"
          description="Overview of the enrollment system"
        />
        <EmptyState
          title="No academic year selected"
          description="Create your first academic year to get started."
        />
      </div>
    )
  }

  const { students, professors, courses } = await getStats(year.id)

  const stats = [
    { label: "Total Students", value: students ?? 0, icon: Users },
    { label: "Total Professors", value: professors ?? 0, icon: GraduationCap },
    { label: "Courses This Year", value: courses ?? 0, icon: BookOpen },
  ]

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description="Overview of the enrollment system"
      />
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">{year.label}</span>
        <Badge variant={STATUS_BADGE[year.status]} className="capitalize text-xs">
          {year.status}
        </Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
