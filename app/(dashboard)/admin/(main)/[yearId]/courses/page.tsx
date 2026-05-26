"use client"

import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { useAcademicYears } from "@/lib/hooks/use-academic-years"
import { useOfferedCourses } from "@/lib/hooks/use-offered-courses"
import { PageHeader } from "@/components/shared/page-header"
import { TableSkeleton } from "@/components/shared/skeletons"
import { TableToolbar } from "@/components/shared/table-toolbar"
import { DataTable } from "@/components/shared/data-table"
import { Badge } from "@/components/ui/badge"
import { semesterLabel } from "@/types"
import type { SemesterTerm } from "@/types"

const SEMESTER_OPTIONS = [
  { label: "1st Semester", value: "1st" },
  { label: "2nd Semester", value: "2nd" },
  { label: "Midyear", value: "midyear" },
]

const SORT_OPTIONS = [
  { label: "Course Code", value: "course_code" },
  { label: "Course Name", value: "course_name" },
  { label: "Year Level", value: "year_level" },
  { label: "Units", value: "units" },
]

type OfferedCourse = {
  id: string
  course_code: string
  name: string
  semester: string
  units: number
  year_level: number
  programs: { id: string; name: string; code: string }[]
  semesters: { term: string; status: string }[]
}

export default function YearCoursesPage() {
  const { yearId } = useParams<{ yearId: string }>()
  const { years, isLoading: yearsLoading } = useAcademicYears()
  const { courses, isLoading: coursesLoading } = useOfferedCourses(yearId)

  const [search, setSearch] = useState("")
  const [filterSemester, setFilterSemester] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("course_code")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const typedCourses = courses as unknown as OfferedCourse[]

  const filtered = useMemo(() => {
    let rows = typedCourses
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(
        (c) =>
          c.course_code.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q)
      )
    }
    if (filterSemester.length > 0) {
      rows = rows.filter((c) => filterSemester.includes(c.semester))
    }
    return [...rows].sort((a, b) => {
      let av: string | number = a.course_code
      let bv: string | number = b.course_code
      if (sortBy === "course_name") { av = a.name; bv = b.name }
      if (sortBy === "year_level") { av = a.year_level; bv = b.year_level }
      if (sortBy === "units") { av = a.units; bv = b.units }
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
  }, [typedCourses, search, filterSemester, sortBy, sortDir])

  const isLoading = yearsLoading || coursesLoading
  if (isLoading) return <TableSkeleton />

  const year = years.find((y) => y.id === yearId)

  return (
    <div>
      <PageHeader
        title="Courses"
        description={year ? `Courses offered in ${year.label}` : "Courses offered this year"}
      />
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by code or name…"
        filters={[
          {
            key: "semester",
            label: "Semester",
            options: SEMESTER_OPTIONS,
            selected: filterSemester,
            onApply: setFilterSemester,
          },
        ]}
        sort={{
          options: SORT_OPTIONS,
          sortBy,
          direction: sortDir,
          onChange: (field, dir) => { setSortBy(field); setSortDir(dir) },
        }}
        resultCount={filtered.length}
        totalCount={typedCourses.length}
      />
      <DataTable
        keyField="id"
        data={filtered as unknown as Record<string, unknown>[]}
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
            key: "semester",
            header: "Offered In",
            render: (row) => {
              const c = row as unknown as OfferedCourse
              if (!c.semesters?.length) {
                return (
                  <Badge variant="outline" className="text-xs">
                    {semesterLabel(c.semester as SemesterTerm)}
                  </Badge>
                )
              }
              return (
                <div className="flex gap-1 flex-wrap">
                  {c.semesters.map((s) => (
                    <Badge key={s.term} variant="outline" className="text-xs">
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
            key: "programs",
            header: "Program",
            render: (row) => {
              const c = row as unknown as OfferedCourse
              if (!c.programs?.length) {
                return <span className="text-muted-foreground text-sm">All programs</span>
              }
              return (
                <div className="flex gap-1 flex-wrap">
                  {c.programs.map((p) => (
                    <Badge key={p.id} variant="secondary" className="text-xs font-mono">
                      {p.code}
                    </Badge>
                  ))}
                </div>
              )
            },
          },
        ]}
        emptyTitle={
          search || filterSemester.length > 0
            ? "No courses match your filters"
            : "No courses scheduled this year"
        }
        emptyDescription={
          search || filterSemester.length > 0
            ? "Try adjusting your search or filters"
            : "Add classrooms in a semester to schedule courses for this year"
        }
      />
    </div>
  )
}
