"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export type FilterConfig = {
  key: string
  placeholder: string
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
}

type Props = {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: FilterConfig[]
  action?: React.ReactNode
  resultCount?: number
  totalCount?: number
}

export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  filters,
  action,
  resultCount,
  totalCount,
}: Props) {
  const hasActiveFilters =
    search.length > 0 || filters?.some((f) => f.value !== "all")

  function clearAll() {
    onSearchChange("")
    filters?.forEach((f) => f.onChange("all"))
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
          <Select key={f.key} value={f.value} onValueChange={f.onChange}>
            <SelectTrigger className="h-9 w-auto min-w-[130px]">
              <SelectValue placeholder={f.placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{f.placeholder}</SelectItem>
              {f.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

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

      {(resultCount !== undefined && totalCount !== undefined && hasActiveFilters) && (
        <p className="text-xs text-muted-foreground">
          Showing {resultCount} of {totalCount} result{totalCount !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  )
}
