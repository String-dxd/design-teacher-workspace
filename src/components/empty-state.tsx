import type * as React from 'react'

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-6 text-center">
        {icon && (
          <div className="flex size-20 items-center justify-center rounded-full bg-muted">
            {icon}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          <p className="max-w-md text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
    </div>
  )
}
