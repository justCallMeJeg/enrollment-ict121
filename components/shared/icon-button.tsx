"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type Props = {
  tooltip: string
  onClick?: () => void
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

export function IconButton({ tooltip, children, className, onClick, disabled }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={cn("size-8 text-muted-foreground", className)}
          onClick={onClick}
          disabled={disabled}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent sideOffset={4}>{tooltip}</TooltipContent>
    </Tooltip>
  )
}
