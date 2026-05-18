"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { CheckCircle, XCircle, BookOpen } from "lucide-react"
import { toast } from "sonner"
import type { CourseWithEligibility } from "@/types"

type Props = {
  courses: CourseWithEligibility[]
  academicYearId: string
}

export function PreEnrollmentList({ courses, academicYearId }: Props) {
  const router = useRouter()
  const [pendingToggle, setPendingToggle] = useState<CourseWithEligibility | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleEnroll(course: CourseWithEligibility) {
    if (!course.eligible) return
    if (course.pre_enrolled) {
      // confirm before unenrolling
      setPendingToggle(course)
      return
    }
    await toggle(course, true)
  }

  async function toggle(course: CourseWithEligibility, enroll: boolean) {
    setLoading(true)
    try {
      const res = await fetch("/api/student/pre-enrollment", {
        method: enroll ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: course.id, academic_year_id: academicYearId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(enroll ? "Course added to pre-enrollment" : "Course removed from pre-enrollment")
      setPendingToggle(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setLoading(false)
    }
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookOpen className="size-10 text-muted-foreground mb-3" />
        <p className="font-medium text-sm">No courses available</p>
        <p className="text-xs text-muted-foreground mt-1">
          No courses found for your year level and program.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course) => {
          const prereq = (course as unknown as { prerequisite?: { course_code: string } | null }).prerequisite
          return (
            <Card
              key={course.id}
              className={course.pre_enrolled ? "border-primary" : undefined}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      {course.course_code}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">{course.name}</p>
                  </div>
                  {course.pre_enrolled && (
                    <Badge variant="default" className="shrink-0">Enrolled</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{course.semester} Sem</Badge>
                  <Badge variant="outline">{course.units} units</Badge>
                </div>
                {prereq && (
                  <div className="flex items-center gap-1.5 text-xs">
                    {course.eligible ? (
                      <CheckCircle className="size-3.5 text-green-500" />
                    ) : (
                      <XCircle className="size-3.5 text-destructive" />
                    )}
                    <span className={course.eligible ? "text-muted-foreground" : "text-destructive"}>
                      Prerequisite: {prereq.course_code}
                      {!course.eligible && " (not yet passed)"}
                    </span>
                  </div>
                )}
                <Button
                  size="sm"
                  variant={course.pre_enrolled ? "outline" : "default"}
                  className="w-full"
                  disabled={!course.eligible || loading}
                  onClick={() => handleEnroll(course)}
                >
                  {course.pre_enrolled ? "Remove" : "Add to Pre-Enrollment"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <ConfirmModal
        open={!!pendingToggle}
        onOpenChange={(open) => !open && setPendingToggle(null)}
        title="Remove Course"
        description={`Are you sure you want to remove "${pendingToggle?.name}" from your pre-enrollment? You can re-add it later if slots are available.`}
        confirmLabel="Remove"
        onConfirm={() => pendingToggle && toggle(pendingToggle, false)}
        loading={loading}
      />
    </div>
  )
}
