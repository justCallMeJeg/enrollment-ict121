"use client"

import { useState } from "react"
import { TableToolbar } from "@/components/shared/table-toolbar"
import { semesterLabel } from "@/types"
import type { SemesterTerm } from "@/types"

export type GradeRow = {
  id: string
  course_code: string
  course_name: string
  units: number
  section: string
  grade: number | null
  remarks: string | null
  status: string
  yearId: string
  yearLabel: string
  semId: string
  semTerm: string
}

type Props = {
  rows: GradeRow[]
}

function getDisplayStatus(row: GradeRow) {
  if (row.status === "dropped") return "dropped"
  if (row.remarks === "Incomplete") return "incomplete"
  if (row.grade !== null && row.grade <= 3.0) return "passed"
  if (row.grade !== null && row.grade > 3.0) return "failed"
  return "pending"
}

const SEMESTER_OPTIONS = [
  { label: "1st Semester", value: "1st" },
  { label: "2nd Semester", value: "2nd" },
  { label: "Midyear", value: "midyear" },
]

const STATUS_OPTIONS = [
  { label: "Passed", value: "passed" },
  { label: "Failed", value: "failed" },
  { label: "Pending", value: "pending" },
  { label: "Incomplete (INC)", value: "incomplete" },
  { label: "Dropped", value: "dropped" },
]

function GradeDisplay({ row }: { row: GradeRow }) {
  const ds = getDisplayStatus(row)

  if (ds === "incomplete") {
    return (
      <div className="text-right">
        <p className="font-semibold text-sm text-destructive">Inc.</p>
        {row.grade !== null && (
          <p className="text-xs text-primary mt-0.5">Completion: {row.grade.toFixed(1)}</p>
        )}
      </div>
    )
  }

  if (row.grade !== null) {
    return (
      <p className={`font-semibold text-sm ${row.grade <= 3.0 ? "text-primary" : "text-destructive"}`}>
        {row.grade.toFixed(1)}
      </p>
    )
  }

  if (ds === "dropped") {
    return <p className="text-xs text-muted-foreground">Dropped</p>
  }

  return <p className="text-sm text-muted-foreground">—</p>
}

export function GradesList({ rows }: Props) {
  const [search, setSearch] = useState("")
  const [filterYear, setFilterYear] = useState<string[]>([])
  const [filterSemester, setFilterSemester] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string[]>([])

  const uniqueYears = Array.from(
    new Map(rows.map((r) => [r.yearId, r.yearLabel])).entries()
  ).map(([value, label]) => ({ label, value }))

  const filtered = rows.filter((row) => {
    if (search) {
      const q = search.toLowerCase()
      if (
        !row.course_code.toLowerCase().includes(q) &&
        !row.course_name.toLowerCase().includes(q)
      )
        return false
    }
    if (filterYear.length > 0 && !filterYear.includes(row.yearId)) return false
    if (filterSemester.length > 0 && !filterSemester.includes(row.semTerm)) return false
    if (filterStatus.length > 0 && !filterStatus.includes(getDisplayStatus(row))) return false
    return true
  })

  // Group by year → semester
  const yearMap = new Map<
    string,
    { label: string; sems: Map<string, { term: string; rows: GradeRow[] }> }
  >()
  for (const row of filtered) {
    if (!yearMap.has(row.yearId)) {
      yearMap.set(row.yearId, { label: row.yearLabel, sems: new Map() })
    }
    const yearGroup = yearMap.get(row.yearId)!
    if (!yearGroup.sems.has(row.semId)) {
      yearGroup.sems.set(row.semId, { term: row.semTerm, rows: [] })
    }
    yearGroup.sems.get(row.semId)!.rows.push(row)
  }

  return (
    <div>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by code or name…"
        filters={[
          {
            key: "year",
            label: "Year",
            options: uniqueYears,
            selected: filterYear,
            onApply: setFilterYear,
          },
          {
            key: "semester",
            label: "Semester",
            options: SEMESTER_OPTIONS,
            selected: filterSemester,
            onApply: setFilterSemester,
          },
          {
            key: "status",
            label: "Status",
            options: STATUS_OPTIONS,
            selected: filterStatus,
            onApply: setFilterStatus,
          },
        ]}
        resultCount={filtered.length}
        totalCount={rows.length}
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          No records match your filters.
        </p>
      ) : (
        <div className="space-y-10">
          {Array.from(yearMap.entries()).map(([yearId, { label, sems }]) => (
            <section key={yearId}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                {label}
              </h2>
              <div className="space-y-6">
                {Array.from(sems.entries()).map(([semId, { term, rows: semRows }]) => (
                  <div key={semId}>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-2 pl-0.5">
                      {semesterLabel(term as SemesterTerm)}
                    </h3>
                    <div className="rounded-md border divide-y overflow-hidden">
                      {semRows.map((row) => (
                        <div key={row.id} className="flex items-center gap-4 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{row.course_code}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {row.course_name}
                            </p>
                          </div>
                          <GradeDisplay row={row} />
                          <p className="text-sm text-muted-foreground w-6 text-right shrink-0">
                            {row.units}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
