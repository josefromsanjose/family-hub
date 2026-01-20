import * as React from "react"

import { cn } from "@/lib/utils"

type CalendarDayColumnProps = {
  label: string
  dateLabel?: string
  isToday?: boolean
  children?: React.ReactNode
  className?: string
}

function CalendarDayColumn({
  label,
  dateLabel,
  isToday = false,
  children,
  className,
}: CalendarDayColumnProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-4",
        isToday ? "border-primary/60 bg-primary/5" : null,
        className
      )}
    >
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {dateLabel ? (
          <p className="text-xs text-muted-foreground">{dateLabel}</p>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2">{children}</div>
    </div>
  )
}

export { CalendarDayColumn }
