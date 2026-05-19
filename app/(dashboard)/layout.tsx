import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { UserRole } from "@/types"

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

  // Auth is validated above; each role group (admin/professor/student) provides its own shell layout.
  return <>{children}</>
}
