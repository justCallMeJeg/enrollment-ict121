"use client"

import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { mutate as globalMutate } from "swr"
import { useAcademicYears } from "@/lib/hooks/use-academic-years"
import { useSemesters } from "@/lib/hooks/use-semesters"
import { useClassrooms } from "@/lib/hooks/use-classrooms"
import { useCourses } from "@/lib/hooks/use-courses"
import { useProfessors } from "@/lib/hooks/use-professors"
import { usePrograms } from "@/lib/hooks/use-programs"
import { PageHeader } from "@/components/shared/page-header"
import { DashboardSkeleton } from "@/components/shared/skeletons"
import { TableToolbar } from "@/components/shared/table-toolbar"
import { FormModal } from "@/components/shared/form-modal"
import { ConfirmModal } from "@/components/shared/confirm-modal"
import { Combobox } from "@/components/shared/combobox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BookOpen, ChevronLeft, Copy, Pencil, Plus, StopCircle, Trash2, Users, Zap } from "lucide-react"
import { toast } from "sonner"
import { semesterLabel } from "@/types"
import type { SemesterStatus, SemesterTerm } from "@/types"

const STATUS_LABEL: Record<SemesterStatus, string> = {
  draft: "Draft",
  pre_enrollment: "Open for Pre-Enrollment",
  active: "Active",
  ended: "Ended",
}

const STATUS_BADGE: Record<SemesterStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  pre_enrollment: "secondary",
  draft: "outline",
  ended: "outline",
}

type CourseShape = {
  id: string
  course_code: string
  name: string
  semester: string
  units: number
  year_level: number
  programs: { id: string; name: string; code: string }[]
}

type ClassroomRow = {
  id: string
  section: string
  course_id: string
  professor_id: string | null
  academic_year_id: string
  semester_id: string
  program_id: string
  year_level: number
  enrolled_count: number
  courses: { id: string; course_code: string; name: string; semester: string; units: number; year_level: number } | { id: string; course_code: string; name: string; semester: string; units: number; year_level: number }[] | null
  professors: { faculty_id: string; users: { name: string } | { name: string }[] | null } | null
  programs: { id: string; name: string; code: string } | { id: string; name: string; code: string }[] | null
}

type FormState = {
  course_id: string
  program_id: string
  year_level: string
  section: string
  professor_id: string
}

const INIT_FORM: FormState = { course_id: "", program_id: "", year_level: "1", section: "", professor_id: "" }

function getCourse(c: ClassroomRow) { return Array.isArray(c.courses) ? c.courses[0] : c.courses }
function getProgram(c: ClassroomRow) { return Array.isArray(c.programs) ? c.programs[0] : c.programs }
function getProfessorName(c: ClassroomRow) {
  if (!c.professors) return null
  const u = Array.isArray(c.professors.users) ? c.professors.users[0] : c.professors.users
  return u?.name ?? c.professors.faculty_id
}
function formatSection(prog: { code: string } | null | undefined, yearLevel: number, section: string) {
  if (!prog || !section) return section || "—"
  return `${prog.code}-${yearLevel}${section}`
}

