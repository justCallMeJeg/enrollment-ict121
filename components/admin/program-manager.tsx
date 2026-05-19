"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Combobox } from "@/components/shared/combobox"
import { DataTable } from "@/components/shared/data-table"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { FormModal } from "@/components/shared/form-modal"
import { TableToolbar } from "@/components/shared/table-toolbar"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { IconButton } from "@/components/shared/icon-button"
import { toast } from "sonner"
import type { Department } from "@/types"

type Program = {
  id: string
  name: string
  code: string
  department_id: string
  years_to_complete: number
  departments: { name: string; code: string } | null
}

const INIT_FORM = { name: "", code: "", department_id: "", years_to_complete: "4" }

export function ProgramManager({
  programs,
  departments,
}: {
  programs: Program[]
  departments: Pick<Department, "id" | "name" | "code">[]
}) {
  const router = useRouter()
  const [form, setForm] = useState(INIT_FORM)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState("")
  const [filterDept, setFilterDept] = useState<string[]>([])

  const filtered = useMemo(() => {
    return programs.filter((p) => {
      const matchesSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase())
      const matchesDept =
        filterDept.length === 0 || filterDept.includes(p.department_id)
      return matchesSearch && matchesDept
    })
  }, [programs, search, filterDept])

  function set(key: string, value: string) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  function openCreate() {
    setForm(INIT_FORM)
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEdit(row: Program) {
    setForm({
      name: row.name,
      code: row.code,
      department_id: row.department_id,
      years_to_complete: String(row.years_to_complete),
    })
    setEditTarget(row.id)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditTarget(null)
    setForm(INIT_FORM)
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editTarget ? `/api/admin/programs/${editTarget}` : "/api/admin/programs"
      const method = editTarget ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, years_to_complete: Number(form.years_to_complete) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(editTarget ? "Program updated" : "Program created")
      closeModal()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save program")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/programs/${deleteTarget}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      toast.success("Program deleted")
      setDeleteTarget(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete program")
    } finally {
      setDeleting(false)
    }
  }

  const deptOptions = departments.map((d) => ({ label: d.name, value: d.id }))

  return (
    <div>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search programs…"
        filters={[
          {
            key: "department",
            label: "Department",
            options: deptOptions,
            selected: filterDept,
            onApply: setFilterDept,
          },
        ]}
        resultCount={filtered.length}
        totalCount={programs.length}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4 mr-2" />
            Add Program
          </Button>
        }
      />

      <DataTable
        keyField="id"
        data={filtered as unknown as Record<string, unknown>[]}
        columns={[
          {
            key: "department",
            header: "Department",
            render: (row) => {
              const p = row as unknown as Program
              return p.departments?.code ?? "—"
            },
          },
          { key: "name", header: "Program Name" },
          { key: "code", header: "Code" },
          { key: "years_to_complete", header: "Years" },
          {
            key: "actions",
            header: "",
            render: (row) => {
              const p = row as unknown as Program
              return (
                <div className="flex gap-1 justify-end">
                  <IconButton tooltip="Edit" className="hover:text-foreground" onClick={() => openEdit(p)}>
                    <Pencil className="size-3.5" />
                  </IconButton>
                  <IconButton tooltip="Delete" className="hover:text-destructive" onClick={() => setDeleteTarget(p.id)}>
                    <Trash2 className="size-3.5" />
                  </IconButton>
                </div>
              )
            },
          },
        ]}
        emptyTitle={search || filterDept.length > 0 ? "No programs match your filters" : "No programs yet"}
        emptyDescription={search || filterDept.length > 0 ? "Try adjusting your search or filter" : "Add your first program using the button above"}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(o) => { if (!o) closeModal(); else setModalOpen(true) }}
        title={editTarget ? "Edit Program" : "Add Program"}
        onSubmit={handleSubmit}
        submitLabel={editTarget ? "Save Changes" : "Create Program"}
        loading={loading}
      >
        <div className="space-y-2">
          <Label>Department</Label>
          <Combobox
            options={departments.map((d) => ({ value: d.id, label: d.name, code: d.code }))}
            value={form.department_id}
            onValueChange={(v) => set("department_id", v)}
            placeholder="Select a department"
            searchPlaceholder="Search departments…"
            emptyText="No departments found."
          />
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
          <div className="space-y-2">
            <Label htmlFor="prog-name">Program Name</Label>
            <Input
              id="prog-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Bachelor of Science in Computer Science"
              required
            />
          </div>
          <div className="space-y-2 w-24">
            <Label htmlFor="prog-code">Code</Label>
            <Input
              id="prog-code"
              value={form.code}
              onChange={(e) => set("code", e.target.value)}
              placeholder="e.g. BSCS"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Years to Complete</Label>
          <Select value={form.years_to_complete} onValueChange={(v) => set("years_to_complete", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {[2, 3, 4, 5, 6].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y} years
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FormModal>

      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Program"
        description="Are you sure? All courses under this program will also be deleted."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
