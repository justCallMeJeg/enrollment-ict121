"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { CheckCircle, XCircle, BookOpen, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { ClassroomWithEligibility } from "@/types"

type Props = {
  classrooms: ClassroomWithEligibility[]
  yearLabel?: string
}

function CourseRow({ classroom, readonly }: { classroom: ClassroomWithEligibility; readonly?: boolean }) {
  const formattedSection = classroom.program_code
    ? `${classroom.program_code}-${classroom.year_level}${classroom.section}`
    : classroom.section

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-sm font-semibold">{classroom.course_code}</span>
        <span className="text-sm text-muted-foreground">{classroom.course_name}</span>
      </div>
      <div className="flex gap-2 mt-1 flex-wrap items-center">
        <Badge variant="outline" className="text-xs">{classroom.semester} Sem</Badge>
        <Badge variant="outline" className="text-xs">{classroom.units} units</Badge>
        <Badge variant="secondary" className="text-xs font-mono">{formattedSection}</Badge>
        {classroom.professor_name && (
          <span className="text-xs text-muted-foreground">{classroom.professor_name}</span>
        )}
      </div>
      {!readonly && classroom.prerequisite_codes.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs mt-1.5">
          {classroom.eligible ? (
            <CheckCircle className="size-3.5 text-green-500 shrink-0" />
          ) : (
            <XCircle className="size-3.5 text-destructive shrink-0" />
          )}
          <span className={classroom.eligible ? "text-muted-foreground" : "text-destructive"}>
            Prerequisite{classroom.prerequisite_codes.length > 1 ? "s" : ""}: {classroom.prerequisite_codes.join(", ")}
            {!classroom.eligible && " (not yet passed)"}
          </span>
        </div>
      )}
    </div>
  )
}

export function PreEnrollmentList({ classrooms, yearLabel }: Props) {
  const router = useRouter()

  const initialPreEnrolled = new Set(classrooms.filter((c) => c.pre_enrolled).map((c) => c.id))
  // Once any course is pre-enrolled in the DB, the list is locked
  const isLocked = initialPreEnrolled.size > 0

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(classrooms.filter((c) => c.eligible).map((c) => c.id))
  )
  const [savedEnrolled] = useState<Set<string>>(() => initialPreEnrolled)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  function toggle(id: string) {
    if (isLocked) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const eligibleClassrooms = classrooms.filter((c) => c.eligible)
  const ineligibleClassrooms = classrooms.filter((c) => !c.eligible)
  const selectedCount = selected.size
  const totalUnits = classrooms
    .filter((c) => selected.has(c.id))
    .reduce((sum, c) => sum + c.units, 0)

  const hasChanges =
    selected.size !== savedEnrolled.size ||
    [...selected].some((id) => !savedEnrolled.has(id))

  async function handleConfirm() {
    const toAdd = [...selected].filter((id) => !savedEnrolled.has(id))
    const toRemove = [...savedEnrolled].filter((id) => !selected.has(id))

    setLoading(true)
    try {
      const results = await Promise.all([
        ...toAdd.map((id) =>
          fetch("/api/student/pre-enrollment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ classroom_id: id }),
          })
        ),
        ...toRemove.map((id) =>
          fetch("/api/student/pre-enrollment", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ classroom_id: id }),
          })
        ),
      ])

      const failed = results.filter((r) => !r.ok)
      if (failed.length > 0) throw new Error(`${failed.length} request(s) failed`)

      router.push("/student/pre-enrollment/success")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save pre-enrollment")
      setShowConfirm(false)
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

  // ── Read-only locked view ─────────────────────────────────────────────────
  if (isLocked) {
    const enrolledClassrooms = classrooms.filter((c) => c.pre_enrolled)
    const lockedUnits = enrolledClassrooms.reduce((s, c) => s + c.units, 0)

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3">
          <Lock className="size-4 text-green-600 dark:text-green-400 shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-semibold">Pre-enrollment submitted</span>
            <span className="text-muted-foreground">
              {" "}— {enrolledClassrooms.length} course{enrolledClassrooms.length !== 1 ? "s" : ""}, {lockedUnits} units.
              Contact the registrar to request changes.
            </span>
          </div>
        </div>
        <div className="space-y-2">
          {enrolledClassrooms.map((classroom) => (
            <div
              key={classroom.id}
              className="flex items-center gap-4 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3"
            >
              <Checkbox checked disabled className="shrink-0" />
              <CourseRow classroom={classroom} readonly />
            </div>
          ))}
          {classrooms.filter((c) => !c.pre_enrolled).map((classroom) => (
            <div
              key={classroom.id}
              className="flex items-center gap-4 rounded-lg border px-4 py-3 opacity-40"
            >
              <Checkbox checked={false} disabled className="shrink-0" />
              <CourseRow classroom={classroom} readonly />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Editable view ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3">
        <div className="text-sm">
          <span className="font-semibold">{selectedCount}</span>
          <span className="text-muted-foreground">
            {" "}course{selectedCount !== 1 ? "s" : ""} selected
          </span>
          {selectedCount > 0 && (
            <>
              <span className="text-muted-foreground mx-1.5">·</span>
              <span className="font-semibold">{totalUnits}</span>
              <span className="text-muted-foreground"> units</span>
            </>
          )}
        </div>
        <Button
          size="sm"
          disabled={loading || !hasChanges || selectedCount === 0}
          onClick={() => setShowConfirm(true)}
        >
          Confirm Pre-Enrollment
        </Button>
      </div>

      {/* Eligible courses */}
      <div className="space-y-2">
        {eligibleClassrooms.map((classroom) => {
          const isSelected = selected.has(classroom.id)
          return (
            <div
              key={classroom.id}
              role="button"
              tabIndex={0}
              onClick={() => toggle(classroom.id)}
              onKeyDown={(e) => (e.key === " " || e.key === "Enter") && toggle(classroom.id)}
              className={cn(
                "flex items-center gap-4 rounded-lg border px-4 py-3 cursor-pointer select-none transition-colors",
                isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggle(classroom.id)}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0"
              />
              <CourseRow classroom={classroom} />
            </div>
          )
        })}
      </div>

      {/* Ineligible courses */}
      {ineligibleClassrooms.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
            Unavailable — prerequisites not met
          </p>
          {ineligibleClassrooms.map((classroom) => (
            <div
              key={classroom.id}
              className="flex items-center gap-4 rounded-lg border px-4 py-3 opacity-50"
            >
              <Checkbox checked={false} disabled className="shrink-0" />
              <CourseRow classroom={classroom} />
            </div>
          ))}
        </div>
      )}

      {/* Confirmation modal */}
      <ConfirmModal
        open={showConfirm}
        onOpenChange={(open) => !open && setShowConfirm(false)}
        title="Confirm Pre-Enrollment"
        description={`You are about to pre-enroll in ${selectedCount} course${selectedCount !== 1 ? "s" : ""} totaling ${totalUnits} units${yearLabel ? ` for ${yearLabel}` : ""}. Once confirmed, your selection cannot be changed. Do you want to proceed?`}
        confirmLabel="Confirm Pre-Enrollment"
        cancelLabel="Review Selection"
        variant="default"
        onConfirm={handleConfirm}
        loading={loading}
      />
    </div>
  )
}
