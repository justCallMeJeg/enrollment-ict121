import { InboxIcon } from "lucide-react"

type Props = {
  title?: string
  description?: string
}

export function EmptyState({
  title = "No data",
  description = "Nothing to show here yet.",
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <InboxIcon className="size-10 text-muted-foreground mb-3" />
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  )
}
