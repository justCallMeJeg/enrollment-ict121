"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTable } from "@/components/shared/data-table"
import type { Column } from "@/components/shared/data-table"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { FormModal } from "@/components/shared/form-modal"
import { TableToolbar } from "@/components/shared/table-toolbar"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { IconButton } from "@/components/shared/icon-button"
import { toast } from "sonner"

type Field = {
  key: string
  label: string
  required?: boolean
  placeholder?: string
  type?: string
}

type Props = {
  endpoint: string
  items: Record<string, unknown>[]
  fields: Field[]
  columns: Column<Record<string, unknown>>[]
  entityName: string
  searchKeys?: string[]
}

export function CrudManager({
  endpoint,
  items,
  fields,
  columns,
  entityName,
  searchKeys = ["name", "code"],
}: Props) {
  const router = useRouter()
  const [form, setForm] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter((item) =>
      searchKeys.some((k) => String(item[k] ?? "").toLowerCase().includes(q))
    )
  }, [items, search, searchKeys])

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function openCreate() {
    setForm({})
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEdit(row: Record<string, unknown>) {
    const prefill: Record<string, string> = {}
    for (const f of fields) {
      prefill[f.key] = String(row[f.key] ?? "")
    }
    setForm(prefill)
    setEditTarget(row.id as string)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditTarget(null)
    setForm({})
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editTarget ? `${endpoint}/${editTarget}` : endpoint
      const method = editTarget ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(editTarget ? `${entityName} updated` : `${entityName} created`)
      closeModal()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to save ${entityName}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`${endpoint}/${deleteTarget}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      toast.success(`${entityName} deleted`)
      setDeleteTarget(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to delete ${entityName}`)
    } finally {
      setDeleting(false)
    }
  }

  const columnsWithActions: Column<Record<string, unknown>>[] = [
    ...columns,
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex gap-1 justify-end">
          <IconButton tooltip="Edit" className="hover:text-foreground" onClick={() => openEdit(row)}>
            <Pencil className="size-3.5" />
          </IconButton>
          <IconButton tooltip="Delete" className="hover:text-destructive" onClick={() => setDeleteTarget(row.id as string)}>
            <Trash2 className="size-3.5" />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <div>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={`Search ${entityName.toLowerCase()}s…`}
        resultCount={filtered.length}
        totalCount={items.length}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4 mr-2" />
            Add {entityName}
          </Button>
        }
      />

      <DataTable
        keyField="id"
        data={filtered}
        columns={columnsWithActions}
        emptyTitle={search ? `No ${entityName.toLowerCase()}s match "${search}"` : `No ${entityName.toLowerCase()}s yet`}
        emptyDescription={search ? "Try a different search term" : `Add your first ${entityName.toLowerCase()} using the button above`}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(o) => { if (!o) closeModal(); else setModalOpen(true) }}
        title={editTarget ? `Edit ${entityName}` : `Add ${entityName}`}
        onSubmit={handleSubmit}
        submitLabel={editTarget ? "Save Changes" : `Create ${entityName}`}
        loading={loading}
      >
        {fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={`crud-${field.key}`}>{field.label}</Label>
            <Input
              id={`crud-${field.key}`}
              type={field.type ?? "text"}
              value={form[field.key] ?? ""}
              onChange={(e) => set(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        ))}
      </FormModal>

      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${entityName}`}
        description={`Are you sure you want to delete this ${entityName.toLowerCase()}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
