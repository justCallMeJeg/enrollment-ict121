"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, BookOpen, ClipboardList, Star } from "lucide-react"
import { useAcademicYears } from "@/lib/hooks/use-academic-years"
import { useSemesters } from "@/lib/hooks/use-semesters"
import { PageHeader } from "@/components/shared/page-header"
import { DashboardSkeleton } from "@/components/shared/skeletons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { semesterLabel } from "@/types"
import type { SemesterStatus, SemesterTerm } from "@/types"

const STATUS_BADGE: Record<SemesterStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  pre_enrollment: "secondary",
  draft: "outline",
  ended: "outline",
}

const STATUS_LABEL: Record<SemesterStatus, string> = {
  draft: "Draft",
  pre_enrollment: "Open for Pre-Enrollment",
  active: "Active",
  ended: "Ended",
}

export default function SemesterDetailPage() {
  const { yearId, semId } = useParams<{ yearId: string; semId: string }>()
  const { years, isLoading: yearsLoading } = useAcademicYears()
  const { semesters, isLoading: semsLoading } = useSemesters(yearId)

  if (yearsLoading || semsLoading) return <DashboardSkeleton />

  const year = years.find((y) => y.id === yearId)
  const semester = semesters.find((s) => s.id === semId)

  if (!year || !semester) return null

  const term = semester.term as SemesterTerm
  const status = semester.status as SemesterStatus
  const title = `${year.label} — ${semesterLabel(term)}`

  return (
    <div>
      <div className="mb-1">
        <Link
          href={`/admin/${yearId}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-3" />
          {year.label}
        </Link>
      </div>

      <div className="flex items-start gap-3 mb-6">
        <div className="flex-1">
          <PageHeader
            title={title}
            description={`${STATUS_LABEL[status]} · Semester overview and quick actions`}
          />
        </div>
        <Badge variant={STATUS_BADGE[status]} className="capitalize text-xs mt-1 shrink-0">
          {STATUS_LABEL[status]}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href={`/admin/${yearId}/courses`}>
            <BookOpen className="size-4 mr-2" />
            View Courses
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/admin/${yearId}/${semId}/classrooms`}>
            <ClipboardList className="size-4 mr-2" />
            View Classrooms
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/admin/${yearId}/${semId}/grades`}>
            <Star className="size-4 mr-2" />
            View Grades
          </Link>
        </Button>
      </div>
    </div>
  )
}
