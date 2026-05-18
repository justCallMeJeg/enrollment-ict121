import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { CreateUserForm } from "@/components/admin/create-user-form"
import { DataTable } from "@/components/shared/data-table"
import type { Column } from "@/components/shared/data-table"
import { Badge } from "@/components/ui/badge"

type UserRow = {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

const columns: Column<UserRow>[] = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  {
    key: "role",
    header: "Role",
    render: (row) => (
      <Badge variant="outline" className="capitalize">
        {row.role}
      </Badge>
    ),
  },
]

export default async function UsersPage() {
  const supabase = await getSupabaseServerClient()
  const { data: programs } = await supabase
    .from("programs")
    .select("id, name, code")
    .order("name")

  const { data: professors } = await supabase
    .from("professors")
    .select("user_id, faculty_id, users(id, name, email, role, created_at)")
    .order("faculty_id")

  const { data: students } = await supabase
    .from("students")
    .select("user_id, student_id, users(id, name, email, role, created_at)")
    .order("student_id")

  const users: UserRow[] = [
    ...(professors ?? []).map((p) => {
      const u = Array.isArray(p.users) ? p.users[0] : p.users
      return { id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at }
    }),
    ...(students ?? []).map((s) => {
      const u = Array.isArray(s.users) ? s.users[0] : s.users
      return { id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at }
    }),
  ].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      <PageHeader
        title="User Accounts"
        description="Create student and professor accounts"
      />
      <div className="space-y-6">
        <CreateUserForm programs={programs ?? []} />
        <DataTable
          keyField="id"
          data={users as unknown as Record<string, unknown>[]}
          columns={columns as Column<Record<string, unknown>>[]}
          emptyTitle="No users yet"
          emptyDescription="Create the first user account above"
        />
      </div>
    </div>
  )
}
