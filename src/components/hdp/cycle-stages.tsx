import type { CycleStage } from '@/types/hdp'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const STAGES: Array<{ id: CycleStage; label: string; hint: string }> = [
  { id: 'observing', label: 'Observing', hint: 'Tag moments as they happen' },
  {
    id: 'window-open',
    label: 'Window open',
    hint: 'Reporting window is open — fill gaps',
  },
  { id: 'drafting', label: 'Drafting', hint: 'Turn evidence into comments' },
  { id: 'review', label: 'Review', hint: 'Confirm and sync remarks' },
  { id: 'released', label: 'Released', hint: 'Report books go to families' },
]

interface CycleStagesProps {
  stage: CycleStage
}

// The current reporting stage as a quiet pill beside the page title
// (maintainer feedback 2026-07-17). Selecting it opens a popover timeline of
// the whole cycle — where this stage sits, what came before, what's next.
export function CycleStages({ stage }: CycleStagesProps) {
  const currentIndex = STAGES.findIndex((s) => s.id === stage)
  const current = STAGES[currentIndex]

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          'bg-twblue-3 text-twblue-11 hover:bg-twblue-4 inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
          'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px] motion-safe:transition-colors motion-safe:duration-150',
        )}
        aria-label={`Reporting cycle stage: ${current?.label ?? stage}. View timeline`}
      >
        {current?.label ?? stage}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <PopoverHeader>
          <PopoverTitle>Reporting cycle</PopoverTitle>
        </PopoverHeader>
        <ol className="mt-1 flex flex-col">
          {STAGES.map((s, index) => {
            const isCurrent = index === currentIndex
            const isPast = index < currentIndex
            const isLast = index === STAGES.length - 1
            return (
              <li
                key={s.id}
                aria-current={isCurrent ? 'step' : undefined}
                className="flex gap-3"
              >
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden
                    className={cn(
                      'mt-1 size-2.5 shrink-0 rounded-full',
                      isCurrent
                        ? 'bg-primary'
                        : isPast
                          ? 'bg-primary/40'
                          : 'border-border border-2 bg-transparent',
                    )}
                  />
                  {!isLast && (
                    <span
                      aria-hidden
                      className={cn(
                        'w-px flex-1',
                        isPast ? 'bg-primary/40' : 'bg-border',
                      )}
                    />
                  )}
                </div>
                <div className={cn('flex flex-col pb-3', isLast && 'pb-0')}>
                  <span
                    className={cn(
                      'text-sm',
                      isCurrent
                        ? 'text-foreground font-medium'
                        : isPast
                          ? 'text-foreground'
                          : 'text-muted-foreground',
                    )}
                  >
                    {s.label}
                    {isCurrent && (
                      <span className="text-primary ml-1.5 text-xs font-medium">
                        Now
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {s.hint}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </PopoverContent>
    </Popover>
  )
}
