"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { useAcademicYears } from "@/lib/hooks/use-academic-years"
import { useSemesters } from "@/lib/hooks/use-semesters"
import { useYearClassrooms } from "@/lib/hooks/use-year-classrooms"
import { PageHeader } from "@/components/shared/page-header"
import { DashboardSkeleton } from "@/components/shared/skeletons"
import { SemesterListView } from "@/components/admin/semester-list-view"
import type { Semester } from "@/types"
import type { SemesterStats } from "@/components/admin/semester-list-view"

export default function YearSemestersPage() {
  const { yearId } = useParams<{ yearId: string }>()
  const { years, isLoading: yearsLoading } = useAcademicYears()
  const { semesters, isLoading: semsLoading } = useSemesters(yearId)
  const { classrooms, isLoading: classroomsLoading } = useYearClassrooms(yearId)

  if (yearsLoading || semsLoading || classroomsLoading) return <DashboardSkeleton />

  const year = years.find((y) => y.id === yearId)
  if (!year) return null

  type ClassroomRow = {
    semester_id: string
    enrolled_count: number
    courses: { units: number } | { units: number }[] | null
  }

  const statsBySem: Record<string, SemesterStats> = {}
  for (const sem of semesters) {
    const semClassrooms = (classrooms as unknown as ClassroomRow[]).filter(
      (c) => c.semester_id === sem.id
    )
    const enrolledCount = semClassrooms.reduce((sum, c) => sum + (c.enrolled_count ?? 0), 0)
    const totalUnits = semClassrooms.reduce((sum, c) => {
      const course = Array.isArray(c.courses) ? c.courses[0] : c.courses
      return sum + ((course as { units: number } | null)?.units ?? 0)
    }, 0)
    statsBySem[sem.id] = {
      classroomCount: semClassrooms.length,
      enrolledCount,
      totalUnits,
    }
  }

  return (
    <div>
      <div className="mb-1">
        <Link
          href={`/admin/${yearId}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-3" />
          {year.label}
        </Link>
      </div>

      <PageHeader
        title="Semesters"
        description={`Manage semesters for ${year.label}`}
      />

      <SemesterListView
        academicYear={{ id: year.id, label: year.label }}
        semesters={semesters as Semester[]}
        statsBySem={statsBySem}
      />
    </div>
  )
}
