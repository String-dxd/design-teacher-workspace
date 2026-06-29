import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  /** Left-aligned title. */
  title: ReactNode
  /** Invoked by the circular close (X) button on the right. */
  onClose: () => void
  /** Optional right-aligned actions, rendered before the close button. */
  actions?: ReactNode
  className?: string
}

/**
 * Shared top bar for full-page flows (create/edit screens), matching the
 * sign-in page header: a left-aligned title and a circular outline close
 * button on the right, with an optional actions slot in between.
 */
export function PageHeader({
  title,
  onClose,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b bg-background px-6 py-4',
        className,
      )}
    >
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        {title}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
