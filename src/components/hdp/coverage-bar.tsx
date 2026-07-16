import type { CoverageSnapshot } from '@/types/hdp'

interface CoverageBarProps {
  snapshot: CoverageSnapshot
}

// Coverage is a diagnostic, not a KPI: no percentage text, no axis, no
// celebratory motion. A plain div, not a card (plan 028 design constraints).
export function CoverageBar({ snapshot }: CoverageBarProps) {
  const { total, covered, reviewedNil } = snapshot
  const fraction = total > 0 ? covered / total : 0

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm tabular-nums">
        {covered} of {total} reviewed
        {reviewedNil > 0 && (
          <span className="text-muted-foreground">
            {' '}
            · {reviewedNil} with nothing noted yet
          </span>
        )}
      </p>
      <div className="bg-muted h-2 w-full rounded-full">
        <div
          className="bg-primary h-2 rounded-full motion-safe:transition-[width] motion-safe:duration-300"
          style={{ width: `${Math.round(fraction * 100)}%` }}
        />
      </div>
    </div>
  )
}
