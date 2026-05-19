"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type FilterDropdownConfig = {
  key: string
  label: string
  options: { label: string; value: string }[]
  selected: string[]
  onApply: (values: string[]) => void
}

export function FilterDropdown({
  label,
  options,
  selected,
  onApply,
}: {
  label: string
  options: { label: string; value: string }[]
  selected: string[]
  onApply: (values: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string[]>([])

  function handleOpenChange(o: boolean) {
    if (o) setDraft(selected)
    setOpen(o)
  }

  function toggle(value: string) {
    setDraft((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  const isActive = selected.length > 0

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-1.5 border-dashed",
            isActive && "border-primary text-primary"
          )}
        >
          {label}
          {isActive && (
            <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-medium w-4 h-4">
              {selected.length}
            </span>
          )}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-0">
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
          Filter by {label.toLowerCase()}
        </div>
        <div className="p-2 space-y-0.5">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted text-sm"
            >
              <Checkbox
                checked={draft.includes(opt.value)}
                onCheckedChange={() => toggle(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
        <div className="flex gap-2 p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={() => {
              onApply([])
              setOpen(false)
            }}
          >
            Clear
          </Button>
          <Button
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={() => {
              onApply(draft)
              setOpen(false)
            }}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
