import type { DispositionId } from '@/types/hdp'
import { cn } from '@/lib/utils'

const DISPOSITION_LABELS: Record<DispositionId, string> = {
  perseverance: 'Perseverance',
  curiosity: 'Curiosity',
  collaboration: 'Collaboration',
  'self-direction': 'Self-direction',
}

interface TagPillProps {
  disposition: DispositionId
  /** 'key' is the screen's one accent use — reserve it, don't default to it. */
  variant?: 'default' | 'key'
  className?: string
}

// Sentence case, never uppercase — plain-text legend chip shared by the
// stream, pattern cards, and the disposition mix bar's legend.
export function TagPill({
  disposition,
  variant = 'default',
  className,
}: TagPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variant === 'key'
          ? 'bg-primary/10 text-primary'
          : 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {DISPOSITION_LABELS[disposition]}
    </span>
  )
}
