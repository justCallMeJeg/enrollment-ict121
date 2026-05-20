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
import { Combobox } from "@/components/shared/combobox"
import { Badge } from "@/components/ui/badge"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { IconButton } from "@/components/shared/icon-button"
import { toast } from "sonner"
import type { Program, SemesterTerm } from "@/types"

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
  program_id: string | null
  professor_id: string | null
  prerequisite_course_id: string | null
  programs: { name: string; code: string } | null
  professors: { faculty_id: string; users: { name: string } | null } | null
  prerequisite: { course_code: string; name: string } | null
}

const SEMESTERS = ["1st", "2nd", "midyear"]

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
  defaultTermFilter,
}: {
  courses: CourseRow[]
  programs: Pick<Program, "id" | "name" | "code">[]
  professors: ProfessorOption[]
  academicYearId: string
  defaultTermFilter?: SemesterTerm
}) {
  const router = useRouter()
  const [form, setForm] = useState(INIT_FORM)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState("")
  const [filterSemester, setFilterSemester] = useState<string[]>(
    defaultTermFilter ? [defaultTermFilter] : []
  )
  const [filterYear, setFilterYear] = useState<string[]>([])
  const [filterProgram, setFilterProgram] = useState<string[]>([])

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        !search.trim() ||
        c.course_code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
      const matchesSemester =
        filterSemester.length === 0 || filterSemester.includes(c.semester)
      const matchesYear =
        filterYear.length === 0 || filterYear.includes(String(c.year_level))
      const matchesProgram =
        filterProgram.length === 0 || c.program_id === null || filterProgram.includes(c.program_id)
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
      program_id: row.program_id ?? "",
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
        program_id: form.program_id || null,
        professor_id: form.professor_id || null,
        prerequisite_course_id: form.prerequisite_course_id || null,
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

  const hasFilters =
    search ||
    filterSemester.length > 0 ||
    filterYear.length > 0 ||
    filterProgram.length > 0

  // Combobox options
  const professorOptions = professors.map((p) => {
    const pUser = Array.isArray(p.users) ? p.users[0] : p.users
    return { value: p.user_id, label: pUser?.name ?? p.faculty_id, code: p.faculty_id }
  })

  const prerequisiteOptions = courses
    .filter((c) => c.id !== editTarget)
    .map((c) => ({ value: c.id, label: c.name, code: c.course_code }))

  return (
    <div>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search courses…"
        filters={[
          {
            key: "semester",
            label: "Semester",
            options: SEMESTERS.map((s) => ({
              label: s === "midyear" ? "Midyear Semester" : `${s} Semester`,
              value: s,
            })),
            selected: filterSemester,
            onApply: setFilterSemester,
          },
          {
            key: "year",
            label: "Year",
            options: [1, 2, 3, 4, 5, 6].map((y) => ({ label: `Year ${y}`, value: String(y) })),
            selected: filterYear,
            onApply: setFilterYear,
          },
          {
            key: "program",
            label: "Program",
            options: programs.map((p) => ({ label: p.name, value: p.id })),
            selected: filterProgram,
            onApply: setFilterProgram,
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
            <Label htmlFor="course_code">Course Code <span className="text-destructive">*</span></Label>
            <Input
              id="course_code"
              value={form.course_code}
              onChange={(e) => set("course_code", e.target.value)}
              placeholder="e.g. CS101"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course_name">Course Name <span className="text-destructive">*</span></Label>
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
            <Label>Program <span className="text-xs text-muted-foreground font-normal">(optional — leave blank for all programs)</span></Label>
            <Combobox
              options={programs.map((p) => ({ value: p.id, label: p.name, code: p.code }))}
              value={form.program_id}
              onValueChange={(v) => set("program_id", v)}
              placeholder="All programs"
              searchPlaceholder="Search programs…"
              emptyText="No programs found."
              clearable
            />
          </div>
          <div className="space-y-2">
            <Label>Professor</Label>
            <Combobox
              options={professorOptions}
              value={form.professor_id}
              onValueChange={(v) => set("professor_id", v)}
              placeholder="Select professor (optional)"
              searchPlaceholder="Search professors…"
              emptyText="No professors found."
              clearable
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Semester <span className="text-destructive">*</span></Label>
            <Select value={form.semester} onValueChange={(v) => set("semester", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {SEMESTERS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "midyear" ? "Midyear Semester" : `${s} Semester`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Year Level <span className="text-destructive">*</span></Label>
            <Select value={form.year_level} onValueChange={(v) => set("year_level", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {[1, 2, 3, 4, 5, 6].map((y) => (
                  <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="units">Units <span className="text-destructive">*</span></Label>
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
          <Combobox
            options={prerequisiteOptions}
            value={form.prerequisite_course_id}
            onValueChange={(v) => set("prerequisite_course_id", v)}
            placeholder="None (no prerequisite)"
            searchPlaceholder="Search courses…"
            emptyText="No courses found."
            clearable
          />
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
