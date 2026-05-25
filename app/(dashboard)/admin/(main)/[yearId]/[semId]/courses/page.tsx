"use client"

import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { useAcademicYears } from "@/lib/hooks/use-academic-years"
import { useSemesters } from "@/lib/hooks/use-semesters"
import { useClassrooms } from "@/lib/hooks/use-classrooms"
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

type CourseRow = {
  id: string
  course_code: string
  course_name: string
  semester: string
  year_level: number
  units: number
  sections: string[]
}

type ClassroomRow = {
  courses: { id: string; course_code: string; name: string; semester: string; year_level: number; units: number } | { id: string; course_code: string; name: string; semester: string; year_level: number; units: number }[] | null
  programs: { code: string } | { code: string }[] | null
  year_level: number
  section: string
}

export default function SemesterCoursesPage() {
  const { yearId, semId } = useParams<{ yearId: string; semId: string }>()
  const { years, isLoading: yearsLoading } = useAcademicYears()
  const { semesters, isLoading: semsLoading } = useSemesters(yearId)
  const { classrooms, isLoading: classroomsLoading } = useClassrooms(yearId, semId)

  const [search, setSearch] = useState("")
  const [filterSemester, setFilterSemester] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("course_code")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const courseRows = useMemo<CourseRow[]>(() => {
    const map = new Map<string, CourseRow>()
    for (const cr of classrooms as unknown as ClassroomRow[]) {
      const course = Array.isArray(cr.courses) ? cr.courses[0] : cr.courses
      const prog = Array.isArray(cr.programs) ? cr.programs[0] : cr.programs
      if (!course) continue
      const section = prog ? `${prog.code}-${cr.year_level}${cr.section}` : cr.section
      if (map.has(course.id)) {
        map.get(course.id)!.sections.push(section)
      } else {
        map.set(course.id, {
          id: course.id,
          course_code: course.course_code,
          course_name: course.name,
          semester: course.semester,
          year_level: course.year_level,
          units: course.units,
          sections: [section],
        })
      }
    }
    return Array.from(map.values())
  }, [classrooms])

  const filtered = useMemo(() => {
    let rows = courseRows
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(
        (r) => r.course_code.toLowerCase().includes(q) || r.course_name.toLowerCase().includes(q)
      )
    }
    if (filterSemester.length > 0) {
      rows = rows.filter((r) => filterSemester.includes(r.semester))
    }
    return [...rows].sort((a, b) => {
      let av: string | number = a.course_code
      let bv: string | number = b.course_code
      if (sortBy === "course_name") { av = a.course_name; bv = b.course_name }
      if (sortBy === "year_level") { av = a.year_level; bv = b.year_level }
      if (sortBy === "units") { av = a.units; bv = b.units }
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
  }, [courseRows, search, filterSemester, sortBy, sortDir])

  const isLoading = yearsLoading || semsLoading || classroomsLoading
  if (isLoading) return <TableSkeleton />

  const year = years.find((y) => y.id === yearId)
  const semester = semesters.find((s) => s.id === semId)
  const semLabel = semester ? semesterLabel(semester.term as SemesterTerm) : ""

  return (
    <div>
      <PageHeader
        title="Courses"
        description={
          year && semester
            ? `Courses offered for ${year.label} — ${semLabel}`
            : "Courses offered this semester"
        }
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
        totalCount={courseRows.length}
      />
      <DataTable
        keyField="id"
        data={filtered as unknown as Record<string, unknown>[]}
        columns={[
          {
            key: "course_code",
            header: "Code",
            render: (row) => {
              const r = row as unknown as CourseRow
              return <span className="font-mono text-sm">{r.course_code}</span>
            },
          },
          { key: "course_name", header: "Course Name" },
          {
            key: "semester",
            header: "Semester",
            render: (row) => {
              const r = row as unknown as CourseRow
              return (
                <Badge variant="outline" className="text-xs">
                  {semesterLabel(r.semester as SemesterTerm)}
                </Badge>
              )
            },
          },
          { key: "year_level", header: "Year" },
          { key: "units", header: "Units" },
          {
            key: "sections",
            header: "Sections",
            render: (row) => {
              const r = row as unknown as CourseRow
              return (
                <div className="flex gap-1 flex-wrap">
                  {r.sections.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs font-mono">{s}</Badge>
                  ))}
                </div>
              )
            },
          },
        ]}
        emptyTitle={search || filterSemester.length > 0 ? "No courses match your filters" : "No courses this semester"}
        emptyDescription={
          search || filterSemester.length > 0
            ? "Try adjusting your search or filters"
            : "Add classrooms to schedule courses for this semester"
        }
      />
    </div>
  )
}
