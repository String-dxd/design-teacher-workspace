import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Download } from 'lucide-react'

import type { HolisticReport, ReportBlock } from '@/types/report'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ReportPreview } from '@/components/reports/report-preview'
import { cn, stripSalutation } from '@/lib/utils'

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
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * The real "acknowledge by" date, once one has actually been configured at
   * send time (ISO string). Before any real send, there's nothing to show
   * yet — the illustrative +14-day default fills in instead.
   */
  ackDeadline?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

/** 'P1-A' → 'Primary 1A' — matches report-preview.tsx's own spell-out. */
function spellOutClass(classLabel: string): string {
  const match = /^P(\d)-([A-Z])$/.exec(classLabel)
  return match ? `Primary ${match[1]}${match[2]}` : classLabel
}

export function PgReportPreviewDialog({
  report,
  blocks,
  comments,
  open,
  onOpenChange,
  ackDeadline,
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
    // Only a real configured deadline (set at send time) shows a date — a
    // pre-send preview must not present a fabricated promise to parents.
    setAckByDate(
      ackDeadline
        ? new Date(ackDeadline).toLocaleDateString('en-SG', dateOpts)
        : '',
    )
  }, [ackDeadline])

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
                <h3 className="mb-3 text-base font-bold text-slate-900">
                  Student Profile
                </h3>
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    <AvatarFallback>
                      {getInitials(report.studentName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#c47565] uppercase">
                      {report.studentName}
                    </p>
                    {report.schoolName && (
                      <p className="truncate text-xs text-slate-500">
                        {report.schoolName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="text-sm text-slate-700">
                    <span className="text-slate-400">Class: </span>
                    <span className="font-semibold">
                      {spellOutClass(report.studentClass)}
                    </span>
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <p className="text-sm text-slate-700">
                    <span className="text-slate-400">Form teacher: </span>
                    <span className="font-semibold">
                      {stripSalutation(report.formTeacher)}
                    </span>
                  </p>
                  {report.coFormTeacher && (
                    <p className="text-sm text-slate-700">
                      <span className="text-slate-400">Co-form teacher: </span>
                      <span className="font-semibold">
                        {stripSalutation(report.coFormTeacher)}
                      </span>
                    </p>
                  )}
                </div>
                <p className="mt-3 text-[10px] font-semibold text-slate-400">
                  {report.term} {report.academicYear} · Issued Date:{' '}
                  {issuedDate}
                </p>
              </div>

              {/* The report — one scrollable page, no tabs */}
              <div className="px-4 py-4">
                <ReportPreview
                  report={report}
                  blocks={blocks.filter((b) => b.key !== 'pupilInfo')}
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
                    {!canAcknowledge
                      ? 'Please scroll through all sections to acknowledge'
                      : ackByDate
                        ? `Please acknowledge by ${ackByDate}`
                        : 'Acknowledge-by date is set when the report is sent'}
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
