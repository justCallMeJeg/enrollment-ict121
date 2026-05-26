"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { IconButton } from "@/components/shared/icon-button"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { toast } from "sonner"
import { UserPlus, UserMinus, Search, Loader2 } from "lucide-react"

export type StudentRow = {
  id: string
  studentId: string
  name: string
  status: "enrolled" | "pre_enrolled"
  grade: number | null
  remarks: string | null
}

type SearchResult = {
  user_id: string
  student_id: string
  year_level: number
  section: string
  users: { name: string } | { name: string }[] | null
  programs: { code: string } | { code: string }[] | null
}

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive"> = {
  enrolled: "default",
  pre_enrolled: "secondary",
}

const STATUS_LABEL: Record<string, string> = {
  enrolled: "Enrolled",
  pre_enrolled: "Pre-Enrolled",
}

export function ClassroomEnrollmentManager({
  enrollments,
  classroomId,
  isPreEnrollment,
}: {
  enrollments: StudentRow[]
  classroomId: string
  isPreEnrollment: boolean
}) {
  const router = useRouter()

  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)

  const [removeTarget, setRemoveTarget] = useState<StudentRow | null>(null)
  const [removing, setRemoving] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)

  async function handleSearch() {
    if (!search.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(
        `/api/admin/students?search=${encodeURIComponent(search)}&classroomId=${classroomId}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResults(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed")
    } finally {
      setSearching(false)
    }
  }

  async function handleAdd(studentUserId: string) {
    setAdding(studentUserId)
    try {
      const res = await fetch("/api/admin/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classroom_id: classroomId, student_id: studentUserId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Student added to classroom")
      setResults((prev) => prev.filter((r) => r.user_id !== studentUserId))
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add student")
    } finally {
      setAdding(null)
    }
  }

  async function handleRemove() {
    if (!removeTarget) return
    setRemoving(true)
    try {
      const res = await fetch(`/api/admin/enrollments/${removeTarget.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Student removed from classroom")
      setRemoveTarget(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove student")
    } finally {
      setRemoving(false)
    }
  }

  function openAddDialog() {
    setSearch("")
    setResults([])
    setAddOpen(true)
    setTimeout(() => searchRef.current?.focus(), 50)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold">Enrolled Students</h2>
        {isPreEnrollment && (
          <Button size="sm" onClick={openAddDialog}>
            <UserPlus className="size-3.5 mr-1.5" />
            Add Student
          </Button>
        )}
      </div>

      {enrollments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center border rounded-md">
          No students enrolled in this classroom yet.
        </p>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Grade</TableHead>
                <TableHead>Remarks</TableHead>
                {isPreEnrollment && <TableHead className="w-px" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-sm">{s.studentId}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[s.status] ?? "outline"} className="text-xs">
                      {STATUS_LABEL[s.status] ?? s.status}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono text-sm ${
                      s.grade !== null
                        ? s.grade <= 3.0
                          ? "text-green-600 dark:text-green-400"
                          : "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {s.grade !== null ? s.grade.toFixed(2) : "—"}
                  </TableCell>
                  <TableCell>
                    {s.remarks ? (
                      <Badge
                        variant={
                          s.remarks === "Passed"
                            ? "default"
                            : s.remarks === "Failed" || s.remarks === "Dropped"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {s.remarks}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )}
                  </TableCell>
                  {isPreEnrollment && (
                    <TableCell>
                      <IconButton
                        tooltip="Remove student"
                        className="hover:text-destructive"
                        onClick={() => setRemoveTarget(s)}
                      >
                        <UserMinus className="size-3.5" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Student Dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!adding) { setAddOpen(o); if (!o) { setResults([]); setSearch("") } } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Input
                ref={searchRef}
                placeholder="Search by student ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button variant="outline" size="icon" onClick={handleSearch} disabled={searching}>
                {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              </Button>
            </div>

            {results.length === 0 && !searching && search && (
              <p className="text-sm text-muted-foreground text-center py-4">No students found.</p>
            )}

            {results.length > 0 && (
              <div className="rounded-md border divide-y">
                {results.map((r) => {
                  const user = Array.isArray(r.users) ? r.users[0] : r.users
                  const prog = Array.isArray(r.programs) ? r.programs[0] : r.programs
                  const label = prog
                    ? `${(prog as { code: string }).code}-${r.year_level}${r.section}`
                    : `Year ${r.year_level} · ${r.section}`
                  return (
                    <div key={r.user_id} className="flex items-center justify-between px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium">{(user as { name: string } | null)?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground font-mono">{r.student_id} · {label}</p>
                      </div>
                      <Button
                        size="sm"
                        disabled={!!adding}
                        onClick={() => handleAdd(r.user_id)}
                      >
                        {adding === r.user_id ? <Loader2 className="size-3.5 animate-spin" /> : "Add"}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove Student"
        description={`Remove ${removeTarget?.name ?? "this student"} (${removeTarget?.studentId ?? ""}) from the classroom? This will delete their enrollment record.`}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={handleRemove}
        loading={removing}
      />
    </>
  )
}
