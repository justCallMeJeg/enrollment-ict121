"use client"

import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { FilterDropdown } from "@/components/shared/filter-dropdown"
import { SortMenu, type SortOption } from "@/components/shared/sort-menu"

export type FilterConfig = {
  key: string
  label: string
  options: { label: string; value: string }[]
  selected: string[]
  onApply: (values: string[]) => void
}

export type SortConfig = {
  options: SortOption[]
  sortBy: string
  direction: "asc" | "desc"
  onChange: (sortBy: string, direction: "asc" | "desc") => void
}

type Props = {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: FilterConfig[]
  sort?: SortConfig
  action?: React.ReactNode
  resultCount?: number
  totalCount?: number
}

export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  filters,
  sort,
  action,
  resultCount,
  totalCount,
}: Props) {
  const hasActiveFilters =
    search.length > 0 || filters?.some((f) => f.selected.length > 0)

  function clearAll() {
    onSearchChange("")
    filters?.forEach((f) => f.onApply([]))
  }

  return (
    <div className="space-y-3 mb-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-9"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {filters?.map((f) => (
          <FilterDropdown
            key={f.key}
            label={f.label}
            options={f.options}
            selected={f.selected}
            onApply={f.onApply}
          />
        ))}

        {sort && (
          <SortMenu
            options={sort.options}
            sortBy={sort.sortBy}
            direction={sort.direction}
            onChange={sort.onChange}
          />
        )}

        {hasActiveFilters && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2 text-muted-foreground"
                onClick={clearAll}
              >
                <X className="size-3.5 mr-1" />
                Clear
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={4}>Clear all active filters</TooltipContent>
          </Tooltip>
        )}

        <div className="flex-1" />

        {action && <div className="shrink-0">{action}</div>}
      </div>

      {resultCount !== undefined &&
        totalCount !== undefined &&
        hasActiveFilters && (
          <p className="text-xs text-muted-foreground">
            Showing {resultCount} of {totalCount} result
            {totalCount !== 1 ? "s" : ""}
          </p>
        )}
    </div>
  )
}
