import { CalendarClock, Send, Users } from 'lucide-react'
import type { ResponseType } from '@/types/form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/** One recipient chip as chosen on the compose page — same label and count
 * shown there (a class, level, CCA group, or individual student). */
export interface RecipientGroup {
  label: string
  count: number
}

interface SendConfirmationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  recipientGroups: Array<RecipientGroup>
  totalRecipients: number
  scheduledAt?: string // ISO string — if set, this is a scheduled send
  onConfirm: () => void
  responseType?: ResponseType
  dueDate?: string
  /** What's being sent — swaps "post" for "report" in the confirm copy. */
  subject?: 'post' | 'report'
}

function formatScheduledAt(iso: string): string {
  // en-SG lowercases am/pm by default; the time picker (TIME_SLOTS) shows
  // it uppercase, so match that here — same value, same casing everywhere.
  return new Date(iso)
    .toLocaleString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
    .replace(/\bam\b/, 'AM')
    .replace(/\bpm\b/, 'PM')
}

/** Quiet section label — the review reads as label/value pairs. */
function SummaryLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  )
}

export function SendConfirmationSheet({
  open,
  onOpenChange,
  title,
  recipientGroups,
  totalRecipients,
  scheduledAt,
  onConfirm,
  responseType,
  dueDate,
  subject = 'post',
}: SendConfirmationSheetProps) {
  const isScheduled = Boolean(scheduledAt)
  const hasResponse =
    responseType === 'acknowledge' || responseType === 'yes-no'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isScheduled ? `Schedule ${subject}?` : `Send ${subject}?`}
          </DialogTitle>
          <DialogDescription>
            Review the details before{' '}
            {isScheduled ? 'scheduling.' : 'sending to parents.'}
          </DialogDescription>
        </DialogHeader>

        {/* Label/value pairs, whitespace-separated — reviewable at a glance. */}
        <div className="space-y-4">
          <div className="space-y-1">
            <SummaryLabel>Title</SummaryLabel>
            <p className="text-sm font-semibold text-foreground">
              {title || 'Untitled post'}
            </p>
          </div>

          <div className="space-y-1.5">
            <SummaryLabel>Recipients</SummaryLabel>
            {recipientGroups.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {recipientGroups.map((g) => (
                  <span
                    key={g.label}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md bg-twblue-2 px-2 py-0.5 text-xs font-medium text-twblue-9"
                  >
                    <Users className="h-3 w-3 shrink-0" />
                    <span className="truncate">{g.label}</span>
                    <span className="opacity-60">· {g.count}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground">
                {totalRecipients > 0
                  ? `${totalRecipients} parent${totalRecipients !== 1 ? 's' : ''}`
                  : 'No recipients selected'}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <SummaryLabel>{isScheduled ? 'Scheduled' : 'Delivery'}</SummaryLabel>
            <p className="text-sm text-foreground">
              {isScheduled && scheduledAt
                ? formatScheduledAt(scheduledAt)
                : 'Immediately via Parents Gateway'}
            </p>
          </div>

          {/* Response due — acknowledge / yes-no only */}
          {hasResponse && (
            <div className="space-y-1">
              <SummaryLabel>Response due</SummaryLabel>
              <p className="text-sm text-foreground">
                {dueDate
                  ? `${new Date(dueDate).toLocaleDateString('en-SG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })} (${responseType === 'acknowledge' ? 'Acknowledgement' : 'Yes / No'})`
                  : responseType === 'acknowledge'
                    ? 'Acknowledgement'
                    : 'Yes / No'}
              </p>
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
                Schedule {subject}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send {subject}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
