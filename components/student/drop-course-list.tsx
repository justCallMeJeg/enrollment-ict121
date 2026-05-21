"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { EmptyState } from "@/components/shared/empty-state"
import { toast } from "sonner"

type CourseData = { course_code: string; name: string; semester: string; units: number }

type Enrollment = {
  id: string
  status: string
  courses: CourseData[] | CourseData | null
}

export function DropCourseList({ enrollments }: { enrollments: Enrollment[] }) {
  const router = useRouter()
  const [dropTarget, setDropTarget] = useState<Enrollment | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleDrop() {
    if (!dropTarget) return
    setLoading(true)
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
      setLoading(false)
    }
  }

  if (enrollments.length === 0) {
    return (
      <EmptyState
        title="No enrolled courses"
        description="You have no active course enrollments this semester."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {enrollments.map((enrollment) => {
          const course = Array.isArray(enrollment.courses)
            ? enrollment.courses[0]
            : enrollment.courses
          return (
            <Card key={enrollment.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{course?.course_code}</CardTitle>
                <p className="text-sm text-muted-foreground">{course?.name}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Badge variant="outline">{course?.semester} Sem</Badge>
                  <Badge variant="outline">{course?.units} units</Badge>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full"
                  onClick={() => setDropTarget(enrollment)}
                >
                  Drop Course
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <ConfirmModal
        open={!!dropTarget}
        onOpenChange={(open) => !open && setDropTarget(null)}
        title="Drop Course"
        description={`Are you sure you want to drop "${
          Array.isArray(dropTarget?.courses)
            ? dropTarget?.courses[0]?.name
            : dropTarget?.courses?.name
        }"? This action may affect your academic standing.`}
        confirmLabel="Drop Course"
        onConfirm={handleDrop}
        loading={loading}
      />
    </div>
  )
}
