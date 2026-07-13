import type { PGStatus } from '@/types/pg-announcement'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: PGStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (status === 'posted') {
    return (
      <Badge
        className={cn('bg-lime-3 text-lime-11 hover:bg-lime-3', className)}
      >
        Posted
      </Badge>
    )
  }
  if (status === 'scheduled') {
    return (
      <Badge
        className={cn(
          'bg-amber-3 text-amber-11 hover:bg-amber-3',
          className,
        )}
      >
        Scheduled
      </Badge>
    )
  }
  return (
    <Badge
      className={cn('bg-muted text-muted-foreground hover:bg-muted', className)}
    >
      Draft
    </Badge>
  )
}
