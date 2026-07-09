import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

import type { HolisticReport, ReportBlock } from '@/types/report'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ReportPreview } from '@/components/reports/report-preview'

// Shared "how parents see it" preview: the report document inside a phone
// frame dressed as Parents Gateway, with the Acknowledge action a parent
// would tap. Extracted from the write page's inline dialog so the layout
// stage can offer the identical preview. The acknowledge tap is a local mock
// (it never writes to the cycle store) — the hub's Parents column tracks the
// real (simulated) acknowledgements after sending.

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
  const firstName = report.studentName.split(' ')[0] ?? report.studentName

  // Each preview session starts un-acknowledged.
  useEffect(() => {
    if (open) setAcknowledged(false)
  }, [open])

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
        <div className="mx-auto flex max-h-[70vh] w-[375px] max-w-full flex-col overflow-hidden rounded-2xl border">
          {/* Parents Gateway app chrome */}
          <div className="bg-twblue-3 shrink-0 border-b px-4 py-2.5">
            <p className="text-twblue-11 text-xs font-semibold">
              Parents Gateway
            </p>
            <p className="text-twblue-11/80 text-xs">
              Holistic Development Profile · {report.term}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
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
          {/* The parent's one action on the document */}
          <div className="bg-background shrink-0 border-t p-3">
            {acknowledged ? (
              <Button variant="outline" className="w-full" disabled>
                <CheckCircle2 className="text-lime-11 mr-2 size-4" />
                Acknowledged
              </Button>
            ) : (
              <Button className="w-full" onClick={() => setAcknowledged(true)}>
                Acknowledge {firstName}’s report
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
