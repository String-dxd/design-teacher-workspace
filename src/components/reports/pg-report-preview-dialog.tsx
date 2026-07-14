import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Download } from 'lucide-react'

import type { HolisticReport, ReportBlock } from '@/types/report'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
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
          <div className="relative flex h-[720px] max-h-[75vh] flex-col overflow-hidden rounded-[28px] border-[7px] border-foreground bg-card shadow-md">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="divide-border min-h-0 flex-1 divide-y overflow-y-auto bg-card"
            >
              {/* Student Profile header — per the PG HDP viewer */}
              <div className="px-4 py-4">
                <h3 className="text-foreground mb-3 text-base font-bold">
                  Student Profile
                </h3>
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    <AvatarFallback>
                      {getInitials(report.studentName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-orange-11 truncate text-sm font-bold">
                      {report.studentName}
                    </p>
                    {report.schoolName && (
                      <p className="text-muted-foreground truncate text-xs">
                        {report.schoolName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="border-border mt-3 border-t pt-3">
                  <p className="text-foreground text-sm">
                    <span className="text-muted-foreground">Class: </span>
                    <span className="font-semibold">
                      {spellOutClass(report.studentClass)}
                    </span>
                  </p>
                </div>
                <div className="border-border mt-3 grid grid-cols-2 gap-2 border-t pt-3">
                  <p className="text-foreground text-sm">
                    <span className="text-muted-foreground">
                      Form teacher:{' '}
                    </span>
                    <span className="font-semibold">
                      {stripSalutation(report.formTeacher)}
                    </span>
                  </p>
                  {report.coFormTeacher && (
                    <p className="text-foreground text-sm">
                      <span className="text-muted-foreground">
                        Co-form teacher:{' '}
                      </span>
                      <span className="font-semibold">
                        {stripSalutation(report.coFormTeacher)}
                      </span>
                    </p>
                  )}
                </div>
                <p className="text-muted-foreground mt-3 text-xs font-semibold">
                  {report.term} {report.academicYear} · Issued date:{' '}
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
            <div className="border-border bg-card shrink-0 border-t px-4 py-3">
              {acknowledged ? (
                <div className="flex items-center justify-center gap-1.5 py-1">
                  <CheckCircle2 className="text-lime-11 h-4 w-4" />
                  <span className="text-foreground text-xs font-semibold">
                    Acknowledged
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      disabled={!canAcknowledge}
                      onClick={() => setAcknowledged(true)}
                      className="flex-1"
                    >
                      Acknowledge report
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Download report (mock)"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-muted-foreground mt-2 text-center text-xs">
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
