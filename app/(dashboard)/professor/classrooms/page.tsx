"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import useSWR from "swr"
import { fetcher } from "@/lib/hooks/fetcher"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/shared/page-header"
import { DashboardSkeleton } from "@/components/shared/skeletons"
import { semesterLabel } from "@/types"
import type { SemesterStatus, SemesterTerm } from "@/types"
import { Search, Users, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type CourseData = { course_code: string; name: string; units: number; semester: string }
type SemesterData = { term: SemesterTerm; status: SemesterStatus; academic_years: { label: string } | { label: string }[] | null }
type ProgramData = { id: string; name: string; code: string }

type ClassroomRow = {
  id: string
  section: string
  year_level: number
  enrolled_count: number
  courses: CourseData | CourseData[] | null
  semesters: SemesterData | SemesterData[] | null
  programs: ProgramData | ProgramData[] | null
}

const STATUS_BADGE: Record<SemesterStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  pre_enrollment: "secondary",
  draft: "outline",
  ended: "outline",
}

const STATUS_LABEL: Record<SemesterStatus, string> = {
  active: "Active",
  pre_enrollment: "Pre-Enrollment",
  draft: "Draft",
  ended: "Ended",
}

function normalize(classroom: ClassroomRow) {
  const course = Array.isArray(classroom.courses) ? classroom.courses[0] : classroom.courses
  const sem = Array.isArray(classroom.semesters) ? classroom.semesters[0] : classroom.semesters
  const prog = Array.isArray(classroom.programs) ? classroom.programs[0] : classroom.programs
  const yearData = sem?.academic_years
    ? Array.isArray(sem.academic_years) ? sem.academic_years[0] : sem.academic_years
    : null
  const sectionLabel = prog
    ? `${prog.code}-${classroom.year_level}${classroom.section}`
    : classroom.section
  return { course, sem, prog, yearData, sectionLabel }
}

export default function ProfessorClassroomsPage() {
  const { data: rawClassrooms, isLoading } = useSWR<ClassroomRow[]>(
    "/api/professor/classrooms",
    fetcher
  )

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("course_code")

  const classrooms = useMemo(() => {
    const list = [...(rawClassrooms ?? [])]

    const filtered = list.filter((c) => {
      const { course, sem, sectionLabel } = normalize(c)
      if (filterStatus !== "all" && sem?.status !== filterStatus) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          course?.course_code?.toLowerCase().includes(q) ||
          course?.name?.toLowerCase().includes(q) ||
          sectionLabel.toLowerCase().includes(q)
        )
      }
      return true
    })

    filtered.sort((a, b) => {
      const { course: ca } = normalize(a)
      const { course: cb } = normalize(b)
      if (sortBy === "course_code") return (ca?.course_code ?? "").localeCompare(cb?.course_code ?? "")
      if (sortBy === "name") return (ca?.name ?? "").localeCompare(cb?.name ?? "")
      if (sortBy === "students") return (b.enrolled_count ?? 0) - (a.enrolled_count ?? 0)
      return 0
    })

    return filtered
  }, [rawClassrooms, search, filterStatus, sortBy])

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Classrooms"
        description="All classrooms you are assigned to teach"
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Search by course code, name, or section…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pre_enrollment">Pre-Enrollment</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="course_code">Course Code</SelectItem>
            <SelectItem value="name">Course Name</SelectItem>
            <SelectItem value="students">Most Students</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {classrooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-medium text-foreground">
            {rawClassrooms?.length === 0 ? "No classrooms assigned" : "No results found"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {rawClassrooms?.length === 0
              ? "You have not been assigned to any classrooms yet."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((classroom) => {
            const { course, sem, yearData, sectionLabel } = normalize(classroom)
            const status = (sem?.status ?? "draft") as SemesterStatus

            return (
              <Link
                key={classroom.id}
                href={`/professor/classrooms/${classroom.id}`}
                className={cn(
                  "rounded-lg border bg-card flex flex-col transition-shadow hover:shadow-md group",
                  status === "active" && "border-primary ring-1 ring-primary/20 shadow-sm"
                )}
              >
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">
                        {course?.course_code ?? "—"}
                      </p>
                      <h3 className="font-semibold text-sm leading-snug mt-0.5 group-hover:text-primary transition-colors line-clamp-2">
                        {course?.name ?? "Unnamed Course"}
                      </h3>
                    </div>
                    <Badge
                      variant={STATUS_BADGE[status] ?? "outline"}
                      className="shrink-0 text-[11px]"
                    >
                      {STATUS_LABEL[status] ?? status}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">{sectionLabel}</p>
                    <p>
                      {sem?.term ? semesterLabel(sem.term) : "—"}
                      {yearData ? ` · ${(yearData as { label: string }).label}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="size-3.5" />
                      {classroom.enrolled_count} student{classroom.enrolled_count !== 1 ? "s" : ""}
                    </span>
                    <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
