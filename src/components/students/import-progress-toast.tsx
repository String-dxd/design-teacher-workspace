import { CircleCheckIcon, Loader2Icon, OctagonXIcon, X } from 'lucide-react'

const CARD_CLASSES =
  'flex w-[360px] gap-3 rounded-2xl border border-[var(--border)] bg-[var(--popover)] p-4 text-[var(--popover-foreground)] shadow-md'

export function ImportProgressToast({
  filename,
  progress,
}: {
  filename: string
  progress: number
}) {
  const clamped = Math.max(0, Math.min(100, progress))
  return (
    <div className={CARD_CLASSES}>
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <div className="flex items-center gap-2">
          <Loader2Icon className="size-4 shrink-0 animate-spin text-[var(--color-twblue-9,#0064ff)]" />
          <p className="flex-1 truncate text-sm font-medium">
            Importing {filename}
          </p>
          <span className="text-sm tabular-nums text-[var(--color-slate-11,#60646c)]">
            {clamped}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-slate-4,#e8e8ec)]">
          <div
            className="h-full rounded-full bg-[var(--color-twblue-9,#0064ff)] transition-[width] duration-150 ease-linear"
            style={{ width: `${clamped}%` }}
          />
        </div>
        <p className="text-xs text-[var(--color-slate-11,#60646c)]">
          Keep using TW — we'll notify you when it's done.
        </p>
      </div>
    </div>
  )
}

export function ImportSuccessToast({
  filename,
  onAction,
  onDismiss,
}: {
  filename: string
  onAction: () => void
  onDismiss: () => void
}) {
  return (
    <div className={CARD_CLASSES}>
      <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-[var(--color-grass-11,#218358)]" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-medium">Import complete</p>
        <p className="truncate text-xs text-[var(--color-slate-11,#60646c)]">
          {filename} imported successfully.
        </p>
        <button
          type="button"
          onClick={onAction}
          className="mt-1 self-start text-xs font-semibold text-[var(--color-twblue-9,#0064ff)] hover:underline"
        >
          Review import
        </button>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-[var(--color-slate-9,#8b8d98)] transition-colors hover:text-[var(--color-slate-11,#60646c)]"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

export function ImportErrorToast({
  message,
  onAction,
  onDismiss,
}: {
  message: string
  onAction: () => void
  onDismiss: () => void
}) {
  return (
    <div className={CARD_CLASSES}>
      <OctagonXIcon className="mt-0.5 size-4 shrink-0 text-[var(--color-crimson-11,#ce2c31)]" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-medium">Import failed</p>
        <p className="text-xs text-[var(--color-slate-11,#60646c)]">
          {message}
        </p>
        <button
          type="button"
          onClick={onAction}
          className="mt-1 self-start text-xs font-semibold text-[var(--color-twblue-9,#0064ff)] hover:underline"
        >
          Try again
        </button>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-[var(--color-slate-9,#8b8d98)] transition-colors hover:text-[var(--color-slate-11,#60646c)]"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
