import { Tag } from 'lucide-react'
import { useTagQueue } from './tag-queue-context'

interface RowQuickTagProps {
  studentId: string
  studentName: string
  className?: string
}

// A specific student is pre-chosen here (entryPoint 'row') — single-tag
// intent, so the composer closes the overlay on save (plan 029 behaviour
// split by entry point).
export function RowQuickTag({
  studentId,
  studentName,
  className,
}: RowQuickTagProps) {
  const { openTagQueue } = useTagQueue()

  return (
    <button
      type="button"
      aria-label={`Tag ${studentName}`}
      onClick={(e) => {
        e.stopPropagation()
        openTagQueue({ studentId, entryPoint: 'row' })
      }}
      className={
        className ??
        'text-muted-foreground hover:text-foreground inline-flex size-6 items-center justify-center'
      }
    >
      <Tag className="size-4" aria-hidden />
    </button>
  )
}
