"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types"
import {
  Home,
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Star,
  School,
  Building2,
  BookMarked,
  PanelLeft,
  Check,
  Layers,
} from "lucide-react"
import { useSidebar } from "./sidebar-context"
import { useAdminYearContext } from "./admin-year-context"
import { semesterLabel } from "@/types"
import type { SemesterTerm } from "@/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
}

type NavGroup = {
  groupLabel: string
  items: NavItem[]
}

type NavSection = NavItem | NavGroup

function isGroup(s: NavSection): s is NavGroup {
  return "items" in s
}

const NAV_ITEMS: Record<UserRole, NavSection[]> = {
  admin: [
    { label: "Home", href: "/admin", icon: Home },
    { label: "User Accounts", href: "/admin/users", icon: Users },
    {
      groupLabel: "Academics",
      items: [
        { label: "Colleges", href: "/admin/academic/colleges", icon: Building2 },
        { label: "Departments", href: "/admin/academic/departments", icon: School },
        { label: "Programs", href: "/admin/academic/programs", icon: GraduationCap },
        { label: "Courses", href: "/admin/academic/courses", icon: BookOpen },
      ],
    },
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

type DisplayMode = "expanded" | "hover" | "collapsed"

const DISPLAY_OPTIONS: { label: string; value: DisplayMode }[] = [
  { label: "Always show", value: "expanded" },
  { label: "Show on hover", value: "hover" },
  { label: "Collapse", value: "collapsed" },
]

const YEAR_SCOPED_ITEMS = [
  { label: "Courses", icon: BookOpen },
]

const SEMESTER_SCOPED_ITEMS = [
  { label: "Semester Overview", hrefSuffix: "", icon: LayoutDashboard, exactMatch: true },
  { label: "Classrooms", hrefSuffix: "/classrooms", icon: Layers, exactMatch: false },
  { label: "Grade Management", hrefSuffix: "/grades", icon: Star, exactMatch: false },
]

function SidebarSectionLabel({ label, expanded }: { label: string; expanded: boolean }) {
  return (
    <span
      className={cn(
        "px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 block",
        expanded ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0"
      )}
    >
      {label}
    </span>
  )
}

export function Sidebar({ role }: { role: UserRole }) {
  const { years, semesters, currentYearId, currentSemesterId } = useAdminYearContext()
  const pathname = usePathname()
  const { mode, setMode } = useSidebar()
  const [hovered, setHovered] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Tracks whether the pointer is physically inside the <aside> DOM element.
  // A ref (not state) because we only need to read it in event callbacks —
  // no render needs to react to it directly.
  const isOverSidebar = useRef(false)

  const expanded = mode === "expanded" || (mode === "hover" && (hovered || dropdownOpen))

  const currentYear = years.find((y) => y.id === currentYearId)
  const currentSem = semesters.find((s) => s.id === currentSemesterId)

  // When mode changes away from "hover", stop any pending timer and clear hovered.
  useEffect(() => {
    if (mode !== "hover") {
      if (leaveTimer.current) {
        clearTimeout(leaveTimer.current)
        leaveTimer.current = null
      }
      setHovered(false)
    }
  }, [mode])

  function handleMouseEnter() {
    isOverSidebar.current = true
    // Only hover mode uses hovered state; skip unnecessary setState in other modes.
    if (mode !== "hover") return
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current)
      leaveTimer.current = null
    }
    setHovered(true)
  }

  function handleMouseLeave() {
    isOverSidebar.current = false
    if (mode !== "hover") return
    // If the dropdown is open, the pointer moved to the portal (outside <aside>).
    // Don't start the collapse timer — wait for the dropdown to close instead.
    if (dropdownOpen) return
    leaveTimer.current = setTimeout(() => {
      setHovered(false)
      leaveTimer.current = null
    }, 150)
  }

  function handleDropdownOpenChange(open: boolean) {
    setDropdownOpen(open)
    // When the dropdown closes, check whether the pointer is still inside the sidebar.
    // If not, we need to start the collapse timer ourselves — onMouseLeave on the aside
    // already fired (and was suppressed while the dropdown was open), so it won't fire again.
    if (!open && mode === "hover" && !isOverSidebar.current) {
      if (leaveTimer.current) {
        clearTimeout(leaveTimer.current)
      }
      leaveTimer.current = setTimeout(() => {
        setHovered(false)
        leaveTimer.current = null
      }, 150)
    }
  }

  if (years.length === 0) return null

  const items = NAV_ITEMS[role]
  const showTopLevel =
    pathname === "/admin" ||
    pathname === "/admin/users" ||
    pathname.startsWith("/admin/academic")
  const showAcademics = showTopLevel
  const showUserAccounts = showTopLevel

  function renderNavItem(item: NavItem) {
    const Icon = item.icon
    const isActive =
      item.href === `/${role}`
        ? pathname === item.href
        : pathname.startsWith(item.href)

    const linkContent = (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors min-w-0",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="size-4 shrink-0" />
        <span
          className={cn(
            "whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out",
            expanded ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0"
          )}
        >
          {item.label}
        </span>
      </Link>
    )

    if (!expanded) {
      return (
        <Tooltip key={item.href} delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {item.label}
          </TooltipContent>
        </Tooltip>
      )
    }

    return linkContent
  }

  return (
    <aside
      className={cn(
        "fixed top-14 left-0 bottom-0 border-r bg-sidebar z-30 flex flex-col overflow-hidden transition-[width] duration-200 ease-in-out",
        expanded ? "w-[240px]" : "w-14"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <nav className="flex flex-col gap-1 p-2 pt-3 flex-1 overflow-y-auto overflow-x-hidden">
        {items.map((section) => {
          if (isGroup(section)) {
            if (!showAcademics) return null
            return (
              <div key={section.groupLabel}>
                <SidebarSectionLabel label={section.groupLabel} expanded={expanded} />
                {section.items.map((item) => renderNavItem(item))}
              </div>
            )
          }
          if (!isGroup(section) && section.label === "User Accounts" && !showUserAccounts) return null
          return renderNavItem(section)
        })}

        {/* Year-scoped section (admin only, when yearId is in URL) */}
        {role === "admin" && currentYearId && (
          <>
            <SidebarSectionLabel label={currentYear?.label ?? "Academic Year"} expanded={expanded} />
            {YEAR_SCOPED_ITEMS.map((item) => {
              const href = `/admin/${currentYearId}/courses`
              const Icon = item.icon
              const isActive = pathname.startsWith(href)
              const linkContent = (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors min-w-0",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className={cn("whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out", expanded ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0")}>
                    {item.label}
                  </span>
                </Link>
              )
              if (!expanded) {
                return (
                  <Tooltip key={href} delayDuration={0}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>{item.label}</TooltipContent>
                  </Tooltip>
                )
              }
              return linkContent
            })}
          </>
        )}

        {/* Semester-scoped section (admin only, when both yearId + semId in URL) */}
        {role === "admin" && currentYearId && currentSemesterId && (
          <>
            <SidebarSectionLabel
              label={currentSem ? semesterLabel(currentSem.term as SemesterTerm) : "Semester"}
              expanded={expanded}
            />
            {SEMESTER_SCOPED_ITEMS.map((item) => {
              const href = `/admin/${currentYearId}/${currentSemesterId}${item.hrefSuffix}`
              const Icon = item.icon
              const isActive = item.exactMatch ? pathname === href : pathname.startsWith(href)
              const linkContent = (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors min-w-0",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className={cn("whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out", expanded ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0")}>
                    {item.label}
                  </span>
                </Link>
              )
              if (!expanded) {
                return (
                  <Tooltip key={href} delayDuration={0}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>{item.label}</TooltipContent>
                  </Tooltip>
                )
              }
              return linkContent
            })}
          </>
        )}
      </nav>

      <div className="shrink-0 p-2 border-t">
        <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpenChange}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground w-full justify-start px-3"
                >
                  <PanelLeft className="size-4 shrink-0" />
                  <span
                    className={cn(
                      "ml-3 text-sm font-medium whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-200 ease-in-out",
                      expanded ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
                    )}
                  >
                    Display
                  </span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            {!expanded && (
              <TooltipContent side="right" sideOffset={8}>
                Sidebar display
              </TooltipContent>
            )}
          </Tooltip>
          <DropdownMenuContent side="right" align="end" sideOffset={8}>
            <DropdownMenuLabel>Display</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DISPLAY_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => setMode(opt.value)}
                className="flex items-center gap-2"
              >
                <Check
                  className={cn("size-3.5", mode === opt.value ? "opacity-100" : "opacity-0")}
                />
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
