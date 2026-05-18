import { getSupabaseServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { PageHeader } from "@/components/shared/page-header"
import { StudentProfileForm } from "@/components/student/profile-form"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function StudentDashboard() {
  const headersList = await headers()
  const userId = headersList.get("x-user-id")!

  const supabase = await getSupabaseServerClient()
  const [{ data: student }, { data: activeYear }] = await Promise.all([
    supabase
      .from("students")
      .select("*, users(name, email, contact_number), programs(name, code)")
      .eq("user_id", userId)
      .single(),
    supabase
      .from("academic_years")
      .select("label, status")
      .eq("status", "active")
      .single(),
  ])

  const user = student?.users
    ? Array.isArray(student.users)
      ? student.users[0]
      : student.users
    : null
  const program = student?.programs
    ? Array.isArray(student.programs)
      ? student.programs[0]
      : student.programs
    : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Dashboard"
        description="Your enrollment information and profile"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <CardTitle className="text-xs text-muted-foreground">Year Level</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">Year {student?.year_level ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Program</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-sm">{program?.code ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{program?.name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Section</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{student?.section ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      <StudentProfileForm
        userId={userId}
        initialEmail={user?.email ?? ""}
        initialContact={user?.contact_number ?? ""}
        name={user?.name ?? ""}
        studentId={student?.student_id ?? ""}
      />
    </div>
  )
}
