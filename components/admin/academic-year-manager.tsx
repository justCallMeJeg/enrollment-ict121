"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { FormModal } from "@/components/shared/form-modal"
import { FilterDropdown } from "@/components/shared/filter-dropdown"
import { SortMenu } from "@/components/shared/sort-menu"
import type { AcademicYear } from "@/types"
import { ChevronRight, Pencil, Plus, Search, Trash2, X } from "lucide-react"
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

export function AcademicYearManager({
  years,
  semesterCounts = {},
}: {
  years: AcademicYear[]
  semesterCounts?: Record<string, number>
}) {
  const [saving, setSaving] = useState(false)
  const [editTarget, setEditTarget] = useState<AcademicYear | null>(null)
  const [editLabel, setEditLabel] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<AcademicYear | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("created_at")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let result = years.filter((y) => {
      const matchesSearch = !q || y.label.toLowerCase().includes(q)
      const matchesStatus =
        filterStatus.length === 0 || filterStatus.includes(y.status)
      return matchesSearch && matchesStatus
    })

    result = [...result].sort((a, b) => {
      const cmp =
        sortBy === "label"
          ? a.label.localeCompare(b.label)
          : a.created_at.localeCompare(b.created_at)
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [years, search, filterStatus, sortBy, sortDir])

  function openEdit(year: AcademicYear) {
    setEditLabel(year.label)
    setEditTarget(year)
  }

  function closeEdit() {
    setEditTarget(null)
    setEditLabel("")
  }

  async function handleEditSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!editTarget || !editLabel.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/academic-years/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editLabel.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Academic year updated")
      closeEdit()
      await mutate("/api/admin/academic-years")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/academic-years/${deleteTarget.id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      await mutate("/api/admin/academic-years")
      toast.success("Academic year deleted")
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setDeleting(false)
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

        <Button size="sm" asChild>
          <Link href="/admin/academic-years/new">
            <Plus className="size-4 mr-2" />
            Add Academic Year
          </Link>
        </Button>
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
            {hasFilters ? "No academic years match your filters" : "No academic years"}
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
              semesterCount={semesterCounts[year.id] ?? 0}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Edit label modal */}
      <FormModal
        open={!!editTarget}
        onOpenChange={(o) => { if (!o) closeEdit() }}
        title="Edit Academic Year"
        onSubmit={handleEditSubmit}
        submitLabel="Save Changes"
        loading={saving}
      >
        <div className="space-y-2">
          <Label htmlFor="ay-label">
            Label <span className="text-destructive">*</span>
          </Label>
          <Input
            id="ay-label"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            placeholder="e.g. 2024-2025"
            required
          />
        </div>
      </FormModal>

      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Academic Year"
        description={`Are you sure you want to delete "${deleteTarget?.label}"? All courses and semesters under this year will also be deleted.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}

function YearCard({
  year,
  semesterCount,
  onEdit,
  onDelete,
}: {
  year: AcademicYear
  semesterCount: number
  onEdit: (year: AcademicYear) => void
  onDelete: (year: AcademicYear) => void
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card flex flex-col transition-shadow hover:shadow-md group",
        year.status === "active" && "border-primary/40"
      )}
    >
      {/* Clickable card body → AY detail page */}
      <Link
        href={`/admin/${year.id}`}
        className="p-5 flex-1 flex flex-col gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-t-lg"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">
            {year.label}
          </h3>
          <Badge
            variant={STATUS_BADGE[year.status] ?? "outline"}
            className="capitalize shrink-0 text-[11px]"
          >
            {year.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          {semesterCount > 0 ? (
            <span className="text-xs text-muted-foreground">
              {semesterCount} semester{semesterCount !== 1 ? "s" : ""}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">No semesters</span>
          )}
          <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </Link>

      {/* Action bar below card body */}
      <div className="flex items-center gap-1 px-4 pb-3 pt-2 border-t">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={(e) => { e.preventDefault(); onEdit(year) }}
        >
          <Pencil className="size-3 mr-1" />
          Edit
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
          onClick={(e) => { e.preventDefault(); onDelete(year) }}
        >
          <Trash2 className="size-3 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  )
}
