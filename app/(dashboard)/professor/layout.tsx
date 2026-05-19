import { headers } from "next/headers"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import type { SessionPayload, UserRole } from "@/types"

export default async function ProfessorLayout({
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

  return <DashboardShell user={user}>{children}</DashboardShell>
}
