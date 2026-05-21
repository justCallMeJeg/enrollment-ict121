"use client"

import { useParams } from "next/navigation"
import { useAcademicYears } from "@/lib/hooks/use-academic-years"
import { useSemesters } from "@/lib/hooks/use-semesters"
import { useGrades } from "@/lib/hooks/use-grades"
import { PageHeader } from "@/components/shared/page-header"
import { TableSkeleton } from "@/components/shared/skeletons"
import { AdminGradeTable } from "@/components/admin/admin-grade-table"
import { semesterLabel } from "@/types"
import type { SemesterTerm } from "@/types"
import type { GradeRow } from "@/components/admin/admin-grade-table"

export default function GradesPage() {
  const { yearId, semId } = useParams<{ yearId: string; semId: string }>()
  const { years, isLoading: yearsLoading } = useAcademicYears()
  const { semesters, isLoading: semsLoading } = useSemesters(yearId)
  const { grades, isLoading: gradesLoading } = useGrades(yearId, semId)

  if (yearsLoading || semsLoading || gradesLoading) return <TableSkeleton />

  const year = years.find((y) => y.id === yearId)
  const semester = semesters.find((s) => s.id === semId)
  const semLabel = semester ? semesterLabel(semester.term as SemesterTerm) : ""

  return (
    <div>
      <PageHeader
        title="Grade Management"
        description={
          year && semester
            ? `Read-only grade overview for ${year.label} — ${semLabel}`
            : "View grades for the current semester"
        }
      />
      <AdminGradeTable rows={grades as GradeRow[]} semesterLabel={semLabel} />
    </div>
  )
}
