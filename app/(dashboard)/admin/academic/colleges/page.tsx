import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { CrudManager } from "@/components/admin/crud-manager"

export default async function CollegesPage() {
  const supabase = await getSupabaseServerClient()
  const { data: colleges } = await supabase
    .from("colleges")
    .select("*")
    .order("name")

  return (
    <div>
      <PageHeader title="Colleges" description="Manage college records" />
      <CrudManager
        endpoint="/api/admin/colleges"
        items={colleges ?? []}
        fields={[
          { key: "name", label: "College Name", required: true },
          { key: "code", label: "Code", required: true, placeholder: "e.g. CCS" },
        ]}
        columns={[
          { key: "name", header: "Name" },
          { key: "code", header: "Code" },
        ]}
        entityName="College"
      />
    </div>
  )
}
