import * as React from "react"

import { cn } from "@/lib/utils"

type CalendarGridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 7

type CalendarGridProps = {
  columns?: CalendarGridColumns
  children: React.ReactNode
  className?: string
}

const columnClasses: Record<CalendarGridColumns, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  7: "grid-cols-7",
}

function CalendarGrid({ columns = 7, children, className }: CalendarGridProps) {
  return (
    <div className={cn("grid gap-3", columnClasses[columns], className)}>
      {children}
    </div>
  )
}

export { CalendarGrid }
