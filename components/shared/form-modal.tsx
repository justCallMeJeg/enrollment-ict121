"use client"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  onSubmit: React.ComponentProps<"form">["onSubmit"]
  submitLabel?: string
  loading?: boolean
  children: React.ReactNode
  /** "lg" widens the modal to max-w-2xl for forms with many fields */
  size?: "md" | "lg"
}

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  submitLabel = "Save",
  loading = false,
  children,
  size = "md",
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent
        className={cn(
          "flex flex-col gap-0 max-h-[90vh] overflow-hidden p-0",
          size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg"
        )}
      >
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <form
          onSubmit={onSubmit}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col min-h-0 flex-1"
        >
          <div className="flex-1 overflow-y-auto px-6 pb-2">
            <div className="space-y-4 py-2">{children}</div>
          </div>

          <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
