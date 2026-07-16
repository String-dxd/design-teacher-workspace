import { cn } from '@/lib/utils'

interface DispositionChipProps {
  label: string
  selected: boolean
  onClick: () => void
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
}: DispositionChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'h-11 sm:h-auto rounded-full border px-3 py-1.5 text-xs font-medium motion-safe:transition-colors',
        selected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}
