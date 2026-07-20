import type { DispositionId, HdpTag } from '@/types/hdp'
import { dispositionMix } from '@/lib/hdp-store'
import { DISPOSITION_LABELS } from '@/lib/hdp-labels'

// Largest slice gets the one accent; the rest step down in a muted scale.
// No numeric axis, no percentages, no legend counts (P6) — proportions only.
// The legend dots reuse the exact segment classes so each label maps to a
// slice without needing numbers.
const SEGMENT_CLASSES = [
  'bg-primary',
  'bg-muted-foreground/40',
  'bg-muted-foreground/25',
  'bg-muted',
]

interface DispositionMixBarProps {
  tags: Array<HdpTag>
}

export function DispositionMixBar({ tags }: DispositionMixBarProps) {
  const mix = dispositionMix(tags)
  const ordered = (Object.entries(mix) as Array<[DispositionId, number]>)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])

  const total = ordered.reduce((sum, [, count]) => sum + count, 0)
  if (total === 0) return null

  const topTwo = ordered.slice(0, 2).map(([id]) => DISPOSITION_LABELS[id])
  const ariaLabel =
    topTwo.length > 1
      ? `Mostly ${topTwo[0].toLowerCase()} and ${topTwo[1].toLowerCase()}`
      : `Mostly ${topTwo[0].toLowerCase()}`

  return (
    <div className="flex flex-col gap-2">
      <div
        role="img"
        aria-label={ariaLabel}
        className="flex h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        {ordered.map(([id, count], index) => (
          <div
            key={id}
            aria-hidden
            className={SEGMENT_CLASSES[index] ?? 'bg-muted'}
            style={{ width: `${(count / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {ordered.map(([id], index) => (
          <li key={id} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className={`size-2 rounded-full ${SEGMENT_CLASSES[index] ?? 'bg-muted'}`}
            />
            <span className="text-muted-foreground text-xs">
              {DISPOSITION_LABELS[id]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
