"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { IconButton } from "@/components/shared/icon-button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { UserMinus, AlertCircle } from "lucide-react"

export type StudentEnrollment = {
  id: string
  status: "enrolled" | "pre_enrolled" | "dropped"
  student_id: string
  student_name: string
  grade: number | null
  remarks: string | null
}

const ENROLLMENT_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  enrolled: "default",
  pre_enrolled: "secondary",
  dropped: "destructive",
}

const ENROLLMENT_LABEL: Record<string, string> = {
  enrolled: "Enrolled",
  pre_enrolled: "Pre-Enrolled",
  dropped: "Dropped",
}

type GradeState = Record<string, { grade: string; saving: boolean }>

export function ClassroomStudentTable({
  enrollments,
  isActive,
}: {
  enrollments: StudentEnrollment[]
  isActive: boolean
}) {
  const router = useRouter()

  const [grades, setGrades] = useState<GradeState>(() => {
    const init: GradeState = {}
    enrollments.forEach((e) => {
      init[e.id] = { grade: e.grade?.toFixed(2) ?? "", saving: false }
    })
    return init
  })
  const [dropTarget, setDropTarget] = useState<StudentEnrollment | null>(null)
  const [dropping, setDropping] = useState(false)
  const [incTarget, setIncTarget] = useState<StudentEnrollment | null>(null)
  const [declaring, setDeclaring] = useState(false)

  async function saveGrade(enrollmentId: string) {
    const gradeVal = parseFloat(grades[enrollmentId]?.grade ?? "")
    if (isNaN(gradeVal) || gradeVal < 1 || gradeVal > 5) {
      toast.error("Grade must be between 1.00 and 5.00")
      return
    }
    setGrades((prev) => ({ ...prev, [enrollmentId]: { ...prev[enrollmentId], saving: true } }))
    try {
      const remarks = gradeVal <= 3.0 ? "Passed" : "Failed"
      const res = await fetch(`/api/professor/grades/${enrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: gradeVal, remarks }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Grade saved")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save grade")
    } finally {
      setGrades((prev) => ({ ...prev, [enrollmentId]: { ...prev[enrollmentId], saving: false } }))
    }
  }

  async function handleDrop() {
    if (!dropTarget) return
    setDropping(true)
    try {
      const res = await fetch(`/api/professor/grades/${dropTarget.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Student dropped from course")
      setDropTarget(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to drop student")
    } finally {
      setDropping(false)
    }
  }

  async function handleDeclareINC() {
    if (!incTarget) return
    setDeclaring(true)
    try {
      const res = await fetch(`/api/professor/grades/${incTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarks: "Incomplete" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("INC declared — grade can be resolved at any time")
      setIncTarget(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to declare INC")
    } finally {
      setDeclaring(false)
    }
  }

  // Actions column is shown when semester is active OR any student has INC to resolve
  const hasINCStudents = enrollments.some((e) => e.remarks === "Incomplete")
  const showActionsColumn = isActive || hasINCStudents

  if (enrollments.length === 0) {
    return (
      <div className="rounded-md border py-12 text-center">
        <p className="text-sm font-medium text-foreground">No students yet</p>
        <p className="text-xs text-muted-foreground mt-1">Students will appear here once they enroll.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Remarks</TableHead>
              {showActionsColumn && <TableHead className="w-px"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.map((e) => {
              const gradeState = grades[e.id]
              const isINC = e.remarks === "Incomplete"
              // Grade inputs: active enrolled students OR INC students (for resolution, any semester state)
              const canGrade = (isActive && e.status === "enrolled" && !isINC) || isINC
              const canDeclareINC = isActive && e.status === "enrolled" && !isINC
              const canDrop = isActive && e.status === "enrolled"

              return (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-sm">{e.student_id}</TableCell>
                  <TableCell>{e.student_name}</TableCell>
                  <TableCell>
                    <Badge variant={ENROLLMENT_BADGE[e.status] ?? "outline"} className="text-xs">
                      {ENROLLMENT_LABEL[e.status] ?? e.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canGrade ? (
                      <div className="flex items-center gap-2">
                        <Input
                          className="w-24 h-8"
                          type="number"
                          min={1}
                          max={5}
                          step={0.25}
                          placeholder="1.00–5.00"
                          value={gradeState?.grade ?? ""}
                          onChange={(ev) =>
                            setGrades((prev) => ({
                              ...prev,
                              [e.id]: { ...prev[e.id], grade: ev.target.value },
                            }))
                          }
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              className="h-8"
                              disabled={gradeState?.saving}
                              onClick={() => saveGrade(e.id)}
                            >
                              {gradeState?.saving ? "Saving…" : isINC ? "Resolve" : "Save"}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent sideOffset={4}>
                            {isINC ? "Resolve INC with this grade" : "Save grade"}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ) : (
                      <span className={`font-mono text-sm ${
                        e.grade !== null
                          ? e.grade <= 3.0
                            ? "text-green-600 dark:text-green-400"
                            : "text-destructive"
                          : "text-muted-foreground"
                      }`}>
                        {e.grade !== null ? e.grade.toFixed(2) : "—"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {e.remarks ? (
                      <Badge
                        variant={
                          e.remarks === "Passed"
                            ? "default"
                            : e.remarks === "Failed" || e.remarks === "Dropped"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {e.remarks}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  {showActionsColumn && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canDeclareINC && (
                          <IconButton
                            tooltip="Declare Incomplete (INC)"
                            className="hover:text-amber-600"
                            onClick={() => setIncTarget(e)}
                          >
                            <AlertCircle className="size-3.5" />
                          </IconButton>
                        )}
                        {canDrop && (
                          <IconButton
                            tooltip="Drop student"
                            className="hover:text-destructive"
                            onClick={() => setDropTarget(e)}
                          >
                            <UserMinus className="size-3.5" />
                          </IconButton>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmModal
        open={!!incTarget}
        onOpenChange={(open) => !open && setIncTarget(null)}
        title="Declare Incomplete (INC)"
        description={`Mark ${incTarget?.student_name ?? "this student"} as Incomplete? The grade remains unresolved and can be submitted at any time, even after the semester ends.`}
        confirmLabel="Declare INC"
        variant="default"
        onConfirm={handleDeclareINC}
        loading={declaring}
      />

      <ConfirmModal
        open={!!dropTarget}
        onOpenChange={(open) => !open && setDropTarget(null)}
        title="Drop Student"
        description={`Are you sure you want to drop ${dropTarget?.student_name ?? "this student"} from the course? This cannot be undone.`}
        confirmLabel="Drop Student"
        onConfirm={handleDrop}
        loading={dropping}
      />
    </>
  )
}
