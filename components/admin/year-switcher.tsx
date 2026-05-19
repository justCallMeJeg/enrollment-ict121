"use client"

import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { AdminYearContext, AcademicYearStatus } from "@/types"

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

  function handleChange(id: string) {
    document.cookie = `admin-year-id=${id}; path=/; max-age=2592000; SameSite=Lax`
    router.refresh()
  }

  return (
    <Select value={currentYearId ?? ""} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-[220px] text-xs">
        <SelectValue placeholder="Select academic year" />
      </SelectTrigger>
      <SelectContent>
        {years.map((y) => (
          <SelectItem key={y.id} value={y.id}>
            <span className="flex items-center gap-2">
              <span className="truncate">{y.label}</span>
              <Badge variant={STATUS_BADGE[y.status]} className="text-[10px] px-1 py-0 capitalize shrink-0">
                {y.status}
              </Badge>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
