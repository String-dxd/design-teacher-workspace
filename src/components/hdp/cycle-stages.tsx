import type { CycleStage } from '@/types/hdp'
import { cn } from '@/lib/utils'

const STAGES: Array<{ id: CycleStage; label: string }> = [
  { id: 'observing', label: 'Observing' },
  { id: 'window-open', label: 'Window open' },
  { id: 'drafting', label: 'Drafting' },
  { id: 'review', label: 'Review' },
  { id: 'released', label: 'Released' },
]

interface CycleStagesProps {
  stage: CycleStage
}

// Plain labels, not a stepper — no connective line, no checkmarks, no
// progress bar (explicit design constraint, plan 028).
export function CycleStages({ stage }: CycleStagesProps) {
  return (
    <ol aria-label="Reporting cycle" className="flex flex-wrap gap-x-6 gap-y-1">
      {STAGES.map((s) => {
        const isCurrent = s.id === stage
        return (
          <li
            key={s.id}
            aria-current={isCurrent ? 'step' : undefined}
            className={cn(
              'text-sm',
              isCurrent ? 'text-primary font-medium' : 'text-muted-foreground',
            )}
          >
            {s.label}
          </li>
        )
      })}
    </ol>
  )
}
