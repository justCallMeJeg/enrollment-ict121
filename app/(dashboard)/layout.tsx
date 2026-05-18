import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import type { SessionPayload, UserRole } from "@/types"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const userId = headersList.get("x-user-id")
  const role = headersList.get("x-user-role") as UserRole | null
  const name = headersList.get("x-user-name")

  if (!userId || !role || !name) {
    redirect("/login")
  }

  const user: SessionPayload = { userId, role, name }

  return <DashboardShell user={user}>{children}</DashboardShell>
}
