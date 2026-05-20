import { headers } from "next/headers"
import { AdminShell } from "@/components/layout/admin-shell"
import { getAdminYearContext } from "@/lib/admin-year"
import type { SessionPayload, UserRole } from "@/types"

export default async function AdminMainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const user: SessionPayload = {
    userId: headersList.get("x-user-id")!,
    role: headersList.get("x-user-role") as UserRole,
    name: headersList.get("x-user-name")!,
  }

  const { year, years, semester, semesters } = await getAdminYearContext()

  return (
    <AdminShell
      user={user}
      years={years}
      semesters={semesters}
      currentYearId={year?.id ?? null}
      currentSemesterId={semester?.id ?? null}
    >
      {children}
    </AdminShell>
  )
}
