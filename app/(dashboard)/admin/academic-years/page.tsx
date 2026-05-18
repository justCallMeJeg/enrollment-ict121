import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { AcademicYearManager } from "@/components/admin/academic-year-manager"

export default async function AcademicYearsPage() {
  const supabase = await getSupabaseServerClient()
  const { data: years } = await supabase
    .from("academic_years")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div>
      <PageHeader
        title="Academic Years"
        description="Manage academic years — create upcoming years and activate them when ready"
      />
      <AcademicYearManager years={years ?? []} />
    </div>
  )
}
