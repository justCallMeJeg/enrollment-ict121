"use client"

import { usePrograms } from "@/lib/hooks/use-programs"
import { useCourses } from "@/lib/hooks/use-courses"
import { PageHeader } from "@/components/shared/page-header"
import { TableSkeleton } from "@/components/shared/skeletons"
import { CourseManager } from "@/components/admin/course-manager"

export default function GlobalCoursesPage() {
  const { courses, isLoading: coursesLoading } = useCourses()
  const { programs, isLoading: programsLoading } = usePrograms()

  if (coursesLoading || programsLoading) return <TableSkeleton />

  return (
    <div>
      <PageHeader
        title="Course Catalog"
        description="Global catalog of all courses offered by the institution"
      />
      <CourseManager courses={courses} programs={programs} />
    </div>
  )
}
