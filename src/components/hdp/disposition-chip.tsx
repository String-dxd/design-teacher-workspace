import { cn } from '@/lib/utils'

interface DispositionChipProps {
  label: string
  selected: boolean
  onClick: () => void
  /** Read-only, e.g. once a report book is shared with parents (plan 041) —
   *  native `disabled` so it's unfocusable, never a fake/aria-only state. */
  disabled?: boolean
}

// Toggle pill shared by the disposition and context rows. Selected state is
// the composer's single accent (border-primary/bg-primary/10/text-primary) —
// deliberately not a filled/high-contrast state so it stays one accent among
// many chips, never a badge. 44px mobile target below 640px per the a11y
// constraint; 12px label text (the 11px floor).
export function DispositionChip({
  label,
  selected,
  onClick,
  disabled = false,
}: DispositionChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-11 sm:h-auto rounded-full border px-3 py-1.5 text-xs font-medium motion-safe:transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        selected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}
