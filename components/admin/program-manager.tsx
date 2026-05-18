"use client"

import { useState } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/shared/data-table"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { Plus, Trash2 } from "lucide-react"
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

export function ProgramManager({
  programs,
  departments,
}: {
  programs: Program[]
  departments: Pick<Department, "id" | "name" | "code">[]
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    code: "",
    department_id: "",
    years_to_complete: "4",
  })
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  function set(key: string, value: string) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/admin/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, years_to_complete: Number(form.years_to_complete) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Program created")
      setForm({ name: "", code: "", department_id: "", years_to_complete: "4" })
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create")
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
      toast.error(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Program</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={form.department_id}
                  onValueChange={(v) => set("department_id", v)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.code} — {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="prog-code">Code</Label>
                <Input
                  id="prog-code"
                  value={form.code}
                  onChange={(e) => set("code", e.target.value)}
                  placeholder="e.g. BSCS"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Years to Complete</Label>
                <Select
                  value={form.years_to_complete}
                  onValueChange={(v) => set("years_to_complete", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6].map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y} years
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              <Plus className="size-4 mr-2" />
              {loading ? "Adding…" : "Add Program"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <DataTable
        keyField="id"
        data={programs as unknown as Record<string, unknown>[]}
        columns={[
          {
            key: "department",
            header: "Department",
            render: (row) => {
              const p = row as unknown as Program
              return p.departments ? `${p.departments.code}` : "—"
            },
          },
          { key: "name", header: "Program Name" },
          { key: "code", header: "Code" },
          { key: "years_to_complete", header: "Years" },
          {
            key: "actions",
            header: "",
            render: (row) => (
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteTarget((row as unknown as Program).id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            ),
          },
        ]}
        emptyTitle="No programs yet"
        emptyDescription="Add your first program above"
      />

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
