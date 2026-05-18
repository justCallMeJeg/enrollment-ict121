"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  onSubmit: React.ComponentProps<"form">["onSubmit"]
  submitLabel?: string
  loading?: boolean
  children: React.ReactNode
  /** Use for large forms that might overflow on small screens */
  scrollable?: boolean
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
  scrollable = false,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <form
          onSubmit={onSubmit}
          // Stop propagation so nested forms don't conflict
          onClick={(e) => e.stopPropagation()}
        >
          {scrollable ? (
            <ScrollArea className="max-h-[60vh] pr-1">
              <div className="space-y-4 py-2">{children}</div>
            </ScrollArea>
          ) : (
            <div className="space-y-4 py-2">{children}</div>
          )}

          <DialogFooter className="mt-4">
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
