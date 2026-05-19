import { headers } from "next/headers"
import { AdminShell } from "@/components/layout/admin-shell"
import { YearSwitcher } from "@/components/admin/year-switcher"
import { getAdminYearContext } from "@/lib/admin-year"
import type { SessionPayload, UserRole } from "@/types"

export default async function AdminLayout({
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

  const { year, years } = await getAdminYearContext()

  return (
    <AdminShell
      user={user}
      yearSwitcher={
        <YearSwitcher years={years} currentYearId={year?.id ?? null} />
      }
    >
      {children}
    </AdminShell>
  )
}