export default function SemesterDetailPage() {
  const { yearId, semId } = useParams<{ yearId: string; semId: string }>()
  const { years, isLoading: yearsLoading } = useAcademicYears()
  const { semesters, isLoading: semsLoading, mutate: mutateSems } = useSemesters(yearId)
  const { classrooms, isLoading: classroomsLoading } = useClassrooms(yearId, semId)
  const { courses, isLoading: coursesLoading } = useCourses()
  const { professors, isLoading: profsLoading } = useProfessors()
  const { programs, isLoading: programsLoading } = usePrograms()

  const [search, setSearch] = useState("")
  const [filterProgram, setFilterProgram] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("course_code")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const [form, setForm] = useState<FormState>(INIT_FORM)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [copyFromYearId, setCopyFromYearId] = useState("")
  const [copying, setCopying] = useState(false)

  // Semester status CTA
  const [semAction, setSemAction] = useState<"open" | "activate" | "end" | null>(null)
  const [semActionLoading, setSemActionLoading] = useState(false)

  const swrKey = `/api/admin/classrooms?yearId=${yearId}&semId=${semId}`

  const programOptions = useMemo(
    () => programs.map((p: { id: string; name: string; code: string }) => ({ value: p.id, label: p.name, code: p.code })),
    [programs]
  )

  // Filter courses by the current semester term AND the selected program
  const courseOptions = useMemo(() => {
    const sem = (semesters as { id: string; term: string }[]).find((s) => s.id === semId)
    const semTerm = sem?.term

    let filtered = courses as unknown as CourseShape[]
    if (semTerm) {
      filtered = filtered.filter((c) => c.semester === semTerm)
    }
    if (form.program_id) {
      filtered = filtered.filter(
        (c) => c.programs.length === 0 || c.programs.some((p) => p.id === form.program_id)
      )
    }
    return filtered.map((c) => ({ value: c.id, label: c.name, code: c.course_code }))
  }, [courses, form.program_id, semesters, semId])

  const professorOptions = useMemo(
    () => professors.map((p: { user_id: string; faculty_id: string; users: { name: string } | { name: string }[] | null }) => {
      const u = Array.isArray(p.users) ? p.users[0] : p.users
      return { value: p.user_id, label: u?.name ?? p.faculty_id, code: p.faculty_id }
    }),
    [professors]
  )

  const uniquePrograms = useMemo(() => {
    const seen = new Set<string>()
    return (classrooms as unknown as ClassroomRow[]).flatMap((c) => {
      const prog = getProgram(c)
      if (!prog || seen.has(prog.id)) return []
      seen.add(prog.id)
      return [{ label: prog.name, value: prog.id }]
    })
  }, [classrooms])

  const filtered = useMemo(() => {
    let rows = classrooms as unknown as ClassroomRow[]
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter((c) => {
        const course = getCourse(c)
        const prog = getProgram(c)
        const section = formatSection(prog, c.year_level, c.section).toLowerCase()
        const profName = getProfessorName(c)?.toLowerCase() ?? ""
        return (
          course?.course_code.toLowerCase().includes(q) ||
          course?.name.toLowerCase().includes(q) ||
          section.includes(q) ||
          profName.includes(q)
        )
      })
    }
    if (filterProgram.length > 0) {
      rows = rows.filter((c) => filterProgram.includes(c.program_id))
    }
    return [...rows].sort((a, b) => {
      const ac = getCourse(a), bc = getCourse(b)
      let av: string | number = ac?.course_code ?? ""
      let bv: string | number = bc?.course_code ?? ""
      if (sortBy === "enrolled_count") { av = a.enrolled_count; bv = b.enrolled_count }
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
  }, [classrooms, search, filterProgram, sortBy, sortDir])

  const isLoading = yearsLoading || semsLoading || classroomsLoading || coursesLoading || profsLoading || programsLoading
  if (isLoading) return <DashboardSkeleton />

  const year = years.find((y: { id: string }) => y.id === yearId)
  const semester = semesters.find((s: { id: string }) => s.id === semId)
  if (!year || !semester) return null

  const term = semester.term as SemesterTerm
  const status = semester.status as SemesterStatus
  const title = `${year.label} — ${semesterLabel(term)}`

  const TERM_ORDER: Record<string, number> = { "1st": 0, "2nd": 1, midyear: 2 }
  const sortedSems = [...semesters].sort(
    (a: { term: string }, b: { term: string }) =>
      (TERM_ORDER[a.term] ?? 99) - (TERM_ORDER[b.term] ?? 99)
  )
  const semIdx = sortedSems.findIndex((s: { id: string }) => s.id === semId)
  const canOpenPreEnrollment = semIdx <= 0 || (sortedSems[semIdx - 1] as { status: string }).status === "ended"
  const otherYears = years.filter((y: { id: string }) => y.id !== yearId)

  const totalEnrolled = (classrooms as unknown as ClassroomRow[]).reduce((sum, c) => sum + c.enrolled_count, 0)
  const totalUnits = (classrooms as unknown as ClassroomRow[]).reduce((sum, c) => {
    const course = getCourse(c)
    return sum + (course?.units ?? 0)
  }, 0)

  const selectedProgram = programs.find((p: { id: string }) => p.id === form.program_id)
  const sectionPreview = selectedProgram && form.section
    ? formatSection(selectedProgram, Number(form.year_level), form.section)
    : null

  function openCreate() {
    setForm(INIT_FORM)
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEdit(c: ClassroomRow) {
    const course = getCourse(c)
    setForm({
      course_id: course?.id ?? "",
      program_id: c.program_id ?? "",
      year_level: String(c.year_level ?? 1),
      section: c.section,
      professor_id: c.professor_id ?? "",
    })
    setEditTarget(c.id)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditTarget(null)
    setForm(INIT_FORM)
  }

  function handleProgramChange(programId: string) {
    setForm((prev) => {
      const course = (courses as unknown as CourseShape[]).find((c) => c.id === prev.course_id)
      const courseStillValid =
        course &&
        (course.programs.length === 0 || course.programs.some((p) => p.id === programId))
      return {
        ...prev,
        program_id: programId,
        course_id: courseStillValid ? prev.course_id : "",
      }
    })
  }

  function handleCourseChange(courseId: string) {
    const course = (courses as unknown as CourseShape[]).find((c) => c.id === courseId)
    setForm((p) => ({ ...p, course_id: courseId, year_level: course ? String(course.year_level) : p.year_level }))
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    try {
      const isEdit = !!editTarget
      const body = isEdit
        ? { program_id: form.program_id || undefined, year_level: Number(form.year_level) || undefined, professor_id: form.professor_id || null, section: form.section }
        : { course_id: form.course_id, academic_year_id: yearId, semester_id: semId, program_id: form.program_id, year_level: Number(form.year_level), professor_id: form.professor_id || null, section: form.section }

      const url = isEdit ? `/api/admin/classrooms/${editTarget}` : "/api/admin/classrooms"
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(isEdit ? "Classroom updated" : "Classroom created")
      closeModal()
      await globalMutate(swrKey)
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
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success("Classroom deleted")
      setDeleteTarget(null)
      await globalMutate(swrKey)
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
      const res = await fetch("/api/admin/classrooms/copy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fromYearId: copyFromYearId, toYearId: yearId, toSemesterId: semId }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.copied === 0 ? "No classrooms found to copy" : `Copied ${data.copied} classroom${data.copied !== 1 ? "s" : ""}`)
      setCopyModalOpen(false)
      setCopyFromYearId("")
      await globalMutate(swrKey)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to copy classrooms")
    } finally {
      setCopying(false)
    }
  }

  async function handleSemesterAction() {
    if (!semAction) return
    setSemActionLoading(true)
    const nextStatus: SemesterStatus =
      semAction === "open" ? "pre_enrollment" :
      semAction === "activate" ? "active" : "ended"
    try {
      const res = await fetch(`/api/admin/semesters/${semId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(
        semAction === "open" ? "Pre-enrollment opened" :
        semAction === "activate" ? "Semester activated" : "Semester ended"
      )
      setSemAction(null)
      await mutateSems()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed")
    } finally {
      setSemActionLoading(false)
    }
  }

  const semActionMeta = semAction
    ? {
        open: {
          title: "Open Pre-Enrollment",
          description: `Opening pre-enrollment for ${semesterLabel(term)} allows students to submit course requests for this semester.`,
          confirmLabel: "Open Pre-Enrollment",
        },
        activate: {
          title: "Activate Semester",
          description: `Activating ${semesterLabel(term)} will start the semester and convert pending pre-enrollments to active enrollments.`,
          confirmLabel: "Activate",
        },
        end: {
          title: "End Semester",
          description: `Ending ${semesterLabel(term)} will close all enrollments and lock grades. This cannot be undone.`,
          confirmLabel: "End Semester",
        },
      }[semAction]
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-1">
        <Link href={`/admin/${yearId}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="size-3" />
          {year.label}
        </Link>
      </div>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <PageHeader title={title} description={`${STATUS_LABEL[status]} · Semester overview`} />
        </div>
        <div className="flex items-center gap-2 mt-1 shrink-0">
          <Badge variant={STATUS_BADGE[status]} className="capitalize text-xs">
            {STATUS_LABEL[status]}
          </Badge>
          {status === "draft" && canOpenPreEnrollment && (
            <Button size="sm" onClick={() => setSemAction("open")}>
              <BookOpen className="size-3.5 mr-1.5" />
              Open Pre-Enrollment
            </Button>
          )}
          {status === "pre_enrollment" && (
            <Button size="sm" onClick={() => setSemAction("activate")}>
              <Zap className="size-3.5 mr-1.5" />
              Activate Semester
            </Button>
          )}
          {status === "active" && (
            <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setSemAction("end")}>
              <StopCircle className="size-3.5 mr-1.5" />
              End Semester
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Classrooms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl leading-none">{(classrooms as unknown as ClassroomRow[]).length}</p>
            <p className="text-xs text-muted-foreground mt-1">sections</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Students Enrolled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl leading-none">{totalEnrolled}</p>
            <p className="text-xs text-muted-foreground mt-1">enrollments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Total Units</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl leading-none">{totalUnits}</p>
            <p className="text-xs text-muted-foreground mt-1">units offered</p>
          </CardContent>
        </Card>
      </div>

      {/* Classroom grid */}
      <div>
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search classrooms…"
          filters={[
            {
              key: "program",
              label: "Program",
              options: uniquePrograms,
              selected: filterProgram,
              onApply: setFilterProgram,
            },
          ]}
          sort={{
            options: [
              { label: "Course Code", value: "course_code" },
              { label: "Enrolled", value: "enrolled_count" },
            ],
            sortBy,
            direction: sortDir,
            onChange: (field, dir) => { setSortBy(field); setSortDir(dir) },
          }}
          resultCount={filtered.length}
          totalCount={(classrooms as unknown as ClassroomRow[]).length}
          action={
            status !== "ended" ? (
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
            ) : undefined
          }
        />

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            {search || filterProgram.length > 0 ? "No classrooms match your filters." : "No classrooms yet. Add one to get started."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => {
              const course = getCourse(c)
              const prog = getProgram(c)
              const profName = getProfessorName(c)
              const section = formatSection(prog, c.year_level, c.section)
              return (
                <div key={c.id} className="relative group">
                  <Link href={`/admin/${yearId}/${semId}/classrooms/${c.id}`}>
                    <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="min-w-0">
                            <p className="font-mono font-bold text-sm">{course?.course_code ?? "—"}</p>
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{course?.name ?? "—"}</p>
                          </div>
                          <Badge variant="outline" className="font-mono text-xs shrink-0">{section}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className={profName ? "" : "italic"}>{profName ?? "Unassigned"}</span>
                          <span className="flex items-center gap-1">
                            <Users className="size-3" />
                            {c.enrolled_count}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  {/* Edit / Delete actions on hover */}
                  <div className="absolute top-2 right-2 hidden group-hover:flex gap-1 z-10">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-6 bg-background/80 backdrop-blur-sm hover:text-foreground"
                      onClick={(e) => { e.preventDefault(); openEdit(c) }}
                    >
                      <Pencil className="size-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-6 bg-background/80 backdrop-blur-sm hover:text-destructive"
                      onClick={(e) => { e.preventDefault(); setDeleteTarget(c.id) }}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      <FormModal
        open={modalOpen}
        onOpenChange={(o) => { if (!o) closeModal(); else setModalOpen(true) }}
        title={editTarget ? "Edit Classroom" : "Add Classroom"}
        onSubmit={handleSubmit}
        submitLabel={editTarget ? "Save Changes" : "Create Classroom"}
        loading={loading}
      >
        {/* Program first — course options are filtered by it */}
        <div className="space-y-2">
          <Label>Program <span className="text-destructive">*</span></Label>
          <Combobox
            options={programOptions}
            value={form.program_id}
            onValueChange={handleProgramChange}
            placeholder="Select a program…"
            searchPlaceholder="Search programs…"
            emptyText="No programs found."
            disabled={!!editTarget}
          />
        </div>
        <div className="space-y-2">
          <Label>Course <span className="text-destructive">*</span></Label>
          <Combobox
            options={courseOptions}
            value={form.course_id}
            onValueChange={handleCourseChange}
            placeholder="Select a course…"
            searchPlaceholder="Search courses…"
            emptyText={
              form.program_id
                ? `No ${semesterLabel(term)} courses for this program.`
                : `No ${semesterLabel(term)} courses found.`
            }
            disabled={!!editTarget}
          />
          {!editTarget && (
            <p className="text-xs text-muted-foreground">
              {form.program_id
                ? `${courseOptions.length} course${courseOptions.length !== 1 ? "s" : ""} available for ${selectedProgram?.code ?? "this program"} · ${semesterLabel(term)}`
                : `${courseOptions.length} course${courseOptions.length !== 1 ? "s" : ""} available for ${semesterLabel(term)} — select a program to narrow further`
              }
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Year Level <span className="text-destructive">*</span></Label>
            <Select value={form.year_level} onValueChange={(v) => setForm((p) => ({ ...p, year_level: v }))} disabled={!!editTarget}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent position="popper">
                {[1,2,3,4,5,6].map((y) => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="section">Section <span className="text-destructive">*</span></Label>
            <div className="flex items-center gap-2">
              <Input
                id="section"
                value={form.section}
                onChange={(e) => setForm((p) => ({ ...p, section: e.target.value.toUpperCase() }))}
                placeholder="e.g. A"
                className="flex-1"
                required
              />
              {sectionPreview && <Badge variant="secondary" className="shrink-0 font-mono">{sectionPreview}</Badge>}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Professor <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
          <Combobox options={professorOptions} value={form.professor_id} onValueChange={(v) => setForm((p) => ({ ...p, professor_id: v }))} placeholder="Assign professor (optional)" searchPlaceholder="Search professors…" emptyText="No professors found." clearable />
        </div>
      </FormModal>

      {/* Copy modal */}
      <Dialog open={copyModalOpen} onOpenChange={(o) => { if (!o && !copying) { setCopyModalOpen(false); setCopyFromYearId("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy from Previous Year</DialogTitle>
            <DialogDescription>Copies classrooms with the same semester term. Professor assignments are cleared.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Source Academic Year</Label>
            <Combobox options={otherYears.map((y: { id: string; label: string }) => ({ value: y.id, label: y.label }))} value={copyFromYearId} onValueChange={setCopyFromYearId} placeholder="Select a year…" searchPlaceholder="Search years…" emptyText="No other years found." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCopyModalOpen(false); setCopyFromYearId("") }} disabled={copying}>Cancel</Button>
            <Button onClick={handleCopy} disabled={!copyFromYearId || copying}>{copying ? "Copying…" : "Copy Classrooms"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Classroom"
        description="Are you sure? This will also remove all enrollments and grades for students in this classroom."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />

      {/* Semester status CTA confirm */}
      <ConfirmModal
        open={!!semAction}
        onOpenChange={(open) => !open && setSemAction(null)}
        title={semActionMeta?.title ?? ""}
        description={semActionMeta?.description ?? ""}
        confirmLabel={semActionMeta?.confirmLabel ?? "Confirm"}
        variant={semAction === "end" ? "destructive" : "default"}
        onConfirm={handleSemesterAction}
        loading={semActionLoading}
      />
    </div>
  )
}
