import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { ProgramManager } from "@/components/admin/program-manager"

export default async function ProgramsPage() {
  const supabase = await getSupabaseServerClient()
  const [{ data: programs }, { data: departments }] = await Promise.all([
    supabase
      .from("programs")
      .select("*, departments(name, code)")
      .order("name"),
    supabase
      .from("departments")
      .select("id, name, code")
      .order("name"),
  ])

  return (
    <div>
      <PageHeader title="Programs" description="Manage academic programs" />
      <ProgramManager programs={programs ?? []} departments={departments ?? []} />
    </div>
  )
}
