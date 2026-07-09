import { useEffect, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  MoreHorizontal,
  User,
} from 'lucide-react'

import type { HolisticReport, ReportBlock } from '@/types/report'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ReportPreview } from '@/components/reports/report-preview'
import { stripSalutation } from '@/lib/utils'

// Shared "how parents see it" preview: the report document inside a Parents
// Gateway phone mockup, with the Acknowledge action a parent would tap.
// Chrome mirrors the Posts feature's PG preview (announcements.new.tsx):
// same bezel, nav bar, post-style header and salmon acknowledge footer, so
// every PG preview in the app reads as the same parent-facing product. The
// acknowledge tap is a local mock (it never writes to the cycle store) — the
// hub's Parents column tracks the real (simulated) acknowledgements after
// sending.

interface PgReportPreviewDialogProps {
  report: HolisticReport
  blocks: Array<ReportBlock>
  comments?: string
  parentMessage?: string
  open: boolean
  onOpenChange: (open: boolean) => void
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

  // Each preview session starts un-acknowledged.
  useEffect(() => {
    if (open) setAcknowledged(false)
  }, [open])

  // Client-only dates (posts-preview pattern — avoids SSR/client mismatch).
  const [timestamp, setTimestamp] = useState('')
  const [ackByDate, setAckByDate] = useState('')
  useEffect(() => {
    const dateOpts: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
    const now = new Date()
    const posted = now.toLocaleDateString('en-SG', dateOpts).toUpperCase()
    const time = now
      .toLocaleTimeString('en-SG', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      .toUpperCase()
    setTimestamp(`${posted}, ${time}`)
    const ackBy = new Date(now)
    ackBy.setDate(ackBy.getDate() + 14)
    setAckByDate(ackBy.toLocaleDateString('en-SG', dateOpts))
  }, [])

  const teacher = stripSalutation(report.formTeacher)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Preview in Parents Gateway</DialogTitle>
          <DialogDescription>
            How {report.studentName}’s report reads — and how their parent
            acknowledges it — in the Parents Gateway app.
          </DialogDescription>
        </DialogHeader>

        {/* Phone mockup — same chrome as the Posts PG preview */}
        <div className="mx-auto w-full max-w-[300px]">
          <div className="relative flex h-[540px] flex-col overflow-hidden rounded-[28px] border-[7px] border-slate-900 bg-white shadow-md">
            {/* PG nav bar */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-3 py-2.5">
              <ChevronLeft className="h-5 w-5 text-slate-400" />
              <div className="flex items-center gap-3 text-slate-400">
                <ArrowUp className="h-3.5 w-3.5" />
                <ArrowDown className="h-3.5 w-3.5" />
                <MoreHorizontal className="h-4 w-4" />
              </div>
            </div>

            <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto bg-white">
              {/* Post-style header */}
              <div className="px-4 py-4">
                <h3 className="text-sm leading-snug font-bold text-slate-900">
                  Holistic Development Profile · {report.term}{' '}
                  {report.academicYear}
                </h3>
                <p className="mt-1 text-[10px] tracking-wide text-slate-400 uppercase">
                  {timestamp}
                  {` · ${teacher.toUpperCase()}`}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <User className="h-3 w-3 shrink-0 text-slate-400" />
                  <p className="text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
                    {report.studentName}
                  </p>
                </div>
              </div>

              {/* The report document */}
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

            {/* Acknowledge footer — the parent's one action on the document */}
            <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">
              {acknowledged ? (
                <div className="flex items-center justify-center gap-1.5 py-1">
                  <CheckCircle2 className="h-4 w-4 text-lime-600" />
                  <span className="text-xs font-semibold text-slate-700">
                    Acknowledged
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="shrink-0">
                    <p className="text-[10px] text-slate-400">
                      Please acknowledge by
                    </p>
                    <p className="text-xs font-bold text-slate-700">
                      {ackByDate}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAcknowledged(true)}
                    className="rounded-lg bg-[#c47565] px-4 py-1.5 text-[11px] font-semibold whitespace-nowrap text-white transition-opacity hover:opacity-90"
                  >
                    Acknowledge
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
