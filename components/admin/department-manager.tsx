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
import type { College } from "@/types"

type Department = {
  id: string
  name: string
  code: string
  college_id: string
  colleges: { name: string; code: string } | null
}

export function DepartmentManager({
  departments,
  colleges,
}: {
  departments: Department[]
  colleges: Pick<College, "id" | "name" | "code">[]
}) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [collegeId, setCollegeId] = useState("")
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, college_id: collegeId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Department created")
      setName("")
      setCode("")
      setCollegeId("")
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
      const res = await fetch(`/api/admin/departments/${deleteTarget}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      toast.success("Department deleted")
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
          <CardTitle className="text-base">Add Department</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>College</Label>
                <Select value={collegeId} onValueChange={setCollegeId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select college" />
                  </SelectTrigger>
                  <SelectContent>
                    {colleges.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-name">Department Name</Label>
                <Input
                  id="dept-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-code">Code</Label>
                <Input
                  id="dept-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. DCIT"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              <Plus className="size-4 mr-2" />
              {loading ? "Adding…" : "Add Department"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <DataTable
        keyField="id"
        data={departments as unknown as Record<string, unknown>[]}
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
            render: (row) => (
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteTarget((row as unknown as Department).id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            ),
          },
        ]}
        emptyTitle="No departments yet"
        emptyDescription="Add your first department above"
      />

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
