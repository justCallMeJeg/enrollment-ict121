"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { CheckCircle, XCircle, BookOpen } from "lucide-react"
import { toast } from "sonner"
import type { ClassroomWithEligibility } from "@/types"

type Props = {
  classrooms: ClassroomWithEligibility[]
}

export function PreEnrollmentList({ classrooms }: Props) {
  const router = useRouter()
  const [pendingToggle, setPendingToggle] = useState<ClassroomWithEligibility | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleEnroll(classroom: ClassroomWithEligibility) {
    if (!classroom.eligible) return
    if (classroom.pre_enrolled) {
      setPendingToggle(classroom)
      return
    }
    await toggle(classroom, true)
  }

  async function toggle(classroom: ClassroomWithEligibility, enroll: boolean) {
    setLoading(true)
    try {
      const res = await fetch("/api/student/pre-enrollment", {
        method: enroll ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classroom_id: classroom.id }),
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

  if (classrooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookOpen className="size-10 text-muted-foreground mb-3" />
        <p className="font-medium text-sm">No courses available</p>
        <p className="text-xs text-muted-foreground mt-1">
          No classrooms found for your year level and program.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classrooms.map((classroom) => (
          <Card
            key={classroom.id}
            className={classroom.pre_enrolled ? "border-primary" : undefined}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {classroom.course_code}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">{classroom.course_name}</p>
                </div>
                {classroom.pre_enrolled && (
                  <Badge variant="default" className="shrink-0">Enrolled</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{classroom.semester} Sem</Badge>
                <Badge variant="outline">{classroom.units} units</Badge>
                <Badge variant="secondary">Section {classroom.section}</Badge>
              </div>
              {classroom.professor_name && (
                <p className="text-xs text-muted-foreground">{classroom.professor_name}</p>
              )}
              {classroom.prerequisite_codes.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  {classroom.eligible ? (
                    <CheckCircle className="size-3.5 text-green-500" />
                  ) : (
                    <XCircle className="size-3.5 text-destructive" />
                  )}
                  <span className={classroom.eligible ? "text-muted-foreground" : "text-destructive"}>
                    Prerequisite{classroom.prerequisite_codes.length > 1 ? "s" : ""}: {classroom.prerequisite_codes.join(", ")}
                    {!classroom.eligible && " (not yet passed)"}
                  </span>
                </div>
              )}
              <Button
                size="sm"
                variant={classroom.pre_enrolled ? "outline" : "default"}
                className="w-full"
                disabled={!classroom.eligible || loading}
                onClick={() => handleEnroll(classroom)}
              >
                {classroom.pre_enrolled ? "Remove" : "Add to Pre-Enrollment"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmModal
        open={!!pendingToggle}
        onOpenChange={(open) => !open && setPendingToggle(null)}
        title="Remove Course"
        description={`Are you sure you want to remove "${pendingToggle?.course_name}" from your pre-enrollment? You can re-add it later if slots are available.`}
        confirmLabel="Remove"
        onConfirm={() => pendingToggle && toggle(pendingToggle, false)}
        loading={loading}
      />
    </div>
  )
}
