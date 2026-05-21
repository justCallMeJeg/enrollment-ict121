"use client"

import { useParams } from "next/navigation"
import { useAcademicYears } from "@/lib/hooks/use-academic-years"
import { useSemesters } from "@/lib/hooks/use-semesters"
import { useCourses } from "@/lib/hooks/use-courses"
import { usePrograms } from "@/lib/hooks/use-programs"
import { useProfessors } from "@/lib/hooks/use-professors"
import { PageHeader } from "@/components/shared/page-header"
import { TableSkeleton } from "@/components/shared/skeletons"
import { CourseManager } from "@/components/admin/course-manager"

export default function CoursesPage() {
  const { yearId, semId } = useParams<{ yearId: string; semId?: string }>()
  const { years, isLoading: yearsLoading } = useAcademicYears()
  const { semesters, isLoading: semsLoading } = useSemesters(yearId)
  const { courses, isLoading: coursesLoading } = useCourses(yearId)
  const { programs, isLoading: programsLoading } = usePrograms()
  const { professors, isLoading: profsLoading } = useProfessors()

  const isLoading =
    yearsLoading || semsLoading || coursesLoading || programsLoading || profsLoading

  if (isLoading) return <TableSkeleton />

  const year = years.find((y) => y.id === yearId)
  const currentSem = semesters.find((s) => s.id === semId)

  return (
    <div>
      <PageHeader
        title="Courses"
        description={year ? `Course offerings for ${year.label}` : "Course offerings"}
      />
      <CourseManager
        courses={courses}
        programs={programs}
        professors={professors}
        academicYearId={yearId}
        defaultTermFilter={currentSem?.term}
      />
    </div>
  )
}
