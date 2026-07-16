import type { DispositionId, FormingPattern } from '@/types/hdp'
import { MOCK_STAFF } from '@/data/mock-staff'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const DISPOSITION_LABELS: Record<DispositionId, string> = {
  perseverance: 'Perseverance',
  curiosity: 'Curiosity',
  collaboration: 'Collaboration',
  'self-direction': 'Self-direction',
}

function staffName(id: string): string {
  return MOCK_STAFF.find((s) => s.id === id)?.name ?? 'a colleague'
}

interface PatternCardProps {
  pattern: FormingPattern
  onConfirm?: () => void
  onDismiss?: () => void
}

// The screen's one accent element (P5: forming patterns render as a
// "candidate thread, unconfirmed" until a teacher confirms). A card is
// legitimate here — it carries Confirm/Dismiss actions.
export function PatternCard({
  pattern,
  onConfirm,
  onDismiss,
}: PatternCardProps) {
  const isConfirmed = pattern.status === 'confirmed'
  const basisLine = `${DISPOSITION_LABELS[pattern.disposition]} in ${
    pattern.contexts.length
  } contexts · ${pattern.tagIds.length} observations`

  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 rounded-lg border-[1.5px] border-primary/50 p-3',
      )}
    >
      <p className="text-xs font-medium text-primary">
        {isConfirmed
          ? `Confirmed thread · by ${staffName(pattern.confirmedBy ?? '')}`
          : 'Forming pattern — candidate thread, unconfirmed'}
      </p>
      <p className="text-muted-foreground text-sm">{basisLine}</p>
      {!isConfirmed && (onConfirm || onDismiss) && (
        <div className="mt-1 flex gap-2">
          {onConfirm && (
            <Button variant="outline" size="sm" onClick={onConfirm}>
              Confirm
            </Button>
          )}
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Not a thread
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
