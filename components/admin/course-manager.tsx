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
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Program } from "@/types"

type ProfessorOption = {
  user_id: string
  faculty_id: string
  users: { name: string }[] | { name: string } | null
}

type CourseRow = {
  id: string
  course_code: string
  name: string
  semester: string
  units: number
  year_level: number
  program_id: string
  professor_id: string | null
  prerequisite_course_id: string | null
  programs: { name: string; code: string } | null
  professors: { faculty_id: string; users: { name: string } | null } | null
  prerequisite: { course_code: string; name: string } | null
}

const SEMESTERS = ["1st", "2nd", "summer"]

export function CourseManager({
  courses,
  programs,
  professors,
}: {
  courses: CourseRow[]
  programs: Pick<Program, "id" | "name" | "code">[]
  professors: ProfessorOption[]
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    program_id: "",
    professor_id: "",
    course_code: "",
    name: "",
    semester: "1st",
    units: "3",
    year_level: "1",
    prerequisite_course_id: "",
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
      const body = {
        ...form,
        units: Number(form.units),
        year_level: Number(form.year_level),
        professor_id: form.professor_id || null,
        prerequisite_course_id: form.prerequisite_course_id && form.prerequisite_course_id !== "none" ? form.prerequisite_course_id : null,
      }
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Course created")
      setForm({
        program_id: "",
        professor_id: "",
        course_code: "",
        name: "",
        semester: "1st",
        units: "3",
        year_level: "1",
        prerequisite_course_id: "",
      })
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create course")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/courses/${deleteTarget}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      toast.success("Course deleted")
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
          <CardTitle className="text-base">Add Course</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course_code">Course Code</Label>
                <Input
                  id="course_code"
                  value={form.course_code}
                  onChange={(e) => set("course_code", e.target.value)}
                  placeholder="e.g. CS101"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course_name">Course Name</Label>
                <Input
                  id="course_name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Introduction to Computing"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Program</Label>
                <Select value={form.program_id} onValueChange={(v) => set("program_id", v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Professor</Label>
                <Select value={form.professor_id} onValueChange={(v) => set("professor_id", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select professor (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {professors.map((p) => {
                      const pUser = Array.isArray(p.users) ? p.users[0] : p.users
                      return (
                        <SelectItem key={p.user_id} value={p.user_id}>
                          {pUser?.name ?? p.faculty_id}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select value={form.semester} onValueChange={(v) => set("semester", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEMESTERS.map((s) => (
                      <SelectItem key={s} value={s}>{s} Semester</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year Level</Label>
                <Select value={form.year_level} onValueChange={(v) => set("year_level", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((y) => (
                      <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="units">Units</Label>
                <Input
                  id="units"
                  type="number"
                  min={1}
                  max={9}
                  value={form.units}
                  onChange={(e) => set("units", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Prerequisite Course</Label>
                <Select
                  value={form.prerequisite_course_id}
                  onValueChange={(v) => set("prerequisite_course_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (no prerequisite)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.course_code} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              <Plus className="size-4 mr-2" />
              {loading ? "Adding…" : "Add Course"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <DataTable
        keyField="id"
        data={courses as unknown as Record<string, unknown>[]}
        columns={[
          { key: "course_code", header: "Code" },
          { key: "name", header: "Course Name" },
          {
            key: "semester",
            header: "Semester",
            render: (row) => {
              const c = row as unknown as CourseRow
              return <Badge variant="outline">{c.semester}</Badge>
            },
          },
          { key: "year_level", header: "Year" },
          { key: "units", header: "Units" },
          {
            key: "professor",
            header: "Professor",
            render: (row) => {
              const c = row as unknown as CourseRow
              if (!c.professors) return <span className="text-muted-foreground">—</span>
              const pUser = Array.isArray(c.professors.users) ? c.professors.users[0] : c.professors.users
              return pUser?.name ?? c.professors.faculty_id
            },
          },
          {
            key: "prerequisite",
            header: "Prerequisite",
            render: (row) => {
              const c = row as unknown as CourseRow
              if (!c.prerequisite) return <span className="text-muted-foreground">—</span>
              return <Badge variant="secondary">{c.prerequisite.course_code}</Badge>
            },
          },
          {
            key: "actions",
            header: "",
            render: (row) => (
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteTarget((row as unknown as CourseRow).id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            ),
          },
        ]}
        emptyTitle="No courses yet"
        emptyDescription="Add your first course above"
      />

      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Course"
        description="Are you sure? This will also remove all enrollments and grades for this course."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
