"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Check, ChevronsUpDown, Plus, Search } from "lucide-react"
import { semesterLabel } from "@/types"
import type { AdminYearContext, AdminSemesterContext, AcademicYearStatus, SemesterStatus } from "@/types"
import { Button } from "@/components/ui/button"

const YEAR_STATUS_BADGE: Record<AcademicYearStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  upcoming: "secondary",
  draft: "outline",
  ended: "outline",
}

const SEM_STATUS_BADGE: Record<SemesterStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  pre_enrollment: "secondary",
  draft: "outline",
  ended: "outline",
}

function YearCombobox({
  years,
  currentYearId,
  onSelect,
}: {
  years: AdminYearContext[]
  currentYearId: string | null
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const currentYear = years.find((y) => y.id === currentYearId)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return years
    return years.filter((y) => y.label.toLowerCase().includes(q))
  }, [years, search])

  const dropdownContent = (
    <DropdownMenuContent
      align="start"
      sideOffset={8}
      className="w-[280px] p-0"
      onCloseAutoFocus={(e) => e.preventDefault()}
    >
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Find academic year…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
      </div>
      <div className="max-h-[220px] overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No results</p>
        ) : (
          filtered.map((y) => {
            const isSelected = y.id === currentYearId
            return (
              <DropdownMenuItem
                key={y.id}
                onClick={() => {
                  onSelect(y.id)
                  setOpen(false)
                  setSearch("")
                }}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer"
              >
                <Check
                  className={cn("size-3.5 shrink-0", isSelected ? "opacity-100" : "opacity-0")}
                />
                <span className="flex-1 truncate text-sm">{y.label}</span>
                <Badge
                  variant={YEAR_STATUS_BADGE[y.status]}
                  className="text-[10px] px-1.5 py-0 capitalize shrink-0"
                >
                  {y.status}
                </Badge>
              </DropdownMenuItem>
            )
          })
        )}
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild className="px-3 py-2 cursor-pointer">
        <Link href="/admin/academic-years/new" onClick={() => setOpen(false)}>
          <Plus className="size-3.5 mr-2 shrink-0" />
          <span className="text-sm">Create New Academic Year</span>
        </Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  )

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setSearch("")
      }}
    >
      {currentYear ? (
        <div className="flex items-center">
          <Link
            href="/admin/academic-years"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Academic Year {currentYear.label}
          </Link>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" className="ml-0.5 text-muted-foreground">
              <ChevronsUpDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
        </div>
      ) : (
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-muted-foreground font-medium">
            Select Year
            <ChevronsUpDown className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
      )}
      {dropdownContent}
    </DropdownMenu>
  )
}

function SemesterCombobox({
  semesters,
  currentSemesterId,
  currentYearId,
  onSelect,
}: {
  semesters: AdminSemesterContext[]
  currentSemesterId: string | null
  currentYearId: string | null
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)

  const currentSemester = semesters.find((s) => s.id === currentSemesterId)

  if (semesters.length === 0) return null

  const dropdownContent = (
    <DropdownMenuContent align="start" sideOffset={8} className="w-[220px]">
      {semesters.map((s) => {
        const isSelected = s.id === currentSemesterId
        return (
          <DropdownMenuItem
            key={s.id}
            onClick={() => {
              onSelect(s.id)
              setOpen(false)
            }}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
          >
            <Check
              className={cn("size-3.5 shrink-0", isSelected ? "opacity-100" : "opacity-0")}
            />
            <span className="flex-1 text-sm">{semesterLabel(s.term)}</span>
            <Badge
              variant={SEM_STATUS_BADGE[s.status]}
              className="text-[10px] px-1.5 py-0 capitalize shrink-0"
            >
              {s.status === "pre_enrollment" ? "open" : s.status}
            </Badge>
          </DropdownMenuItem>
        )
      })}
    </DropdownMenuContent>
  )

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {currentSemester && currentYearId ? (
        <div className="flex items-center">
          <Link
            href={`/admin/academic-years/${currentYearId}`}
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            {semesterLabel(currentSemester.term)}
          </Link>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" className="ml-0.5 text-muted-foreground">
              <ChevronsUpDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
        </div>
      ) : (
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-muted-foreground font-medium">
            Select Semester
            <ChevronsUpDown className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
      )}
      {dropdownContent}
    </DropdownMenu>
  )
}

export function ContextBreadcrumb({
  years,
  semesters,
  currentYearId,
  currentSemesterId,
}: {
  years: AdminYearContext[]
  semesters: AdminSemesterContext[]
  currentYearId: string | null
  currentSemesterId: string | null
}) {
  const router = useRouter()

  function selectYear(id: string) {
    document.cookie = `admin-year-id=${id}; path=/; max-age=2592000; SameSite=Lax`
    document.cookie = `admin-semester-id=; path=/; max-age=0; SameSite=Lax`
    router.refresh()
  }

  function selectSemester(id: string) {
    document.cookie = `admin-semester-id=${id}; path=/; max-age=2592000; SameSite=Lax`
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <YearCombobox
        years={years}
        currentYearId={currentYearId}
        onSelect={selectYear}
      />
      {semesters.length > 0 && (
        <>
          <span className="text-muted-foreground/60 text-sm select-none">/</span>
          <SemesterCombobox
            semesters={semesters}
            currentSemesterId={currentSemesterId}
            currentYearId={currentYearId}
            onSelect={selectSemester}
          />
        </>
      )}
    </div>
  )
}
