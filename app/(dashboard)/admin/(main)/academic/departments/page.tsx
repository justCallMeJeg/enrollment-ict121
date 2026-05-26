import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { DepartmentManager } from "@/components/admin/department-manager"

export default async function DepartmentsPage() {
  const supabase = await getSupabaseServerClient()
  const [{ data: departments }, { data: colleges }] = await Promise.all([
    supabase
      .from("departments")
      .select("*, colleges(name, code)")
      .order("name"),
    supabase.from("colleges").select("id, name, code").order("name"),
  ])

  return (
    <div>
      <PageHeader title="Departments" description="Manage department records" />
      <DepartmentManager departments={departments ?? []} colleges={colleges ?? []} />
    </div>
  )
}
