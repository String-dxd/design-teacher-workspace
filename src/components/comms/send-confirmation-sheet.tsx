import { CalendarClock, MessageSquare, Send, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { ResponseType } from '@/types/form'

interface SendConfirmationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  recipientClasses: Array<string>
  totalRecipients: number
  scheduledAt?: string // ISO string — if set, this is a scheduled send
  onConfirm: () => void
  responseType?: ResponseType
  dueDate?: string
}

function formatScheduledAt(iso: string): string {
  return new Date(iso).toLocaleString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function SummaryRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  )
}

export function SendConfirmationSheet({
  open,
  onOpenChange,
  title,
  recipientClasses,
  totalRecipients,
  scheduledAt,
  onConfirm,
  responseType,
  dueDate,
}: SendConfirmationSheetProps) {
  const isScheduled = Boolean(scheduledAt)
  const hasResponse =
    responseType === 'acknowledge' || responseType === 'yes-no'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isScheduled ? 'Schedule post?' : 'Send post?'}
          </DialogTitle>
          <DialogDescription>
            Review the details below before{' '}
            {isScheduled ? 'scheduling.' : 'sending to parents.'}
          </DialogDescription>
        </DialogHeader>

        {/* Summary card */}
        <div className="overflow-hidden rounded-xl border">
          {/* Post title */}
          <div className="bg-muted/40 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              {title || 'Untitled post'}
            </p>
          </div>

          {/* Recipients */}
          <div className="border-t">
            <SummaryRow icon={<Users className="h-4 w-4" />} label="Recipients">
              {recipientClasses.length > 0 && (
                <div className="mb-1.5 flex flex-wrap gap-1">
                  {recipientClasses.map((cls) => (
                    <span
                      key={cls}
                      className="rounded bg-twblue-2 px-1.5 py-0.5 text-xs font-medium text-twblue-9"
                    >
                      {cls}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-sm text-foreground">
                {totalRecipients > 0
                  ? `${totalRecipients} parent${totalRecipients !== 1 ? 's' : ''} will be notified`
                  : 'No recipients selected'}
              </p>
            </SummaryRow>
          </div>

          {/* Delivery */}
          <div className="border-t">
            <SummaryRow
              icon={
                isScheduled ? (
                  <CalendarClock className="h-4 w-4" />
                ) : (
                  <Zap className="h-4 w-4" />
                )
              }
              label="Delivery"
            >
              <p className="text-sm text-foreground">
                {isScheduled && scheduledAt
                  ? `Scheduled for ${formatScheduledAt(scheduledAt)}`
                  : 'Immediately via Parents Gateway'}
              </p>
            </SummaryRow>
          </div>

          {/* Response required — acknowledge / yes-no only */}
          {hasResponse && (
            <div className="border-t">
              <SummaryRow
                icon={<MessageSquare className="h-4 w-4" />}
                label="Response required"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      'bg-slate-100 text-slate-700',
                    )}
                  >
                    {responseType === 'acknowledge'
                      ? 'Acknowledgement'
                      : 'Yes / No'}
                  </span>
                  {dueDate && (
                    <span className="text-sm text-muted-foreground">
                      · due {formatDueDate(dueDate)}
                    </span>
                  )}
                </div>
              </SummaryRow>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            {isScheduled ? (
              <>
                <CalendarClock className="mr-2 h-4 w-4" />
                Confirm & schedule
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Confirm & send
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
