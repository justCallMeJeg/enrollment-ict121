"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { FormModal } from "@/components/shared/form-modal"
import { FilterDropdown } from "@/components/shared/filter-dropdown"
import { SortMenu } from "@/components/shared/sort-menu"
import type { AcademicYear } from "@/types"
import { BookOpen, Pencil, Plus, Search, X, Zap } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const STATUS_BADGE: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  upcoming: "secondary",
  draft: "outline",
  ended: "outline",
}

const STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Active", value: "active" },
  { label: "Ended", value: "ended" },
]

const SORT_OPTIONS = [
  { label: "Name", value: "label" },
  { label: "Creation date", value: "created_at" },
]

export function AcademicYearManager({ years }: { years: AcademicYear[] }) {
  const router = useRouter()
  const [label, setLabel] = useState("")
  const [creating, setCreating] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [activateTarget, setActivateTarget] = useState<AcademicYear | null>(null)
  const [activating, setActivating] = useState(false)
  const [openTarget, setOpenTarget] = useState<AcademicYear | null>(null)
  const [opening, setOpening] = useState(false)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("created_at")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const draft = years.find((y) => y.status === "draft")
  const upcoming = years.find((y) => y.status === "upcoming")
  const blocked = draft ?? upcoming

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let result = years.filter((y) => {
      const matchesSearch = !q || y.label.toLowerCase().includes(q)
      const matchesStatus =
        filterStatus.length === 0 || filterStatus.includes(y.status)
      return matchesSearch && matchesStatus
    })

    result = [...result].sort((a, b) => {
      let cmp = 0
      if (sortBy === "label") {
        cmp = a.label.localeCompare(b.label)
      } else {
        cmp = a.created_at.localeCompare(b.created_at)
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [years, search, filterStatus, sortBy, sortDir])

  function openCreate() {
    setLabel("")
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEdit(year: AcademicYear) {
    setLabel(year.label)
    setEditTarget(year.id)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditTarget(null)
    setLabel("")
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setCreating(true)
    try {
      const url = editTarget
        ? `/api/admin/academic-years/${editTarget}`
        : "/api/admin/academic-years"
      const method = editTarget ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(editTarget ? "Academic year updated" : "Academic year created")
      closeModal()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setCreating(false)
    }
  }

  async function handleOpen() {
    if (!openTarget) return
    setOpening(true)
    try {
      const res = await fetch(
        `/api/admin/academic-years/${openTarget.id}/open`,
        { method: "POST" }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Pre-enrollment opened")
      setOpenTarget(null)
      router.refresh()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to open pre-enrollment"
      )
    } finally {
      setOpening(false)
    }
  }

  async function handleActivate() {
    if (!activateTarget) return
    setActivating(true)
    try {
      const res = await fetch(
        `/api/admin/academic-years/${activateTarget.id}/activate`,
        { method: "POST" }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Academic year activated")
      setActivateTarget(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to activate")
    } finally {
      setActivating(false)
    }
  }

  const hasFilters = search || filterStatus.length > 0

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 h-9"
            placeholder="Search academic years…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <FilterDropdown
          label="Status"
          options={STATUS_OPTIONS}
          selected={filterStatus}
          onApply={setFilterStatus}
        />

        <SortMenu
          options={SORT_OPTIONS}
          sortBy={sortBy}
          direction={sortDir}
          onChange={(by, dir) => {
            setSortBy(by)
            setSortDir(dir)
          }}
        />

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2 text-muted-foreground"
            onClick={() => {
              setSearch("")
              setFilterStatus([])
            }}
          >
            <X className="size-3.5 mr-1" />
            Clear
          </Button>
        )}

        <div className="flex-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            {blocked ? (
              <span className="inline-flex" tabIndex={0}>
                <Button size="sm" disabled>
                  <Plus className="size-4 mr-2" />
                  Add Academic Year
                </Button>
              </span>
            ) : (
              <Button size="sm" onClick={openCreate}>
                <Plus className="size-4 mr-2" />
                Add Academic Year
              </Button>
            )}
          </TooltipTrigger>
          <TooltipContent sideOffset={4}>
            {blocked
              ? draft
                ? "A draft year already exists — open it for pre-enrollment first"
                : "Activate the upcoming year before creating another"
              : "Create a new draft academic year"}
          </TooltipContent>
        </Tooltip>
      </div>

      {hasFilters && (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {years.length} result
          {years.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium text-foreground">
            {hasFilters
              ? "No academic years match your filters"
              : "No academic years"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {hasFilters
              ? "Try adjusting your search or filter"
              : "Create your first academic year using the button above"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((year) => (
            <YearCard
              key={year.id}
              year={year}
              onEdit={openEdit}
              onOpen={setOpenTarget}
              onActivate={setActivateTarget}
            />
          ))}
        </div>
      )}

      <FormModal
        open={modalOpen}
        onOpenChange={(o) => {
          if (!o) closeModal()
          else setModalOpen(true)
        }}
        title={editTarget ? "Edit Academic Year" : "Add Academic Year"}
        onSubmit={handleSubmit}
        submitLabel={editTarget ? "Save Changes" : "Create Academic Year"}
        loading={creating}
      >
        <div className="space-y-2">
          <Label htmlFor="ay-label">Label</Label>
          <Input
            id="ay-label"
            placeholder="e.g. 2025-2026 1st Semester"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
        </div>
      </FormModal>

      <ConfirmModal
        open={!!openTarget}
        onOpenChange={(open) => !open && setOpenTarget(null)}
        title="Open Pre-Enrollment"
        description={`Opening "${openTarget?.label}" for pre-enrollment will allow students to select courses. You can activate the year once pre-enrollment is complete.`}
        confirmLabel="Open Pre-Enrollment"
        variant="default"
        onConfirm={handleOpen}
        loading={opening}
      />

      <ConfirmModal
        open={!!activateTarget}
        onOpenChange={(open) => !open && setActivateTarget(null)}
        title="Activate Academic Year"
        description={`Activating "${activateTarget?.label}" will end the current active year, convert all pending pre-enrollments to enrollments, and advance all students to the next year level. This cannot be undone.`}
        confirmLabel="Activate"
        variant="default"
        onConfirm={handleActivate}
        loading={activating}
      />
    </div>
  )
}

function YearCard({
  year,
  onEdit,
  onOpen,
  onActivate,
}: {
  year: AcademicYear
  onEdit: (year: AcademicYear) => void
  onOpen: (year: AcademicYear) => void
  onActivate: (year: AcademicYear) => void
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-5 flex flex-col gap-4 transition-shadow hover:shadow-md",
        year.status === "active" && "border-primary/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm leading-snug">{year.label}</h3>
        <Badge
          variant={STATUS_BADGE[year.status] ?? "outline"}
          className="capitalize shrink-0 text-[11px]"
        >
          {year.status}
        </Badge>
      </div>

      <div className="flex items-center gap-2 mt-auto pt-1 border-t">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onEdit(year)}
        >
          <Pencil className="size-3 mr-1" />
          Edit label
        </Button>

        {year.status === "draft" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs ml-auto"
                onClick={() => onOpen(year)}
              >
                <BookOpen className="size-3 mr-1" />
                Open Pre-Enrollment
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={4}>
              Allow students to pre-enroll for this academic year
            </TooltipContent>
          </Tooltip>
        )}

        {year.status === "upcoming" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs ml-auto"
                onClick={() => onActivate(year)}
              >
                <Zap className="size-3 mr-1" />
                Activate
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={4}>
              End the current active year and convert pre-enrollments to
              enrollments
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
