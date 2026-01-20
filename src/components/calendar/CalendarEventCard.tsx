import { Clock, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CalendarEventCardProps = {
  title: string
  description?: string | null
  time?: string | null
  typeLabel: string
  typeClassName: string
  participantLabel?: string | null
  dateLabel?: string
  compact?: boolean
  onDelete?: () => void
}

function CalendarEventCard({
  title,
  description,
  time,
  typeLabel,
  typeClassName,
  participantLabel,
  dateLabel,
  compact = false,
  onDelete,
}: CalendarEventCardProps) {
  if (compact) {
    return (
      <div className="rounded-lg border border-border p-3 transition-colors hover:bg-accent">
        <div className="mb-2 flex items-center gap-2">
          <span
            className={cn(
              "rounded border px-2 py-1 text-xs font-medium",
              typeClassName
            )}
          >
            {typeLabel}
          </span>
        </div>
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        {dateLabel || time ? (
          <p className="text-xs text-muted-foreground">
            {dateLabel}
            {dateLabel && time ? " at " : null}
            {time || null}
          </p>
        ) : null}
        {participantLabel ? (
          <p className="mt-1 text-xs text-muted-foreground">
            For {participantLabel}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded border px-2 py-1 text-xs font-medium",
              typeClassName
            )}
          >
            {typeLabel}
          </span>
          {time ? (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{time}</span>
            </div>
          ) : null}
        </div>
        <h4 className="font-medium text-foreground">{title}</h4>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
        {participantLabel ? (
          <p className="text-xs text-muted-foreground">For {participantLabel}</p>
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
