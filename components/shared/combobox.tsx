"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ComboboxOption = {
  value: string
  label: string
  code?: string
}

export function MultiCombobox({
  options,
  values,
  onValuesChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results.",
  disabled = false,
}: {
  options: ComboboxOption[]
  values: string[]
  onValuesChange: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const selected = options.filter((o) => values.includes(o.value))

  function toggle(value: string) {
    onValuesChange(
      values.includes(value) ? values.filter((v) => v !== value) : [...values, value]
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal h-auto min-h-8 px-2.5 py-1"
        >
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {selected.length === 0 ? (
              <span className="text-sm text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((opt) => (
                <Badge key={opt.value} variant="secondary" className="text-xs gap-1 pr-1">
                  {opt.code ? <span className="font-mono">{opt.code}</span> : opt.label}
                  <span
                    className="cursor-pointer rounded hover:bg-muted"
                    onClick={(e) => { e.stopPropagation(); toggle(opt.value) }}
                  >
                    <X className="size-2.5" />
                  </span>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="size-3.5 text-muted-foreground shrink-0 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: "var(--radix-popover-trigger-width)" }}
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = values.includes(opt.value)
                return (
                  <CommandItem
                    key={opt.value}
                    value={[opt.code, opt.label].filter(Boolean).join(" ")}
                    onSelect={() => toggle(opt.value)}
                  >
                    <Check className={cn("size-3.5 shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                    {opt.code && (
                      <span className="font-mono text-xs text-muted-foreground shrink-0">{opt.code}</span>
                    )}
                    <span className="truncate">{opt.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results.",
  clearable = false,
  disabled = false,
}: {
  options: ComboboxOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  clearable?: boolean
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal h-8 px-2.5"
        >
          <span className={cn("truncate text-sm", !selected && "text-muted-foreground")}>
            {selected
              ? selected.code
                ? <><span className="font-mono">{selected.code}</span></>
                : selected.label
              : placeholder}
          </span>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {clearable && selected && (
              <span
                className="rounded p-0.5 cursor-pointer hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation()
                  onValueChange("")
                }}
              >
                <X className="size-3" />
              </span>
            )}
            <ChevronsUpDown className="size-3.5 text-muted-foreground" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: "var(--radix-popover-trigger-width)" }}
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={[opt.code, opt.label].filter(Boolean).join(" ")}
                  onSelect={() => {
                    onValueChange(opt.value === value ? "" : opt.value)
                    setOpen(false)
                  }}
                  data-checked={opt.value === value}
                >
                  {opt.code && (
                    <span className="font-mono text-xs text-muted-foreground shrink-0">
                      {opt.code}
                    </span>
                  )}
                  <span className="truncate">{opt.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
