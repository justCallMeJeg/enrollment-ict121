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
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { UserMinus } from "lucide-react"

type CourseData = { id: string; course_code: string; name: string }
type StudentData = { student_id: string; section: string; users: { name: string }[] | { name: string } | null }
type GradeData = { id: string; grade: number | null; remarks: string | null }

type Enrollment = {
  id: string
  status: string
  courses: CourseData[] | CourseData | null
  students: StudentData[] | StudentData | null
  grades: GradeData[] | GradeData | null
}

type GradeState = Record<string, { grade: string; saving: boolean }>

export function GradeTable({ enrollments }: { enrollments: Enrollment[] }) {
  const router = useRouter()
  const [grades, setGrades] = useState<GradeState>(() => {
    const init: GradeState = {}
    enrollments.forEach((e) => {
      const g = Array.isArray(e.grades) ? e.grades[0] : e.grades
      init[e.id] = { grade: g?.grade?.toFixed(2) ?? "", saving: false }
    })
    return init
  })
  const [dropTarget, setDropTarget] = useState<Enrollment | null>(null)
  const [dropping, setDropping] = useState(false)

  async function saveGrade(enrollmentId: string) {
    const gradeVal = parseFloat(grades[enrollmentId]?.grade ?? "")
    if (isNaN(gradeVal) || gradeVal < 1 || gradeVal > 5) {
      toast.error("Grade must be between 1.00 and 5.00")
      return
    }

    setGrades((prev) => ({
      ...prev,
      [enrollmentId]: { ...prev[enrollmentId], saving: true },
    }))

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
      setGrades((prev) => ({
        ...prev,
        [enrollmentId]: { ...prev[enrollmentId], saving: false },
      }))
    }
  }

  async function handleDrop() {
    if (!dropTarget) return
    setDropping(true)
    try {
      const res = await fetch(`/api/professor/grades/${dropTarget.id}`, {
        method: "DELETE",
      })
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

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Grade (1.00–5.00)</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.map((e) => {
              const course = Array.isArray(e.courses) ? e.courses[0] : e.courses
              const student = Array.isArray(e.students) ? e.students[0] : e.students
              const user = student?.users
                ? Array.isArray(student.users)
                  ? student.users[0]
                  : student.users
                : null
              const gradeData = Array.isArray(e.grades) ? e.grades[0] : e.grades
              const gradeState = grades[e.id]

              return (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-sm">
                    {student?.student_id}
                  </TableCell>
                  <TableCell>{user?.name}</TableCell>
                  <TableCell>{student?.section}</TableCell>
                  <TableCell className="text-sm">
                    {course?.course_code}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 items-center">
                      <Input
                        className="w-24 h-8"
                        type="number"
                        min={1}
                        max={5}
                        step={0.25}
                        value={gradeState?.grade ?? ""}
                        onChange={(ev) =>
                          setGrades((prev) => ({
                            ...prev,
                            [e.id]: { ...prev[e.id], grade: ev.target.value },
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        className="h-8"
                        disabled={gradeState?.saving}
                        onClick={() => saveGrade(e.id)}
                      >
                        {gradeState?.saving ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {gradeData?.remarks ? (
                      <Badge
                        variant={
                          gradeData.remarks === "Passed"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {gradeData.remarks}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDropTarget(e)}
                    >
                      <UserMinus className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmModal
        open={!!dropTarget}
        onOpenChange={(open) => !open && setDropTarget(null)}
        title="Drop Student"
        description={`Are you sure you want to manually drop this student from the course?`}
        confirmLabel="Drop Student"
        onConfirm={handleDrop}
        loading={dropping}
      />
    </div>
  )
}
