import { useEffect, useRef, useState } from 'react'
import { Settings2 } from 'lucide-react'

import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  previewImportToast,
  setDesignTools,
  useDesignToolsState,
  useImportJob,
  useImportWizardState,
} from '@/lib/import-job-store'

const STORAGE_KEY = 'import-design-tools-fab-position'
const DEFAULT_OFFSET = { x: 0, y: 0 }

function loadOffset(): { x: number; y: number } {
  if (typeof window === 'undefined') return DEFAULT_OFFSET
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_OFFSET
    const parsed = JSON.parse(raw)
    if (
      parsed &&
      typeof parsed.x === 'number' &&
      typeof parsed.y === 'number'
    ) {
      return parsed
    }
  } catch {}
  return DEFAULT_OFFSET
}

export function ImportDesignToolsFab() {
  const designTools = useDesignToolsState()
  const job = useImportJob()
  const wizard = useImportWizardState()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(loadOffset())

  // Apply transform on mount
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.style.transform = `translate(${offsetRef.current.x}px, ${offsetRef.current.y}px)`
  }, [])

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return
    const startX = e.clientX
    const startY = e.clientY
    const startOffset = { ...offsetRef.current }
    let dragging = false
    const el = containerRef.current
    if (!el) return

    document.body.style.userSelect = 'none'

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (!dragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        dragging = true
      }
      if (dragging) {
        offsetRef.current = {
          x: startOffset.x + dx,
          y: startOffset.y + dy,
        }
        el.style.transform = `translate(${offsetRef.current.x}px, ${offsetRef.current.y}px)`
      }
    }

    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.body.style.userSelect = ''
      if (dragging) {
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(offsetRef.current),
          )
        } catch {}
        // Swallow the click after drag so the popover doesn't open
        const swallow = (ev: MouseEvent) => {
          ev.stopImmediatePropagation()
          ev.preventDefault()
          document.removeEventListener('click', swallow, true)
        }
        document.addEventListener('click', swallow, true)
      }
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }

  const wizardOpen = wizard.open
  const toastStatus = job.status

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 left-16 z-[60] flex flex-col items-start"
      style={{ touchAction: 'none' }}
    >
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              onPointerDown={onPointerDown}
              className={cn(
                'flex h-10 w-10 cursor-grab items-center justify-center rounded-full border bg-white shadow-lg transition-shadow hover:shadow-xl active:cursor-grabbing',
              )}
              aria-label="Open Design Tools"
            >
              <Settings2 className="h-4 w-4 text-slate-500" />
            </button>
          }
        />
        <PopoverContent
          side="top"
          sideOffset={8}
          align="start"
          className="w-72"
        >
          <PopoverHeader>
            <PopoverTitle>Design Tools</PopoverTitle>
          </PopoverHeader>
          <div className="flex flex-col gap-5">
            {/* Toast state */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-500">
                Toast state
              </label>
              <Select
                value={toastStatus}
                onValueChange={(val) =>
                  previewImportToast(
                    val as 'idle' | 'importing' | 'success' | 'error',
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idle">Idle (no toast)</SelectItem>
                  <SelectItem value="importing">Import in progress</SelectItem>
                  <SelectItem value="success">Import success</SelectItem>
                  <SelectItem value="error">Import fail</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-400">
                Triggers a preview toast. Real imports overwrite this.
              </p>
            </div>

            {/* Wizard controls — only relevant while wizard is open */}
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Wizard ({wizardOpen ? 'open' : 'closed'})
              </p>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-500">
                  Step 1 — Upload state
                </label>
                <Select
                  value={designTools.uploadError ? 'error' : 'idle'}
                  onValueChange={(val) =>
                    setDesignTools({ uploadError: val === 'error' })
                  }
                  disabled={!wizardOpen}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idle">Idle</SelectItem>
                    <SelectItem value="error">Upload error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-500">
                  Step 2 — Review state
                </label>
                <Select
                  value={designTools.hasIssues ? 'issues' : 'clean'}
                  onValueChange={(val) =>
                    setDesignTools({ hasIssues: val === 'issues' })
                  }
                  disabled={!wizardOpen}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clean">No issues</SelectItem>
                    <SelectItem value="issues">Few issues found</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-500">
                  Step 4 — Overflow state
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setDesignTools({
                      confirmationShowAll: !designTools.confirmationShowAll,
                    })
                  }
                  disabled={!wizardOpen}
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                    designTools.confirmationShowAll
                      ? 'bg-slate-900'
                      : 'bg-slate-200',
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform',
                      designTools.confirmationShowAll
                        ? 'translate-x-4'
                        : 'translate-x-0',
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

