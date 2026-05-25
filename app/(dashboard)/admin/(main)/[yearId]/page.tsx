"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { useAcademicYears } from "@/lib/hooks/use-academic-years"
import { useSemesters } from "@/lib/hooks/use-semesters"
import { useStats } from "@/lib/hooks/use-stats"
import { useOfferedCourses } from "@/lib/hooks/use-offered-courses"
import { PageHeader } from "@/components/shared/page-header"
import { DashboardSkeleton } from "@/components/shared/skeletons"
import { SemesterListView } from "@/components/admin/semester-list-view"
import { StudentDistributionCharts } from "@/components/admin/student-distribution-charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, GraduationCap, BookOpen, Library } from "lucide-react"
import type { AcademicYearStatus, Semester } from "@/types"

const STATUS_BADGE: Record<AcademicYearStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  upcoming: "secondary",
  draft: "outline",
  ended: "outline",
}

export default function YearDashboardPage() {
  const { yearId } = useParams<{ yearId: string }>()
  const { years, isLoading: yearsLoading } = useAcademicYears()
  const { semesters, isLoading: semsLoading } = useSemesters(yearId)
  const { stats, isLoading: statsLoading } = useStats(yearId)
  const { courses: offeredCourses, isLoading: offeredLoading } = useOfferedCourses(yearId)

  if (yearsLoading || semsLoading || statsLoading || offeredLoading) return <DashboardSkeleton />

  const year = years.find((y) => y.id === yearId)
  if (!year) return null

  type OfferedCourse = { units?: number }
  const totalUnits = (offeredCourses as unknown as OfferedCourse[]).reduce(
    (sum, c) => sum + (c.units ?? 0),
    0
  )

  const statCards = [
    { label: "Total Students", value: stats.students, icon: Users },
    { label: "Total Professors", value: stats.professors, icon: GraduationCap },
    { label: "Courses Offered", value: offeredCourses.length, icon: BookOpen },
    { label: "Total Units", value: totalUnits, icon: Library },
  ]

  return (
    <div>
      <div className="mb-1">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-3" />
          Home
        </Link>
      </div>

      <div className="flex items-start gap-3 mb-6">
        <div className="flex-1">
          <PageHeader
            title={year.label}
            description="Overview and semester management for this academic year"
          />
        </div>
        <Badge variant={STATUS_BADGE[year.status]} className="capitalize text-xs mt-1 shrink-0">
          {year.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-4">Student Population</h2>
        <StudentDistributionCharts yearId={yearId} />
      </div>

      <SemesterListView
        academicYear={{ id: year.id, label: year.label }}
        semesters={semesters as Semester[]}
      />
    </div>
  )
}
