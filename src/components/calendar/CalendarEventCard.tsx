import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"

type CalendarEventCardProps = {
  title: string
  description?: string | null
  time?: string | null
  dateLabel?: string
  compact?: boolean
  onDelete?: () => void
}

function CalendarEventCard({
  title,
  description,
  time,
  dateLabel,
  compact = false,
  onDelete,
}: CalendarEventCardProps) {
  if (compact) {
    return (
      <div className="rounded-lg border border-border text-center px-2 transition-colors hover:bg-accent">
        <h4 className="text-sm text-foreground">{title}</h4>
        {dateLabel || time ? (
          <p className="text-xs text-muted-foreground">
            {dateLabel}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
      <div className="flex-1 space-y-1">
        <h4 className="font-medium text-foreground">{title}</h4>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {onDelete ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-destructive hover:bg-destructive/10"
          aria-label="Delete event"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  )
}

export { CalendarEventCard }
