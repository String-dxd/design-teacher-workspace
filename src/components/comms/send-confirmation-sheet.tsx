import { CalendarClock, Send, Users, Zap } from 'lucide-react'
import type { ResponseType } from '@/types/form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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

        <div className="space-y-4">
          {/* Post title */}
          <div className="rounded-lg border bg-slate-50 px-4 py-3">
            <p className="text-sm font-medium text-slate-800">
              {title || 'Untitled post'}
            </p>
          </div>

          {/* Target audience */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Target audience
              </p>
            </div>
            {recipientClasses.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {recipientClasses.map((cls) => (
                  <span
                    key={cls}
                    className="rounded-md bg-twblue-2 px-2 py-0.5 text-xs font-medium text-twblue-9"
                  >
                    {cls}
                  </span>
                ))}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {totalRecipients > 0
                ? `${totalRecipients} parent${totalRecipients !== 1 ? 's' : ''} will be notified`
                : 'No recipients selected'}
            </p>
          </div>

          {/* Delivery */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              {isScheduled ? (
                <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Zap className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Delivery
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {isScheduled && scheduledAt
                ? `Scheduled for ${formatScheduledAt(scheduledAt)}`
                : 'Immediately via Parents Gateway'}
            </p>
          </div>

          {/* Response required — acknowledge / yes-no only */}
          {hasResponse && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Response required
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {responseType === 'acknowledge'
                    ? 'Acknowledgement'
                    : 'Yes / No'}
                </Badge>
                {dueDate && (
                  <span className="text-sm text-muted-foreground">
                    · due{' '}
                    {new Date(dueDate).toLocaleDateString('en-SG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
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
