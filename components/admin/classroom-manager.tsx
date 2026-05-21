"use client"

import { useState, useMemo } from "react"
import { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTable } from "@/components/shared/data-table"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { FormModal } from "@/components/shared/form-modal"
import { TableToolbar } from "@/components/shared/table-toolbar"
import { Combobox } from "@/components/shared/combobox"
import { Badge } from "@/components/ui/badge"
import { Copy, Pencil, Plus, Trash2 } from "lucide-react"
import { IconButton } from "@/components/shared/icon-button"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ClassroomRow = {
  id: string
  section: string
  course_id: string
  professor_id: string | null
  academic_year_id: string
  semester_id: string
  courses: { id: string; course_code: string; name: string; semester: string } | { id: string; course_code: string; name: string; semester: string }[] | null
  professors: { faculty_id: string; users: { name: string } | { name: string }[] | null } | null
  enrolled_count: number
}

type CatalogCourse = {
  id: string
  course_code: string
  name: string
  semester: string
  year_level: number
}

type ProfessorOption = {
  user_id: string
  faculty_id: string
  users: { name: string }[] | { name: string } | null
}

type AcademicYear = {
  id: string
  label: string
}

const INIT_FORM = {
  course_id: "",
  professor_id: "",
  section: "",
}

function getCourse(classroom: ClassroomRow) {
  return Array.isArray(classroom.courses) ? classroom.courses[0] : classroom.courses
}

function getProfessor(classroom: ClassroomRow) {
  return classroom.professors ?? null
}

function getProfessorName(p: ClassroomRow["professors"]) {
  if (!p) return null
  const u = Array.isArray(p.users) ? p.users[0] : p.users
  return u?.name ?? p.faculty_id
}

