import type { DispositionId, FormingPattern } from '@/types/hdp'
import { MOCK_STAFF } from '@/data/mock-staff'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  /** Draft-studio selection mode (Prototype B): a confirmed thread is a
   *  selectable insight — when both are given the card leads with a
   *  checkbox, same grammar as the stream items around it. */
  selected?: boolean
  onSelectedChange?: () => void
  /** The student's first name — used only for the quiet "hidden from the
   *  family report by {name}" line when a student has retired a confirmed
   *  pattern from their family-facing report (plan 041). The teacher-facing
   *  record itself is unchanged: this card keeps rendering the pattern. */
  studentFirstName?: string
}

// The screen's one accent element (P5: forming patterns render as a
// "candidate thread, unconfirmed" until a teacher confirms). A card is
// legitimate here — it carries Confirm/Dismiss actions.
export function PatternCard({
  pattern,
  onConfirm,
  onDismiss,
  studentFirstName,
  selected,
  onSelectedChange,
}: PatternCardProps) {
  const isConfirmed = pattern.status === 'confirmed'
  const isRetired = pattern.status === 'retired-by-student'
  const selectable = onSelectedChange !== undefined
  const basisLine = `${DISPOSITION_LABELS[pattern.disposition]} in ${
    pattern.contexts.length
  } contexts · ${pattern.tagIds.length} observations`

  return (
    <div
      className={cn(
        'border-primary/40 bg-primary/[0.03] flex gap-3 rounded-lg border-[1.5px] p-3.5',
      )}
    >
      {selectable && (
        <Checkbox
          checked={selected ?? false}
          onCheckedChange={onSelectedChange}
          aria-label="Include this confirmed thread in the draft"
          className="mt-0.5"
        />
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-primary text-xs font-medium">
          {isConfirmed || isRetired
            ? `Confirmed thread · by ${staffName(pattern.confirmedBy ?? '')}`
            : 'Forming pattern'}
        </p>
        <p className="text-sm font-medium">{basisLine}</p>
        {isRetired && (
          <p className="text-muted-foreground text-xs">
            Hidden from the family report by {studentFirstName ?? 'the student'}
          </p>
        )}
        {!isConfirmed && !isRetired && (
          <p className="text-muted-foreground text-xs">
            Unconfirmed — it only counts as a thread once a teacher confirms it.
          </p>
        )}
        {!isConfirmed && !isRetired && (onConfirm || onDismiss) && (
          <div className="mt-1.5 flex gap-2">
            {onConfirm && (
              <Button variant="outline" size="sm" onClick={onConfirm}>
                Confirm thread
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
    </div>
  )
}
