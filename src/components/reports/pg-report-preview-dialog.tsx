import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, ChevronDown, Download, Image } from 'lucide-react'

import type { HolisticReport, ReportBlock } from '@/types/report'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ReportPreview } from '@/components/reports/report-preview'
import { cn } from '@/lib/utils'

// Shared "how parents see it" preview: the report document inside a Parents
// Gateway phone mockup, mirroring the real PG HDP viewer — Student Profile
// header, static Year/Term fields, one scrollable report page, and the
// scroll-gated Acknowledge footer. The bezel and salmon accent match the
// Posts feature's PG preview (announcements.new.tsx), so every PG preview
// in the app reads as the same parent-facing product. The acknowledge tap
// is a local mock (it never writes to the cycle store) — the hub's Parents
// column tracks the real (simulated) acknowledgements after sending.

interface PgReportPreviewDialogProps {
  report: HolisticReport
  blocks: Array<ReportBlock>
  comments?: string
  parentMessage?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Static field that looks like the PG app's select boxes — display only. */
function StaticField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-semibold text-slate-400">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
        <span className="truncate text-xs font-bold text-slate-700">
          {value}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      </div>
    </div>
  )
}

export function PgReportPreviewDialog({
  report,
  blocks,
  comments,
  parentMessage,
  open,
  onOpenChange,
}: PgReportPreviewDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false)
  // The reference app gates acknowledgement on reading to the end.
  const [canAcknowledge, setCanAcknowledge] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Each preview session starts un-acknowledged and un-scrolled; content
  // shorter than the viewport needs no scrolling (double rAF waits for the
  // dialog to lay out before measuring — post-commit measurement idiom).
  useEffect(() => {
    if (!open) return
    setAcknowledged(false)
    setCanAcknowledge(false)
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        const el = scrollRef.current
        if (el && el.scrollHeight <= el.clientHeight + 24) {
          setCanAcknowledge(true)
        }
      })
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [open])

  function handleScroll() {
    if (canAcknowledge) return
    const el = scrollRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      setCanAcknowledge(true)
    }
  }

  // Client-only dates (posts-preview pattern — avoids SSR/client mismatch).
  const [issuedDate, setIssuedDate] = useState('')
  const [ackByDate, setAckByDate] = useState('')
  useEffect(() => {
    const dateOpts: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
    const now = new Date()
    setIssuedDate(now.toLocaleDateString('en-SG', dateOpts))
    const ackBy = new Date(now)
    ackBy.setDate(ackBy.getDate() + 14)
    setAckByDate(ackBy.toLocaleDateString('en-SG', dateOpts))
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Preview in Parents Gateway</DialogTitle>
          <DialogDescription>
            How {report.studentName}’s report reads — and how their parent
            acknowledges it — in the Parents Gateway app.
          </DialogDescription>
        </DialogHeader>

        {/* Phone mockup — real device width and proportion */}
        <div className="mx-auto w-full max-w-[390px]">
          <div className="relative flex h-[720px] max-h-[75vh] flex-col overflow-hidden rounded-[28px] border-[7px] border-slate-900 bg-white shadow-md">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto bg-white"
            >
              {/* Student Profile header — per the PG HDP viewer */}
              <div className="px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Student Profile
                  </h3>
                  <span className="grid h-9 w-9 shrink-0 place-content-center rounded-full border border-slate-200 bg-slate-50">
                    <Image
                      aria-hidden
                      className="h-4 w-4 text-slate-400"
                    />
                  </span>
                </div>
                <div className="mt-4 flex gap-3">
                  <StaticField
                    label="Academic Year"
                    value={String(report.academicYear)}
                  />
                  <StaticField label="Term" value={report.term} />
                </div>
                <p className="mt-3 text-[10px] font-semibold text-slate-400">
                  Issued Date: {issuedDate}
                </p>
              </div>

              {/* The report — one scrollable page, no tabs */}
              <div className="px-4 py-4">
                {parentMessage?.trim() && (
                  <div className="bg-muted/50 mb-4 rounded-xl border p-3">
                    <p className="text-muted-foreground mb-1 text-xs font-medium">
                      A note from your form teacher
                    </p>
                    <p className="text-sm leading-relaxed">{parentMessage}</p>
                  </div>
                )}
                <ReportPreview
                  report={report}
                  blocks={blocks}
                  comments={comments ?? ''}
                  compactPupilInfo
                />
              </div>
            </div>

            {/* Acknowledge footer — gated on reading to the end */}
            <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">
              {acknowledged ? (
                <div className="flex items-center justify-center gap-1.5 py-1">
                  <CheckCircle2 className="h-4 w-4 text-lime-600" />
                  <span className="text-xs font-semibold text-slate-700">
                    Acknowledged
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!canAcknowledge}
                      onClick={() => setAcknowledged(true)}
                      className={cn(
                        'flex-1 rounded-lg px-4 py-2 text-[11px] font-semibold text-white transition-colors',
                        canAcknowledge
                          ? 'bg-[#c47565] hover:opacity-90'
                          : 'cursor-not-allowed bg-slate-300',
                      )}
                    >
                      Acknowledge Report
                    </button>
                    <button
                      type="button"
                      aria-label="Download report (mock)"
                      className="grid h-8 w-9 shrink-0 place-content-center rounded-lg border border-slate-200 text-slate-500"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-2 text-center text-[10px] text-slate-400">
                    {canAcknowledge
                      ? `Please acknowledge by ${ackByDate}`
                      : 'Please scroll through all sections to acknowledge'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
