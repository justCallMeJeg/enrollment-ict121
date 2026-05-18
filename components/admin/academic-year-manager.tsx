"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { DataTable } from "@/components/shared/data-table"
import type { AcademicYear } from "@/types"
import { Plus, Zap } from "lucide-react"
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
  const [activateTarget, setActivateTarget] = useState<AcademicYear | null>(null)
  const [activating, setActivating] = useState(false)

  const upcoming = years.find((y) => y.status === "upcoming")

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch("/api/admin/academic-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Academic year created")
      setLabel("")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create")
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create Upcoming Academic Year</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                placeholder="e.g. 2025-2026 1st Semester"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
                disabled={!!upcoming}
              />
            </div>
            <Button type="submit" disabled={creating || !!upcoming}>
              <Plus className="size-4 mr-2" />
              Create
            </Button>
          </form>
          {upcoming && (
            <p className="text-xs text-muted-foreground mt-2">
              There is already an upcoming year. Activate it before creating another.
            </p>
          )}
        </CardContent>
      </Card>

      <DataTable
        keyField="id"
        data={years as unknown as Record<string, unknown>[]}
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
              if (year.status !== "upcoming") return null
              return (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActivateTarget(year)}
                >
                  <Zap className="size-3 mr-1" />
                  Activate
                </Button>
              )
            },
          },
        ]}
        emptyTitle="No academic years"
        emptyDescription="Create your first academic year above"
      />

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
