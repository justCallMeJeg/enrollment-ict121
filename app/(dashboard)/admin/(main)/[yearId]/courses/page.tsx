"use client"

import { useParams } from "next/navigation"
import { useAcademicYears } from "@/lib/hooks/use-academic-years"
import { useOfferedCourses } from "@/lib/hooks/use-offered-courses"
import { PageHeader } from "@/components/shared/page-header"
import { TableSkeleton } from "@/components/shared/skeletons"
import { DataTable } from "@/components/shared/data-table"
import { Badge } from "@/components/ui/badge"
import { semesterLabel } from "@/types"
import type { SemesterTerm } from "@/types"

type OfferedCourse = {
  id: string
  course_code: string
  name: string
  semester: string
  units: number
  year_level: number
  programs: { name: string; code: string } | null
  semesters: { term: string; status: string }[]
}

export default function YearCoursesPage() {
  const { yearId } = useParams<{ yearId: string }>()
  const { years, isLoading: yearsLoading } = useAcademicYears()
  const { courses, isLoading: coursesLoading } = useOfferedCourses(yearId)

  if (yearsLoading || coursesLoading) return <TableSkeleton />

  const year = years.find((y) => y.id === yearId)

  return (
    <div>
      <PageHeader
        title="Courses"
        description={year ? `Courses scheduled for ${year.label}` : "Courses scheduled this year"}
      />
      <DataTable
        keyField="id"
        data={(courses as unknown as Record<string, unknown>[]) ?? []}
        columns={[
          {
            key: "course_code",
            header: "Code",
            render: (row) => {
              const c = row as unknown as OfferedCourse
              return <span className="font-mono text-sm">{c.course_code}</span>
            },
          },
          { key: "name", header: "Course Name" },
          {
            key: "semesters",
            header: "Offered In",
            render: (row) => {
              const c = row as unknown as OfferedCourse
              if (!c.semesters?.length) return <span className="text-muted-foreground">—</span>
              return (
                <div className="flex gap-1 flex-wrap">
                  {c.semesters.map((s) => (
                    <Badge key={s.term} variant="outline">
                      {semesterLabel(s.term as SemesterTerm)}
                    </Badge>
                  ))}
                </div>
              )
            },
          },
          { key: "year_level", header: "Year" },
          { key: "units", header: "Units" },
          {
            key: "program",
            header: "Program",
            render: (row) => {
              const c = row as unknown as OfferedCourse
              return c.programs ? (
                <span>{c.programs.code}</span>
              ) : (
                <span className="text-muted-foreground">All programs</span>
              )
            },
          },
        ]}
        emptyTitle="No courses scheduled this year"
        emptyDescription="Add classrooms in a semester to schedule courses for this year"
      />
    </div>
  )
}
