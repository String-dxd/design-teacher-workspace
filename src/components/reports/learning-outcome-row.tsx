import type { LearningOutcome, LearningOutcomeStatus } from '@/types/report'
import { cn } from '@/lib/utils'

const statusColors: Record<LearningOutcomeStatus, string> = {
  Accomplished: 'bg-lime-3 text-lime-11',
  Competent: 'bg-twblue-3 text-twblue-11',
  Developing: 'bg-amber-3 text-amber-11',
  Beginning: 'bg-muted text-muted-foreground',
}

export function LearningOutcomeRow({ outcome }: { outcome: LearningOutcome }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1">
        <p className="text-sm font-medium">{outcome.name}</p>
        <p className="text-muted-foreground text-sm">{outcome.description}</p>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full px-3 py-1 text-xs font-medium',
          statusColors[outcome.status],
        )}
      >
        {outcome.status}
      </span>
    </div>
  )
}

export { statusColors }
