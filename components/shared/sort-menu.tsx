"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

export type SortOption = { label: string; value: string }

export function SortMenu({
  options,
  sortBy,
  direction,
  onChange,
}: {
  options: SortOption[]
  sortBy: string
  direction: "asc" | "desc"
  onChange: (sortBy: string, direction: "asc" | "desc") => void
}) {
  const currentLabel =
    options.find((o) => o.value === sortBy)?.label ?? options[0]?.label ?? "Name"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <ArrowUpDown className="size-3.5" />
          Sorted by {currentLabel.toLowerCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {options.map((opt) => (
          <DropdownMenuSub key={opt.value}>
            <DropdownMenuSubTrigger
              className={sortBy === opt.value ? "font-medium" : ""}
            >
              {opt.label}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={sortBy === opt.value ? direction : ""}
                onValueChange={(dir) =>
                  onChange(opt.value, dir as "asc" | "desc")
                }
              >
                <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
