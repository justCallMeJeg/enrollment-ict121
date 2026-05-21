"use client"

import { useParams } from "next/navigation"
import { useAcademicYears } from "@/lib/hooks/use-academic-years"
import { useSemesters } from "@/lib/hooks/use-semesters"
import { useClassrooms } from "@/lib/hooks/use-classrooms"
import { useCourses } from "@/lib/hooks/use-courses"
import { useProfessors } from "@/lib/hooks/use-professors"
import { PageHeader } from "@/components/shared/page-header"
import { TableSkeleton } from "@/components/shared/skeletons"
import { ClassroomManager } from "@/components/admin/classroom-manager"
import { semesterLabel } from "@/types"
import type { SemesterTerm } from "@/types"

export default function ClassroomsPage() {
  const { yearId, semId } = useParams<{ yearId: string; semId: string }>()
  const { years, isLoading: yearsLoading } = useAcademicYears()
  const { semesters, isLoading: semsLoading } = useSemesters(yearId)
  const { classrooms, isLoading: classroomsLoading } = useClassrooms(yearId, semId)
  const { courses, isLoading: coursesLoading } = useCourses()
  const { professors, isLoading: profsLoading } = useProfessors()

  const isLoading = yearsLoading || semsLoading || classroomsLoading || coursesLoading || profsLoading

  if (isLoading) return <TableSkeleton />

  const year = years.find((y) => y.id === yearId)
  const semester = semesters.find((s) => s.id === semId)
  const semLabel = semester ? semesterLabel(semester.term as SemesterTerm) : ""

  return (
    <div>
      <PageHeader
        title="Classrooms"
        description={
          year && semester
            ? `Course sections for ${year.label} — ${semLabel}`
            : "Course section and professor assignments"
        }
      />
      <ClassroomManager
        classrooms={classrooms}
        courses={courses}
        professors={professors}
        yearId={yearId}
        semId={semId}
        years={years}
      />
    </div>
  )
}
