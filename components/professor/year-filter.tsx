"use client"

import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function YearFilter({
  years,
  selectedId,
}: {
  years: { id: string; label: string }[]
  selectedId: string
}) {
  const router = useRouter()

  return (
    <Select
      value={selectedId}
      onValueChange={(id) => router.push(`/professor/grades?year_id=${id}`)}
    >
      <SelectTrigger className="h-9 w-[220px]">
        <SelectValue placeholder="Select academic year" />
      </SelectTrigger>
      <SelectContent>
        {years.map((y) => (
          <SelectItem key={y.id} value={y.id}>
            {y.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
