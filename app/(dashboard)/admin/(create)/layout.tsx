import { headers } from "next/headers"
import { Header } from "@/components/layout/header"
import type { SessionPayload, UserRole } from "@/types"

export default async function AdminCreateLayout({
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

  return (
    <>
      <Header
        user={user}
        breadcrumb={
          <span className="text-sm font-medium text-muted-foreground">
            Creating New Academic Year
          </span>
        }
      />
      <main className="mt-14 min-h-[calc(100vh-56px)] p-6 max-w-2xl mx-auto">
        {children}
      </main>
    </>
  )
}
