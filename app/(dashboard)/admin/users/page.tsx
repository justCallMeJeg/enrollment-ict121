import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { UserManager } from "@/components/admin/user-manager"
import type { UserRow } from "@/components/admin/user-manager"

export default async function UsersPage() {
  const supabase = await getSupabaseServerClient()

  const { data: programs } = await supabase
    .from("programs")
    .select("id, name, code")
    .order("name")

  const { data: professors } = await supabase
    .from("professors")
    .select("user_id, faculty_id, users(id, name, email, role, contact_number, created_at)")
    .order("faculty_id")

  const { data: students } = await supabase
    .from("students")
    .select("user_id, year_level, program_id, section, users(id, name, email, role, contact_number, created_at)")
    .order("user_id")

  const users: UserRow[] = [
    ...(professors ?? []).map((p) => {
      const u = Array.isArray(p.users) ? p.users[0] : p.users
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        created_at: u.created_at,
        contact_number: u.contact_number ?? null,
      }
    }),
    ...(students ?? []).map((s) => {
      const u = Array.isArray(s.users) ? s.users[0] : s.users
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        created_at: u.created_at,
        contact_number: u.contact_number ?? null,
        year_level: s.year_level,
        program_id: s.program_id,
        section: s.section,
      }
    }),
  ].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      <PageHeader
        title="User Accounts"
        description="Create and manage student and professor accounts"
      />
      <UserManager users={users} programs={programs ?? []} />
    </div>
  )
}