export function ClassroomManager({
  classrooms,
  courses,
  professors,
  yearId,
  semId,
  years,
}: {
  classrooms: ClassroomRow[]
  courses: CatalogCourse[]
  professors: ProfessorOption[]
  yearId: string
  semId: string
  years: AcademicYear[]
}) {
  const [form, setForm] = useState(INIT_FORM)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState("")

  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [copyFromYearId, setCopyFromYearId] = useState("")
  const [copying, setCopying] = useState(false)

  const swrKey = `/api/admin/classrooms?yearId=${yearId}&semId=${semId}`

  const filtered = useMemo(() => {
    if (!search.trim()) return classrooms
    const q = search.toLowerCase()
    return classrooms.filter((c) => {
      const course = getCourse(c)
      return (
        course?.course_code.toLowerCase().includes(q) ||
        course?.name.toLowerCase().includes(q) ||
        c.section.toLowerCase().includes(q) ||
        getProfessorName(getProfessor(c))?.toLowerCase().includes(q)
      )
    })
  }, [classrooms, search])

  function set(key: string, value: string) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  function openCreate() {
    setForm(INIT_FORM)
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEdit(row: ClassroomRow) {
    const course = getCourse(row)
    setForm({
      course_id: course?.id ?? "",
      professor_id: row.professor_id ?? "",
      section: row.section,
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
      const isEdit = !!editTarget
      const body = isEdit
        ? { professor_id: form.professor_id || null, section: form.section }
        : {
            course_id: form.course_id,
            academic_year_id: yearId,
            semester_id: semId,
            professor_id: form.professor_id || null,
            section: form.section,
          }

      const url = isEdit ? `/api/admin/classrooms/${editTarget}` : "/api/admin/classrooms"
      const method = isEdit ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(isEdit ? "Classroom updated" : "Classroom created")
      closeModal()
      await mutate(swrKey)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save classroom")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/classrooms/${deleteTarget}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      toast.success("Classroom deleted")
      setDeleteTarget(null)
      await mutate(swrKey)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  async function handleCopy() {
    if (!copyFromYearId) return
    setCopying(true)
    try {
      const res = await fetch("/api/admin/classrooms/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromYearId: copyFromYearId, toYearId: yearId, toSemesterId: semId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(
        data.copied === 0
          ? "No classrooms found to copy from that year"
          : `Copied ${data.copied} classroom${data.copied !== 1 ? "s" : ""}`
      )
      setCopyModalOpen(false)
      setCopyFromYearId("")
      await mutate(swrKey)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to copy classrooms")
    } finally {
      setCopying(false)
    }
  }

  const professorOptions = professors.map((p) => {
    const u = Array.isArray(p.users) ? p.users[0] : p.users
    return { value: p.user_id, label: u?.name ?? p.faculty_id, code: p.faculty_id }
  })

  const courseOptions = courses.map((c) => ({
    value: c.id,
    label: c.name,
    code: c.course_code,
  }))

  const otherYears = years.filter((y) => y.id !== yearId)

  return (
    <div>
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search classrooms…"
        filters={[]}
        resultCount={filtered.length}
        totalCount={classrooms.length}
        action={
          <div className="flex gap-2">
            {otherYears.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => setCopyModalOpen(true)}>
                <Copy className="size-4 mr-2" />
                Copy from Previous Year
              </Button>
            )}
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4 mr-2" />
              Add Classroom
            </Button>
          </div>
        }
      />

      <DataTable
        keyField="id"
        data={filtered as unknown as Record<string, unknown>[]}
        columns={[
          {
            key: "course_code",
            header: "Code",
            render: (row) => {
              const c = row as unknown as ClassroomRow
              const course = getCourse(c)
              return <span className="font-mono text-sm">{course?.course_code ?? "—"}</span>
            },
          },
          {
            key: "course_name",
            header: "Course Name",
            render: (row) => {
              const c = row as unknown as ClassroomRow
              return getCourse(c)?.name ?? "—"
            },
          },
          {
            key: "section",
            header: "Section",
            render: (row) => {
              const c = row as unknown as ClassroomRow
              return <Badge variant="outline">{c.section}</Badge>
            },
          },
          {
            key: "professor",
            header: "Professor",
            render: (row) => {
              const c = row as unknown as ClassroomRow
              const name = getProfessorName(getProfessor(c))
              return name ? (
                <span>{name}</span>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )
            },
          },
          {
            key: "enrolled_count",
            header: "Enrolled",
            render: (row) => {
              const c = row as unknown as ClassroomRow
              return (
                <span className="tabular-nums">
                  {c.enrolled_count}
                </span>
              )
            },
          },
          {
            key: "actions",
            header: "",
            render: (row) => {
              const c = row as unknown as ClassroomRow
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
        emptyTitle={search ? "No classrooms match your search" : "No classrooms yet"}
        emptyDescription={
          search
            ? "Try adjusting your search"
            : "Add a classroom or copy from a previous year to get started"
        }
      />

      {/* Create / Edit modal */}
      <FormModal
        open={modalOpen}
        onOpenChange={(o) => { if (!o) closeModal(); else setModalOpen(true) }}
        title={editTarget ? "Edit Classroom" : "Add Classroom"}
        onSubmit={handleSubmit}
        submitLabel={editTarget ? "Save Changes" : "Create Classroom"}
        loading={loading}
      >
        <div className="space-y-2">
          <Label>Course <span className="text-destructive">*</span></Label>
          <Combobox
            options={courseOptions}
            value={form.course_id}
            onValueChange={(v) => set("course_id", v)}
            placeholder="Select a course…"
            searchPlaceholder="Search courses…"
            emptyText="No courses found."
            disabled={!!editTarget}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="section">
            Section <span className="text-destructive">*</span>
          </Label>
          <Input
            id="section"
            value={form.section}
            onChange={(e) => set("section", e.target.value)}
            placeholder="e.g. A, BSIT-3A"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Professor <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
          <Combobox
            options={professorOptions}
            value={form.professor_id}
            onValueChange={(v) => set("professor_id", v)}
            placeholder="Assign professor (optional)"
            searchPlaceholder="Search professors…"
            emptyText="No professors found."
            clearable
          />
        </div>
      </FormModal>

      {/* Copy from previous year modal */}
      <Dialog open={copyModalOpen} onOpenChange={(o) => { if (!o && !copying) { setCopyModalOpen(false); setCopyFromYearId("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy from Previous Year</DialogTitle>
            <DialogDescription>
              Copies classrooms with the same semester term from the selected year. Professor assignments are cleared.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Source Academic Year</Label>
            <Combobox
              options={otherYears.map((y) => ({ value: y.id, label: y.label }))}
              value={copyFromYearId}
              onValueChange={setCopyFromYearId}
              placeholder="Select a year…"
              searchPlaceholder="Search years…"
              emptyText="No other years found."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setCopyModalOpen(false); setCopyFromYearId("") }}
              disabled={copying}
            >
              Cancel
            </Button>
            <Button onClick={handleCopy} disabled={!copyFromYearId || copying}>
              {copying ? "Copying…" : "Copy Classrooms"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Classroom"
        description="Are you sure? This will also remove all enrollments and grades for students in this classroom."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
