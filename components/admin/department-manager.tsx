"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Combobox } from "@/components/shared/combobox"
import { DataTable } from "@/components/shared/data-table"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { FormModal } from "@/components/shared/form-modal"
import { TableToolbar } from "@/components/shared/table-toolbar"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { IconButton } from "@/components/shared/icon-button"
import { toast } from "sonner"
import type { College } from "@/types"

type Department = {
  id: string
  name: string
  code: string
  college_id: string
  colleges: { name: string; code: string } | null
}

const INIT_FORM = { name: "", code: "", college_id: "" }

export function DepartmentManager({
  departments,
  colleges,
}: {
  departments: Department[]
  colleges: Pick<College, "id" | "name" | "code">[]
}) {
  const router = useRouter()
  const [form, setForm] = useState(INIT_FORM)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState("")
  const [filterCollege, setFilterCollege] = useState<string[]>([])

  const filtered = useMemo(() => {
    return departments.filter((d) => {
      const matchesSearch =
        !search.trim() ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.code.toLowerCase().includes(search.toLowerCase())
      const matchesCollege =
        filterCollege.length === 0 || filterCollege.includes(d.college_id)
      return matchesSearch && matchesCollege
    })
  }, [departments, search, filterCollege])

  function set(key: string, value: string) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  function openCreate() {
    setForm(INIT_FORM)
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEdit(row: Department) {
    setForm({ name: row.name, code: row.code, college_id: row.college_id })
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
      const url = editTarget ? `/api/admin/departments/${editTarget}` : "/api/admin/departments"
      const method = editTarget ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(editTarget ? "Department updated" : "Department created")
      closeModal()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save department")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/departments/${deleteTarget}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      toast.success("Department deleted")
      setDeleteTarget(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete department")
    } finally {
      setDeleting(false)
    }
  }

  const collegeOptions = colleges.map((c) => ({ label: c.name, value: c.id }))

  return (
    <div>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search departments…"
        filters={[
          {
            key: "college",
            label: "College",
            options: collegeOptions,
            selected: filterCollege,
            onApply: setFilterCollege,
          },
        ]}
        resultCount={filtered.length}
        totalCount={departments.length}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4 mr-2" />
            Add Department
          </Button>
        }
      />

      <DataTable
        keyField="id"
        data={filtered as unknown as Record<string, unknown>[]}
        columns={[
          {
            key: "college",
            header: "College",
            render: (row) => {
              const d = row as unknown as Department
              return d.colleges ? `${d.colleges.code} — ${d.colleges.name}` : "—"
            },
          },
          { key: "name", header: "Name" },
          { key: "code", header: "Code" },
          {
            key: "actions",
            header: "",
            render: (row) => {
              const d = row as unknown as Department
              return (
                <div className="flex gap-1 justify-end">
                  <IconButton tooltip="Edit" className="hover:text-foreground" onClick={() => openEdit(d)}>
                    <Pencil className="size-3.5" />
                  </IconButton>
                  <IconButton tooltip="Delete" className="hover:text-destructive" onClick={() => setDeleteTarget(d.id)}>
                    <Trash2 className="size-3.5" />
                  </IconButton>
                </div>
              )
            },
          },
        ]}
        emptyTitle={search || filterCollege.length > 0 ? "No departments match your filters" : "No departments yet"}
        emptyDescription={search || filterCollege.length > 0 ? "Try adjusting your search or filter" : "Add your first department using the button above"}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(o) => { if (!o) closeModal(); else setModalOpen(true) }}
        title={editTarget ? "Edit Department" : "Add Department"}
        onSubmit={handleSubmit}
        submitLabel={editTarget ? "Save Changes" : "Create Department"}
        loading={loading}
      >
        <div className="space-y-2">
          <Label>College <span className="text-destructive">*</span></Label>
          <Combobox
            options={colleges.map((c) => ({ value: c.id, label: c.name, code: c.code }))}
            value={form.college_id}
            onValueChange={(v) => set("college_id", v)}
            placeholder="Select a college"
            searchPlaceholder="Search colleges…"
            emptyText="No colleges found."
          />
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
          <div className="space-y-2">
            <Label htmlFor="dept-name">Department Name <span className="text-destructive">*</span></Label>
            <Input
              id="dept-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Department of Computer and Information Technology"
              required
            />
          </div>
          <div className="space-y-2 w-28">
            <Label htmlFor="dept-code">Code <span className="text-destructive">*</span></Label>
            <Input
              id="dept-code"
              value={form.code}
              onChange={(e) => set("code", e.target.value)}
              placeholder="e.g. DCIT"
              required
            />
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Department"
        description="Are you sure? All programs under this department will also be deleted."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
