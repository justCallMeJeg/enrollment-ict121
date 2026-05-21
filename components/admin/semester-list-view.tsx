"use client"

import { useState } from "react"
import { mutate } from "swr"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { semesterLabel } from "@/types"
import type { Semester, SemesterStatus } from "@/types"
import { BookOpen, ChevronRight, Trash2, Zap, StopCircle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const STATUS_BADGE: Record<SemesterStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  pre_enrollment: "secondary",
  draft: "outline",
  ended: "outline",
}

const STATUS_LABEL: Record<SemesterStatus, string> = {
  draft: "Draft",
  pre_enrollment: "Open",
  active: "Active",
  ended: "Ended",
}

type Action = {
  semId: string
  type: "open" | "activate" | "end" | "delete"
}

const ACTION_META: Record<
  Action["type"],
  { title: string; description: (label: string) => string; confirmLabel: string; nextStatus?: SemesterStatus }
> = {
  open: {
    title: "Open Pre-Enrollment",
    description: (l) =>
      `Opening "${l}" allows students to submit pre-enrollment requests for courses in this semester.`,
    confirmLabel: "Open Pre-Enrollment",
    nextStatus: "pre_enrollment",
  },
  activate: {
    title: "Activate Semester",
    description: (l) =>
      `Activating "${l}" will start the semester and convert pending pre-enrollments to enrollments.`,
    confirmLabel: "Activate",
    nextStatus: "active",
  },
  end: {
    title: "End Semester",
    description: (l) =>
      `Ending "${l}" will close all enrollments and lock grades for this semester. This cannot be undone.`,
    confirmLabel: "End Semester",
    nextStatus: "ended",
  },
  delete: {
    title: "Delete Semester",
    description: (l) =>
      `Are you sure you want to delete "${l}"? This cannot be undone.`,
    confirmLabel: "Delete",
  },
}

export function SemesterListView({
  academicYear,
  semesters,
}: {
  academicYear: { id: string; label: string }
  semesters: Semester[]
}) {
  const [pendingAction, setPendingAction] = useState<Action | null>(null)
  const [loading, setLoading] = useState(false)

  const targetSem = pendingAction
    ? semesters.find((s) => s.id === pendingAction.semId)
    : null
  const meta = pendingAction ? ACTION_META[pendingAction.type] : null

  async function confirmAction() {
    if (!pendingAction || !targetSem) return
    setLoading(true)
    try {
      if (pendingAction.type === "delete") {
        const res = await fetch(`/api/admin/semesters/${pendingAction.semId}`, {
          method: "DELETE",
        })
        if (!res.ok) {
          const d = await res.json()
          throw new Error(d.error)
        }
        toast.success("Semester deleted")
      } else {
        const nextStatus = ACTION_META[pendingAction.type].nextStatus!
        const res = await fetch(`/api/admin/semesters/${pendingAction.semId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        })
        if (!res.ok) {
          const d = await res.json()
          throw new Error(d.error)
        }
        toast.success(
          pendingAction.type === "open"
            ? "Pre-enrollment opened"
            : pendingAction.type === "activate"
            ? "Semester activated"
            : "Semester ended"
        )
      }
      setPendingAction(null)
      await mutate(`/api/admin/semesters?yearId=${academicYear.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed")
    } finally {
      setLoading(false)
    }
  }

  if (semesters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-foreground">No semesters found</p>
        <p className="text-xs text-muted-foreground mt-1">
          Semesters are created automatically when an academic year is created.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {semesters.map((sem) => (
          <SemesterCard
            key={sem.id}
            sem={sem}
            academicYearId={academicYear.id}
            onAction={setPendingAction}
          />
        ))}
      </div>

      <ConfirmModal
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={meta?.title ?? ""}
        description={
          meta && targetSem
            ? meta.description(semesterLabel(targetSem.term))
            : ""
        }
        confirmLabel={meta?.confirmLabel ?? "Confirm"}
        variant={pendingAction?.type === "delete" ? "destructive" : "default"}
        onConfirm={confirmAction}
        loading={loading}
      />
    </>
  )
}

function SemesterCard({
  sem,
  academicYearId,
  onAction,
}: {
  sem: Semester
  academicYearId: string
  onAction: (a: Action) => void
}) {
  const status = sem.status as SemesterStatus

  return (
    <div
      className={cn(
        "rounded-lg border bg-card flex flex-col transition-shadow hover:shadow-md group",
        status === "active" && "border-primary/40"
      )}
    >
      {/* Clickable body → semester detail */}
      <Link
        href={`/admin/${academicYearId}/${sem.id}`}
        className="p-5 flex-1 flex flex-col gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-t-lg"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">
            {semesterLabel(sem.term)}
          </h3>
          <Badge
            variant={STATUS_BADGE[status] ?? "outline"}
            className="capitalize shrink-0 text-[11px]"
          >
            {STATUS_LABEL[status] ?? status}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {new Date(sem.created_at).toLocaleDateString()}
          </span>
          <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </Link>

      {/* Action bar */}
      <div className="flex items-center gap-1 px-4 pb-3 pt-2 border-t">
        {status === "draft" && (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.preventDefault()
                onAction({ semId: sem.id, type: "delete" })
              }}
            >
              <Trash2 className="size-3 mr-1" />
              Delete
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs ml-auto"
              onClick={(e) => {
                e.preventDefault()
                onAction({ semId: sem.id, type: "open" })
              }}
            >
              <BookOpen className="size-3 mr-1" />
              Open Pre-Enrollment
            </Button>
          </>
        )}

        {status === "pre_enrollment" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs ml-auto"
            onClick={(e) => {
              e.preventDefault()
              onAction({ semId: sem.id, type: "activate" })
            }}
          >
            <Zap className="size-3 mr-1" />
            Activate
          </Button>
        )}

        {status === "active" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs text-destructive hover:text-destructive ml-auto"
            onClick={(e) => {
              e.preventDefault()
              onAction({ semId: sem.id, type: "end" })
            }}
          >
            <StopCircle className="size-3 mr-1" />
            End Semester
          </Button>
        )}

        {status === "ended" && (
          <span className="text-xs text-muted-foreground ml-auto">Semester ended</span>
        )}
      </div>
    </div>
  )
}
