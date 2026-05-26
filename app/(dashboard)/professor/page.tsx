import { getSupabaseServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { PageHeader } from "@/components/shared/page-header"
import { ProfessorProfileForm } from "@/components/professor/profile-form"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function ProfessorDashboard() {
  const headersList = await headers()
  const userId = headersList.get("x-user-id")!

  const supabase = await getSupabaseServerClient()
  const [{ data: professor }, { data: activeYear }] = await Promise.all([
    supabase
      .from("professors")
      .select("faculty_id, users(name, email, contact_number)")
      .eq("user_id", userId)
      .single(),
    supabase
      .from("academic_years")
      .select("label, status")
      .eq("status", "active")
      .single(),
  ])

  const user = professor?.users
    ? Array.isArray(professor.users)
      ? professor.users[0]
      : professor.users
    : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Professor Dashboard"
        description="Your current academic year and profile"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Academic Year</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-sm">{activeYear?.label ?? "—"}</p>
            {activeYear && (
              <Badge className="mt-1" variant="default">Active</Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Faculty ID</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{professor?.faculty_id ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      <ProfessorProfileForm
        initialEmail={user?.email ?? ""}
        initialContact={user?.contact_number ?? ""}
        name={user?.name ?? ""}
      />
    </div>
  )
}
