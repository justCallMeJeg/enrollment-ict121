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
import { DataTable } from "@/components/shared/data-table"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { FormModal } from "@/components/shared/form-modal"
import { TableToolbar } from "@/components/shared/table-toolbar"
import { Badge } from "@/components/ui/badge"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { IconButton } from "@/components/shared/icon-button"
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

const INIT_FORM = {
  program_id: "",
  professor_id: "",
  course_code: "",
  name: "",
  semester: "1st",
  units: "3",
  year_level: "1",
  prerequisite_course_id: "",
}

export function CourseManager({
  courses,
  programs,
  professors,
  academicYearId,
}: {
  courses: CourseRow[]
  programs: Pick<Program, "id" | "name" | "code">[]
  professors: ProfessorOption[]
  academicYearId: string
}) {
  const router = useRouter()
  const [form, setForm] = useState(INIT_FORM)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState("")
  const [filterSemester, setFilterSemester] = useState("all")
  const [filterYear, setFilterYear] = useState("all")
  const [filterProgram, setFilterProgram] = useState("all")

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        !search.trim() ||
        c.course_code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
      const matchesSemester = filterSemester === "all" || c.semester === filterSemester
      const matchesYear = filterYear === "all" || String(c.year_level) === filterYear
      const matchesProgram = filterProgram === "all" || c.program_id === filterProgram
      return matchesSearch && matchesSemester && matchesYear && matchesProgram
    })
  }, [courses, search, filterSemester, filterYear, filterProgram])

  function set(key: string, value: string) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  function openCreate() {
    setForm(INIT_FORM)
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEdit(row: CourseRow) {
    setForm({
      program_id: row.program_id,
      professor_id: row.professor_id ?? "",
      course_code: row.course_code,
      name: row.name,
      semester: row.semester,
      units: String(row.units),
      year_level: String(row.year_level),
      prerequisite_course_id: row.prerequisite_course_id ?? "",
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
      const body = {
        ...form,
        units: Number(form.units),
        year_level: Number(form.year_level),
        professor_id: form.professor_id || null,
        prerequisite_course_id:
          form.prerequisite_course_id && form.prerequisite_course_id !== "none"
            ? form.prerequisite_course_id
            : null,
        // Only include academic_year_id on create — PATCH ignores it
        ...(!editTarget && { academic_year_id: academicYearId }),
      }
      const url = editTarget ? `/api/admin/courses/${editTarget}` : "/api/admin/courses"
      const method = editTarget ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(editTarget ? "Course updated" : "Course created")
      closeModal()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save course")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/courses/${deleteTarget}`, { method: "DELETE" })
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

  const programOptions = programs.map((p) => ({ label: `${p.code} — ${p.name}`, value: p.id }))
  const hasFilters = search || filterSemester !== "all" || filterYear !== "all" || filterProgram !== "all"

  return (
    <div>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search courses…"
        filters={[
          {
            key: "semester",
            placeholder: "All Semesters",
            options: SEMESTERS.map((s) => ({ label: `${s} Semester`, value: s })),
            value: filterSemester,
            onChange: setFilterSemester,
          },
          {
            key: "year",
            placeholder: "All Years",
            options: [1, 2, 3, 4, 5, 6].map((y) => ({ label: `Year ${y}`, value: String(y) })),
            value: filterYear,
            onChange: setFilterYear,
          },
          {
            key: "program",
            placeholder: "All Programs",
            options: programOptions,
            value: filterProgram,
            onChange: setFilterProgram,
          },
        ]}
        resultCount={filtered.length}
        totalCount={courses.length}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4 mr-2" />
            Add Course
          </Button>
        }
      />

      <DataTable
        keyField="id"
        data={filtered as unknown as Record<string, unknown>[]}
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
            render: (row) => {
              const c = row as unknown as CourseRow
              return (
                <div className="flex gap-1 justify-end">
                  <IconButton tooltip="Edit" className="hover:text-foreground" onClick={() => openEdit(c)}>
                    <Pencil className="size-3.5" />
                  </IconButton>
                  <IconButton tooltip="Delete" className="hover:text-destructive" onClick={() => setDeleteTarget(c.id)}>
                    <Trash2 className="size-3.5" />
                  </IconButton>
                </div>
              )
            },
          },
        ]}
        emptyTitle={hasFilters ? "No courses match your filters" : "No courses yet"}
        emptyDescription={hasFilters ? "Try adjusting your search or filters" : "Add your first course using the button above"}
      />

      <FormModal
        open={modalOpen}
        onOpenChange={(o) => { if (!o) closeModal(); else setModalOpen(true) }}
        title={editTarget ? "Edit Course" : "Add Course"}
        onSubmit={handleSubmit}
        submitLabel={editTarget ? "Save Changes" : "Create Course"}
        loading={loading}
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
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
        </div>
        <div className="grid grid-cols-2 gap-4">
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
        </div>
        <div className="grid grid-cols-3 gap-4">
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
        </div>
        <div className="space-y-2">
          <Label>Prerequisite Course</Label>
          <Select
            value={form.prerequisite_course_id || "none"}
            onValueChange={(v) => set("prerequisite_course_id", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="None (no prerequisite)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {courses
                .filter((c) => c.id !== editTarget)
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.course_code} — {c.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </FormModal>

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
