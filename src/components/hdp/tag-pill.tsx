import type { DispositionId } from '@/types/hdp'
import { cn } from '@/lib/utils'
import { DISPOSITION_LABELS } from '@/lib/hdp-labels'

interface TagPillProps {
  disposition?: DispositionId
  /** Overrides the disposition lookup — used to name a context/artefact
   *  instead of a disposition (e.g. the story register's evidence chips,
   *  plan 037). Exactly one of `disposition`/`label` should be given. */
  label?: string
  /** 'key' is the screen's one accent use — reserve it, don't default to it. */
  variant?: 'default' | 'key'
  className?: string
}

// Sentence case, never uppercase — plain-text legend chip shared by the
// stream, pattern cards, and the disposition mix bar's legend.
export function TagPill({
  disposition,
  label,
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
      {label ?? (disposition ? DISPOSITION_LABELS[disposition] : '')}
    </span>
  )
}
