import * as React from "react"

import { cn } from "@/lib/utils"

type CalendarHeaderProps = {
  label: string
  subLabel?: string
  actions?: React.ReactNode
  className?: string
}

function CalendarHeader({
  label,
  subLabel,
  actions,
  className,
}: CalendarHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{label}</h2>
        {subLabel ? (
          <p className="text-sm text-muted-foreground">{subLabel}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export { CalendarHeader }
