import { Plus } from 'lucide-react'
import { useTagQueue } from './tag-queue-context'

// The module's single-purpose, ambient capture affordance. Never badges,
// pulses, or animates on mount (no-nag, plan 028 design constraint) — it
// just sits there, always the same, always available. z-40 keeps it under
// dialogs (Base UI dialogs are z-50).
export function TagFab() {
  const { openTagQueue } = useTagQueue()

  return (
    <button
      type="button"
      aria-label="Tag a student"
      onClick={() => openTagQueue({ entryPoint: 'fab' })}
      style={{
        bottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
        right: 'calc(1.5rem + env(safe-area-inset-right))',
      }}
      className="fixed z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Plus className="size-6" aria-hidden />
    </button>
  )
}
