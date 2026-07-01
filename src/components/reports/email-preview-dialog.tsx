import { Mail, Send, X } from 'lucide-react'

import type { HolisticReport } from '@/types/report'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface EmailPreviewDialogProps {
  report: HolisticReport
  open: boolean
  onOpenChange: (open: boolean) => void
  recipientType: 'parent' | 'student'
  onSend: () => void
}

export function EmailPreviewDialog({
  report,
  open,
  onOpenChange,
  recipientType,
  onSend,
}: EmailPreviewDialogProps) {
  const isParent = recipientType === 'parent'
  const firstName =
    report.studentName.split(' ').filter((p) => p.length > 0)[0] ??
    report.studentName

  const fromAddress = 'Bandung School <noreply@bandung.edu.sg>'
  const toAddress = isParent
    ? `Parent/Guardian of ${report.studentName}`
    : `${report.studentName} <student@bandung.edu.sg>`
  const subject = isParent
    ? `Holistic Development Report - ${report.studentName} (${report.term} ${report.academicYear})`
    : `Your Holistic Development Report (${report.term} ${report.academicYear})`
  const greeting = isParent
    ? `Dear Parent/Guardian of ${firstName},`
    : `Dear ${firstName},`

  const reportUrl = `/report-view/${report.id}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] max-w-lg flex-col gap-0 overflow-hidden p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <DialogHeader className="flex-1">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Mail className="size-4" />
              Email Preview
            </DialogTitle>
          </DialogHeader>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Email header fields */}
        <div className="space-y-0 border-b bg-muted px-5 py-3 text-sm">
          <div className="flex gap-2 py-0.5">
            <span className="w-14 shrink-0 font-medium text-muted-foreground">
              From
            </span>
            <span className="text-foreground">{fromAddress}</span>
          </div>
          <div className="flex gap-2 py-0.5">
            <span className="w-14 shrink-0 font-medium text-muted-foreground">
              To
            </span>
            <span className="text-foreground">{toAddress}</span>
          </div>
          <div className="flex gap-2 py-0.5">
            <span className="w-14 shrink-0 font-medium text-muted-foreground">
              Subject
            </span>
            <span className="font-medium text-foreground">{subject}</span>
          </div>
        </div>

        {/* Email body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-4 text-sm leading-relaxed">
            <p>{greeting}</p>

            <p>
              The Holistic Development Report for {report.term}{' '}
              {report.academicYear} is now available for your review.
            </p>

            <div className="rounded-lg border bg-muted p-3 text-sm">
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">Student</span>
                <span className="font-medium">{report.studentName}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">Class</span>
                <span className="font-medium">{report.studentClass}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">Term</span>
                <span className="font-medium">
                  {report.term} {report.academicYear}
                </span>
              </div>
            </div>

            <p>Please click the button below to view the full report:</p>

            <div className="py-2 text-center">
              <a
                href={reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-auto inline-block rounded-lg bg-orange-9 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-10"
              >
                View Report
              </a>
              <p className="mt-1.5 text-xs text-muted-foreground">
                bandung.edu.sg{reportUrl}
              </p>
            </div>

            <p>
              If you have any questions, please contact the form teacher,{' '}
              {report.formTeacher}.
            </p>

            <div className="pt-2">
              <p>Best regards,</p>
              <p className="font-medium">Bandung School</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-orange-9 text-white hover:bg-orange-10"
            onClick={onSend}
          >
            <Send className="mr-2 size-4" />
            Send Email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
