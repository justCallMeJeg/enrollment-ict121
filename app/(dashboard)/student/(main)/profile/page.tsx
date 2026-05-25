import { getSupabaseServerClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { StudentProfileForm } from "@/components/student/profile-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default async function StudentProfilePage() {
  const headersList = await headers()
  const userId = headersList.get("x-user-id")!

  const supabase = await getSupabaseServerClient()

  const { data: student } = await supabase
    .from("students")
    .select("student_id, users(name, email, contact_number)")
    .eq("user_id", userId)
    .single()

  const user = student?.users
    ? Array.isArray(student.users)
      ? student.users[0]
      : student.users
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href="/student">
            <ChevronLeft className="size-4 mr-1" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <PageHeader
        title="Edit Profile"
        description="Update your contact information"
      />
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
