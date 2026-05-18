"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  ClipboardList,
  Star,
  School,
  Building2,
  BookMarked,
} from "lucide-react"

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "User Accounts", href: "/admin/users", icon: Users },
    { label: "Colleges", href: "/admin/academic/colleges", icon: Building2 },
    { label: "Departments", href: "/admin/academic/departments", icon: School },
    { label: "Programs", href: "/admin/academic/programs", icon: GraduationCap },
    { label: "Courses", href: "/admin/courses", icon: BookOpen },
    { label: "Academic Years", href: "/admin/academic-years", icon: Calendar },
  ],
  professor: [
    { label: "Dashboard", href: "/professor", icon: LayoutDashboard },
    { label: "Pre-Enrollments", href: "/professor/pre-enrollments", icon: ClipboardList },
    { label: "Grade Management", href: "/professor/grades", icon: Star },
  ],
  student: [
    { label: "Dashboard", href: "/student", icon: LayoutDashboard },
    { label: "Pre-Enrollment", href: "/student/pre-enrollment", icon: BookMarked },
    { label: "Drop Course", href: "/student/drop", icon: BookOpen },
    { label: "My Grades", href: "/student/grades", icon: Star },
  ],
}

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const items = NAV_ITEMS[role]

  return (
    <aside className="fixed top-14 left-0 bottom-0 w-[240px] border-r bg-sidebar overflow-y-auto">
      <nav className="flex flex-col gap-1 p-2 pt-3">
        {items.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === `/${role}`
              ? pathname === item.href
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
