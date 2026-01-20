import * as React from "react"

import { cn } from "@/lib/utils"

type CalendarShellProps = {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  headerClassName?: string
}

function CalendarShell({
  title,
  description,
  actions,
  children,
  className,
  headerClassName,
}: CalendarShellProps) {
  return (
    <div className={cn("min-h-screen bg-background p-6", className)}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div
          className={cn(
            "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
            headerClassName
          )}
        >
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            {description ? (
              <p className="text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
        {children}
      </div>
    </div>
  )
}

export { CalendarShell }
