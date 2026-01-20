import * as React from "react"

import { cn } from "@/lib/utils"

type AgendaListProps<Item> = {
  items: Item[]
  renderItem: (item: Item) => React.ReactNode
  isLoading?: boolean
  error?: boolean
  emptyState?: React.ReactNode
  loadingState?: React.ReactNode
  errorState?: React.ReactNode
  className?: string
  listClassName?: string
}

function AgendaList<Item>({
  items,
  renderItem,
  isLoading = false,
  error = false,
  emptyState,
  loadingState,
  errorState,
  className,
  listClassName,
}: AgendaListProps<Item>) {
  if (isLoading) {
    return (
      <div className={className}>
        {loadingState ?? (
          <p className="text-sm text-muted-foreground">Loading events...</p>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        {errorState ?? (
          <p className="text-sm text-muted-foreground">Error loading events.</p>
        )}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={className}>
        {emptyState ?? (
          <p className="text-sm text-muted-foreground">No upcoming events</p>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className, listClassName)}>
      {items.map(renderItem)}
    </div>
  )
}

export { AgendaList }
