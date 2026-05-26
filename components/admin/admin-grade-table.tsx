"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/shared/data-table"
import { Search } from "lucide-react"

export type GradeRow = {
  enrollmentId: string
  studentId: string
  studentName: string
  section: string
  courseCode: string
  courseName: string
  grade: number | null
  remarks: string | null
}

export function AdminGradeTable({
  rows,
  semesterLabel,
}: {
  rows: GradeRow[]
  semesterLabel: string
}) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.studentId.toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        r.courseCode.toLowerCase().includes(q) ||
        r.courseName.toLowerCase().includes(q)
    )
  }, [rows, search])

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-8 h-9"
          placeholder="Search by student, course…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        keyField="enrollmentId"
        data={filtered as unknown as Record<string, unknown>[]}
        columns={[
          { key: "studentId", header: "Student ID" },
          { key: "studentName", header: "Name" },
          { key: "section", header: "Section" },
          { key: "courseCode", header: "Code" },
          { key: "courseName", header: "Course" },
          {
            key: "grade",
            header: "Grade",
            render: (row) => {
              const r = row as unknown as GradeRow
              return r.grade !== null ? (
                <span className="font-mono text-sm">{r.grade.toFixed(1)}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )
            },
          },
          {
            key: "remarks",
            header: "Remarks",
            render: (row) => {
              const r = row as unknown as GradeRow
              return r.remarks ?? <span className="text-muted-foreground">—</span>
            },
          },
        ]}
        emptyTitle={
          search ? "No results match your search" : `No grades for ${semesterLabel}`
        }
        emptyDescription={
          search
            ? "Try a different name or course code"
            : "Grades will appear here once professors submit them"
        }
      />
    </div>
  )
}
