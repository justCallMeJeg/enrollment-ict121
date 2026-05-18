"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { FormModal } from "@/components/shared/form-modal"
import { TableToolbar } from "@/components/shared/table-toolbar"
import { DataTable } from "@/components/shared/data-table"
import type { AcademicYear } from "@/types"
import { Pencil, Plus, Zap } from "lucide-react"
import { toast } from "sonner"

const STATUS_BADGE: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  upcoming: "secondary",
  ended: "outline",
}

export function AcademicYearManager({ years }: { years: AcademicYear[] }) {
  const router = useRouter()
  const [label, setLabel] = useState("")
  const [creating, setCreating] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [activateTarget, setActivateTarget] = useState<AcademicYear | null>(null)
  const [activating, setActivating] = useState(false)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const upcoming = years.find((y) => y.status === "upcoming")

  const filtered = useMemo(() => {
    return years.filter((y) => {
      const matchesSearch = !search.trim() || y.label.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = filterStatus === "all" || y.status === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [years, search, filterStatus])

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

  const hasFilters = search || filterStatus !== "all"

  return (
    <div>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search academic years…"
        filters={[
          {
            key: "status",
            placeholder: "All Statuses",
            options: [
              { label: "Upcoming", value: "upcoming" },
              { label: "Active", value: "active" },
              { label: "Ended", value: "ended" },
            ],
            value: filterStatus,
            onChange: setFilterStatus,
          },
        ]}
        resultCount={filtered.length}
        totalCount={years.length}
        action={
          <Button
            size="sm"
            onClick={openCreate}
            disabled={!!upcoming}
            title={upcoming ? "Activate the upcoming year before creating another" : undefined}
          >
            <Plus className="size-4 mr-2" />
            Add Academic Year
          </Button>
        }
      />

      <DataTable
        keyField="id"
        data={filtered as unknown as Record<string, unknown>[]}
        columns={[
          { key: "label", header: "Label" },
          {
            key: "status",
            header: "Status",
            render: (row) => {
              const year = row as unknown as AcademicYear
              return (
                <Badge variant={STATUS_BADGE[year.status] ?? "outline"}>
                  {year.status}
                </Badge>
              )
            },
          },
          {
            key: "actions",
            header: "",
            render: (row) => {
              const year = row as unknown as AcademicYear
              return (
                <div className="flex gap-1 justify-end">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-muted-foreground hover:text-foreground"
                    onClick={() => openEdit(year)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  {year.status === "upcoming" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActivateTarget(year)}
                    >
                      <Zap className="size-3 mr-1" />
                      Activate
                    </Button>
                  )}
                </div>
              )
            },
          },
        ]}
        emptyTitle={hasFilters ? "No academic years match your filters" : "No academic years"}
        emptyDescription={hasFilters ? "Try adjusting your search or filter" : "Create your first academic year using the button above"}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(o) => { if (!o) closeModal(); else setModalOpen(true) }}
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
        open={!!activateTarget}
        onOpenChange={(open) => !open && setActivateTarget(null)}
        title="Activate Academic Year"
        description={`Activating "${activateTarget?.label}" will end the current active year and convert all pending pre-enrollments to enrollments. This cannot be undone.`}
        confirmLabel="Activate"
        variant="default"
        onConfirm={handleActivate}
        loading={activating}
      />
    </div>
  )
}
