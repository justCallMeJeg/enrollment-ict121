"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Check, ChevronsUpDown, GraduationCap, Plus, Search } from "lucide-react"
import type { AdminYearContext, AcademicYearStatus } from "@/types"
import { Button } from "@/components/ui/button"

const STATUS_BADGE: Record<AcademicYearStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  upcoming: "secondary",
  draft: "outline",
  ended: "outline",
}

export function YearSwitcher({
  years,
  currentYearId,
}: {
  years: AdminYearContext[]
  currentYearId: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const currentYear = years.find((y) => y.id === currentYearId)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return years
    return years.filter((y) => y.label.toLowerCase().includes(q))
  }, [years, search])

  function handleSelect(id: string) {
    document.cookie = `admin-year-id=${id}; path=/; max-age=2592000; SameSite=Lax`
    setOpen(false)
    setSearch("")
    router.refresh()
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setSearch("")
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-1.5">
          <span className="flex size-5 items-center justify-center rounded bg-muted shrink-0">
            <GraduationCap className="size-3 text-muted-foreground" />
          </span>
          <span className="max-w-[180px] truncate leading-none">
            {currentYear ? currentYear.label : "Select year"}
          </span>
          {currentYear && (
            <Badge
              variant={STATUS_BADGE[currentYear.status]}
              className="text-[10px] px-1.5 py-0 capitalize hidden sm:inline-flex shrink-0"
            >
              {currentYear.status}
            </Badge>
          )}
          <ChevronsUpDown className="size-3.5 text-muted-foreground shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-[280px] p-0"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* Search */}
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

        {/* Year list */}
        <div className="max-h-[220px] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No results</p>
          ) : (
            filtered.map((y) => {
              const isSelected = y.id === currentYearId
              return (
                <DropdownMenuItem
                  key={y.id}
                  onClick={() => handleSelect(y.id)}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                >
                  <Check
                    className={cn("size-3.5 shrink-0", isSelected ? "opacity-100" : "opacity-0")}
                  />
                  <span className="flex-1 truncate text-sm">{y.label}</span>
                  <Badge
                    variant={STATUS_BADGE[y.status]}
                    className="text-[10px] px-1.5 py-0 capitalize shrink-0"
                  >
                    {y.status}
                  </Badge>
                </DropdownMenuItem>
              )
            })
          )}
        </div>

        {/* Create action */}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="px-3 py-2 cursor-pointer">
          <Link href="/admin/academic-years" onClick={() => setOpen(false)}>
            <Plus className="size-3.5 mr-2 shrink-0" />
            <span className="text-sm">Add Academic Year</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
