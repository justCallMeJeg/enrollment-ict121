import { notFound } from "next/navigation"
import Link from "next/link"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { SetContextCookies } from "@/components/admin/set-context-cookies"
import { SemesterListView } from "@/components/admin/semester-list-view"
import { ChevronLeft } from "lucide-react"
import type { Semester } from "@/types"

export default async function AcademicYearDetailPage({
  params,
}: {
  params: Promise<{ yearId: string }>
}) {
  const { yearId } = await params
  const supabase = await getSupabaseServerClient()

  const [{ data: academicYear }, { data: semesters }] = await Promise.all([
    supabase
      .from("academic_years")
      .select("id, label, status")
      .eq("id", yearId)
      .single(),
    supabase
      .from("semesters")
      .select("*")
      .eq("academic_year_id", yearId)
      .order("created_at", { ascending: true }),
  ])

  if (!academicYear) notFound()

  return (
    <div>
      <SetContextCookies yearId={yearId} />

      <div className="mb-1">
        <Link
          href="/admin/academic-years"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-3" />
          Academic Years
        </Link>
      </div>

      <PageHeader
        title={academicYear.label}
        description="Manage semesters and their lifecycle for this academic year"
      />

      <SemesterListView
        academicYear={{ id: academicYear.id, label: academicYear.label }}
        semesters={(semesters ?? []) as Semester[]}
      />
    </div>
  )
}
