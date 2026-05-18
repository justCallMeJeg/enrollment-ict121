"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/shared/data-table"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import type { Column } from "@/components/shared/data-table"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

type Field = {
  key: string
  label: string
  required?: boolean
  placeholder?: string
  type?: string
  options?: { label: string; value: string }[]
}

type Props = {
  endpoint: string
  items: Record<string, unknown>[]
  fields: Field[]
  columns: Column<Record<string, unknown>>[]
  entityName: string
  extraData?: Record<string, unknown>
}

export function CrudManager({
  endpoint,
  items,
  fields,
  columns,
  entityName,
  extraData,
}: Props) {
  const router = useRouter()
  const [form, setForm] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...extraData }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${entityName} created`)
      setForm({})
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to create ${entityName}`)
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

  const columnsWithDelete: Column<Record<string, unknown>>[] = [
    ...columns,
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button
          size="icon"
          variant="ghost"
          className="size-8 text-muted-foreground hover:text-destructive"
          onClick={() => setDeleteTarget(row.id as string)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add {entityName}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    type={field.type ?? "text"}
                    value={form[field.key] ?? ""}
                    onChange={(e) => set(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                </div>
              ))}
            </div>
            <Button type="submit" disabled={loading}>
              <Plus className="size-4 mr-2" />
              {loading ? "Adding…" : `Add ${entityName}`}
            </Button>
          </form>
        </CardContent>
      </Card>

      <DataTable
        keyField="id"
        data={items}
        columns={columnsWithDelete}
        emptyTitle={`No ${entityName.toLowerCase()}s yet`}
        emptyDescription={`Add your first ${entityName.toLowerCase()} above`}
      />

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
