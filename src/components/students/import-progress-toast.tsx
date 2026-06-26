import { CircleCheck, CircleX, Loader2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

type State = 'importing' | 'success' | 'failed'

interface ImportProgressToastProps {
  state: State
  fileName: string
  percent?: number
  onReview?: () => void
  onRetry?: () => void
  onDismiss?: () => void
}

const SHELL =
  'w-[380px] overflow-hidden rounded-[14px] border border-slate-6 bg-white shadow-lg'

export function ImportProgressToast({
  state,
  fileName,
  percent = 0,
  onReview,
  onRetry,
  onDismiss,
}: ImportProgressToastProps) {
  if (state === 'importing') {
    return (
      <div className={`${SHELL} flex flex-col gap-2 p-4`}>
        <div className="flex w-full items-center gap-3 overflow-hidden">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-twblue-9" />
          <p className="flex-1 truncate text-sm font-semibold leading-5 text-slate-12">
            Importing {fileName}
          </p>
          <span className="shrink-0 text-sm leading-5 text-slate-11">
            {percent}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-4">
          <div
            className="h-full rounded-full bg-twblue-9 transition-all duration-200"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-sm leading-5 text-slate-11">
          You'll be notified when the import is complete
        </p>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className={`${SHELL} flex items-start gap-3 pt-4 pr-4 pb-2 pl-4`}>
        <div className="flex min-w-0 flex-1 flex-col items-start">
          <div className="flex w-full items-start gap-3">
            <CircleCheck className="h-5 w-5 shrink-0 text-lime-11" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-sm font-semibold leading-5 text-slate-12">
                Import complete
              </p>
              <p className="truncate text-sm leading-5 text-slate-11">
                {fileName}
              </p>
            </div>
          </div>
          {onReview && (
            <div className="pl-5">
              <Button
                variant="ghost"
                size="sm"
                onClick={onReview}
                className="text-twblue-9 hover:text-twblue-9"
              >
                Review import
              </Button>
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 text-slate-11 hover:text-slate-12"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`${SHELL} flex items-start gap-3 pt-4 pr-4 pb-2 pl-4`}>
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <div className="flex w-full items-start gap-3">
          <CircleX className="h-5 w-5 shrink-0 text-[var(--color-crimson-9,#e5484d)]" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-sm font-semibold leading-5 text-slate-12">
              Import failed
            </p>
            <p className="text-sm leading-5 text-slate-11">
              File couldn't be imported
            </p>
          </div>
        </div>
        {onRetry && (
          <div className="pl-5">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="text-twblue-9 hover:text-twblue-9"
            >
              Try again
            </Button>
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-slate-11 hover:text-slate-12"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
