"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TableToolbar } from "@/components/shared/table-toolbar"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

export type CourseHistoryRow = {
  id: string
  type: "enrolled" | "pre_enrolled"
  status: string
  course_code: string
  course_name: string
  semester: string
  units: number
  section: string
  grade: number | null
  remarks: string | null
  yearId: string
  yearLabel: string
  semesterId: string
  canDrop: boolean
}

type Props = {
  rows: CourseHistoryRow[]
  defaultYearId: string | null
  activeSemesterId: string | null
}

const SEMESTER_OPTIONS = [
  { label: "1st Semester", value: "1st" },
  { label: "2nd Semester", value: "2nd" },
  { label: "Midyear", value: "midyear" },
]

const STATUS_OPTIONS = [
  { label: "Enrolled", value: "enrolled" },
  { label: "Pre-Enrolled", value: "pre_enrolled" },
  { label: "Dropped", value: "dropped" },
]

const SORT_OPTIONS = [
  { label: "Course Code", value: "course_code" },
  { label: "Course Name", value: "course_name" },
]

export function CoursesList({ rows, defaultYearId }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [filterYear, setFilterYear] = useState<string[]>(defaultYearId ? [defaultYearId] : [])
  const [filterSemester, setFilterSemester] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("course_code")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [dropTarget, setDropTarget] = useState<CourseHistoryRow | null>(null)
  const [dropping, setDropping] = useState(false)

  const uniqueYears = Array.from(
    new Map(rows.map((r) => [r.yearId, r.yearLabel])).entries()
  ).map(([value, label]) => ({ label, value }))

  const filtered = rows.filter((row) => {
    if (search) {
      const q = search.toLowerCase()
      if (!row.course_code.toLowerCase().includes(q) && !row.course_name.toLowerCase().includes(q)) return false
    }
    if (filterYear.length > 0 && !filterYear.includes(row.yearId)) return false
    if (filterSemester.length > 0 && !filterSemester.includes(row.semester)) return false
    if (filterStatus.length > 0) {
      const statusKey = row.type === "pre_enrolled" ? "pre_enrolled" : row.status
      if (!filterStatus.includes(statusKey)) return false
    }
    return true
  })

  const yearMap = new Map<string, { label: string; rows: CourseHistoryRow[] }>()
  for (const row of filtered) {
    if (!yearMap.has(row.yearId)) {
      yearMap.set(row.yearId, { label: row.yearLabel, rows: [] })
    }
    yearMap.get(row.yearId)!.rows.push(row)
  }

  for (const group of yearMap.values()) {
    group.rows.sort((a, b) => {
      let av: string | number = a.course_code
      let bv: string | number = b.course_code
      if (sortBy === "course_name") { av = a.course_name; bv = b.course_name }
    
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
  }

  async function handleDrop() {
    if (!dropTarget) return
    setDropping(true)
    try {
      const res = await fetch("/api/student/drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollment_id: dropTarget.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Course dropped successfully")
      setDropTarget(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to drop course")
    } finally {
      setDropping(false)
    }
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
        sort={{
          options: SORT_OPTIONS,
          sortBy,
          direction: sortDir,
          onChange: (field, dir) => { setSortBy(field); setSortDir(dir) },
        }}
        resultCount={filtered.length}
        totalCount={rows.length}
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">No courses match your filters.</p>
      ) : (
        <div className="space-y-8">
          {Array.from(yearMap.entries()).map(([yearId, { label, rows: yearRows }]) => (
            <section key={yearId}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {label}
              </h2>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {yearRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-sm">{row.course_code}</TableCell>
                        <TableCell>{row.course_name}</TableCell>
                        <TableCell>{row.semester}</TableCell>
                        <TableCell>{row.units}</TableCell>
                        <TableCell className="font-mono text-sm">{row.section}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.type === "pre_enrolled"
                                ? "secondary"
                                : row.status === "dropped"
                                ? "destructive"
                                : "default"
                            }
                            className="text-xs"
                          >
                            {row.type === "pre_enrolled" ? "Pre-Enrolled" : row.status === "dropped" ? "Dropped" : "Enrolled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {row.canDrop && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-destructive"
                              onClick={() => setDropTarget(row)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!dropTarget}
        onOpenChange={(open) => !open && setDropTarget(null)}
        title="Drop Course"
        description={`Are you sure you want to drop "${dropTarget?.course_name}"? This action cannot be undone and the course will be marked as Dropped.`}
        confirmLabel="Drop Course"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDrop}
        loading={dropping}
      />
    </div>
  )
}
