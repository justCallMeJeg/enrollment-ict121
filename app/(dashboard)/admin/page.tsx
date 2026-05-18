import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Users, GraduationCap, BookOpen, Calendar } from "lucide-react"

async function getStats() {
  const supabase = await getSupabaseServerClient()

  const [
    { count: students },
    { count: professors },
    { count: courses },
    { data: activeYear },
  ] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("professors").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase
      .from("academic_years")
      .select("label, status")
      .eq("status", "active")
      .single(),
  ])

  return { students, professors, courses, activeYear }
}

export default async function AdminDashboard() {
  const { students, professors, courses, activeYear } = await getStats()

  const stats = [
    {
      label: "Total Students",
      value: students ?? 0,
      icon: Users,
    },
    {
      label: "Total Professors",
      value: professors ?? 0,
      icon: GraduationCap,
    },
    {
      label: "Total Courses",
      value: courses ?? 0,
      icon: BookOpen,
    },
    {
      label: "Active Academic Year",
      value: activeYear?.label ?? "None",
      icon: Calendar,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description="Overview of the enrollment system"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
