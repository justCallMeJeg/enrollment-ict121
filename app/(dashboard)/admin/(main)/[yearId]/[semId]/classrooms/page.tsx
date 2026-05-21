"use client"

import { useParams } from "next/navigation"
import { useAcademicYears } from "@/lib/hooks/use-academic-years"
import { useSemesters } from "@/lib/hooks/use-semesters"
import { PageHeader } from "@/components/shared/page-header"
import { DashboardSkeleton } from "@/components/shared/skeletons"
import { EmptyState } from "@/components/shared/empty-state"
import { semesterLabel } from "@/types"
import type { SemesterTerm } from "@/types"

export default function ClassroomsPage() {
  const { yearId, semId } = useParams<{ yearId: string; semId: string }>()
  const { years, isLoading: yearsLoading } = useAcademicYears()
  const { semesters, isLoading: semsLoading } = useSemesters(yearId)

  if (yearsLoading || semsLoading) return <DashboardSkeleton />

  const year = years.find((y) => y.id === yearId)
  const semester = semesters.find((s) => s.id === semId)
  const semLabel = semester ? semesterLabel(semester.term as SemesterTerm) : ""

  return (
    <div>
      <PageHeader
        title="Classrooms"
        description={
          year && semester
            ? `Course assignments for ${year.label} — ${semLabel}`
            : "Course section and professor assignments"
        }
      />
      <EmptyState
        title="Coming soon"
        description="The classroom assignment feature is currently being designed. It will allow you to assign professors to student sections for each course."
      />
    </div>
  )
}
