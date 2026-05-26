import { headers } from "next/headers"
import { AdminShell } from "@/components/layout/admin-shell"
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

  return <AdminShell user={user}>{children}</AdminShell>
}
