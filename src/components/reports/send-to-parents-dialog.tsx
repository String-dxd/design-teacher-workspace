import { useEffect, useState } from 'react'
import { CalendarClock, Send } from 'lucide-react'

import type { ReminderType } from '@/types/form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SendConfirmationSheet } from '@/components/comms/send-confirmation-sheet'

// Send-to-parents settings, captured fresh each time a teacher sends —
// mirrors the Posts composer's own granularity (schedule strip at
// announcements.new.tsx:1823-1859, due-date + reminder section at
// announcements.new.tsx:2660-2737) rather than a saved cycle-level default.
// Reminders are captured but never dispatched, matching Posts itself: the
// composer's reminder UI isn't wired to any send logic there either.

export interface SendToParentsSettings {
  scheduledAt?: string // ISO — set only when sending later
  ackDeadline: string // ISO date (yyyy-mm-dd)
  reminderType: ReminderType
  reminderDate?: string
}

interface SendToParentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  recipientClasses: Array<string>
  totalRecipients: number
  onConfirm: (settings: SendToParentsSettings) => void
}

function defaultAckDeadline(): string {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().split('T')[0]
}

const REMINDER_OPTIONS: Array<{ value: ReminderType; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'one-time', label: 'One Time' },
  { value: 'daily', label: 'Daily' },
]

export function SendToParentsDialog({
  open,
  onOpenChange,
  title,
  recipientClasses,
  totalRecipients,
  onConfirm,
}: SendToParentsDialogProps) {
  const [step, setStep] = useState<'settings' | 'confirm'>('settings')
  const [sendOption, setSendOption] = useState<'now' | 'scheduled'>('now')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [ackDeadline, setAckDeadline] = useState(defaultAckDeadline())
  const [reminderType, setReminderType] = useState<ReminderType>('none')
  const [reminderDate, setReminderDate] = useState('')

  // Reset to a clean settings form each time the dialog opens.
  useEffect(() => {
    if (!open) return
    setStep('settings')
    setSendOption('now')
    setScheduledDate('')
    setScheduledTime('')
    setAckDeadline(defaultAckDeadline())
    setReminderType('none')
    setReminderDate('')
  }, [open])

  const canSchedule =
    sendOption === 'now' || (scheduledDate !== '' && scheduledTime !== '')

  const scheduledAt =
    sendOption === 'scheduled' && scheduledDate && scheduledTime
      ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
      : undefined

  function handleContinue() {
    setStep('confirm')
  }

  function handleConfirm() {
    onConfirm({
      scheduledAt,
      ackDeadline: new Date(ackDeadline).toISOString(),
      reminderType,
      reminderDate: reminderDate
        ? new Date(reminderDate).toISOString()
        : undefined,
    })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <Dialog
        open={open && step === 'settings'}
        onOpenChange={(next) => {
          if (!next) onOpenChange(false)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send to parents</DialogTitle>
            <DialogDescription>
              Choose when to send, and set an acknowledgement deadline and
              reminders.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Send now / Schedule for later */}
            <div className="space-y-1.5">
              <Label>Delivery</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={sendOption === 'now' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSendOption('now')}
                >
                  <Send className="mr-1.5 size-3.5" />
                  Send now
                </Button>
                <Button
                  type="button"
                  variant={sendOption === 'scheduled' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSendOption('scheduled')}
                >
                  <CalendarClock className="mr-1.5 size-3.5" />
                  Schedule for later
                </Button>
              </div>
              {sendOption === 'scheduled' && (
                <div className="border-input mt-2 flex items-center gap-2 rounded-md border p-2">
                  <span className="text-muted-foreground text-sm">Send on</span>
                  <input
                    type="date"
                    value={scheduledDate}
                    min={today}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="border-input bg-background rounded-md border px-2.5 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
                  />
                  <span className="text-muted-foreground text-sm">at</span>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="border-input bg-background rounded-md border px-2.5 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              )}
            </div>

            {/* Acknowledge-by deadline */}
            <div className="space-y-1.5">
              <Label htmlFor="ack-deadline">Acknowledge by</Label>
              <input
                id="ack-deadline"
                type="date"
                value={ackDeadline}
                min={today}
                onChange={(e) => setAckDeadline(e.target.value)}
                className="border-input bg-background rounded-md border px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Reminders — captured, not dispatched (matches Posts) */}
            <div className="space-y-2">
              <Label>Send additional reminder(s) to parents</Label>
              <div className="space-y-2">
                {REMINDER_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="hdp-reminder"
                      value={opt.value}
                      checked={reminderType === opt.value}
                      onChange={() => setReminderType(opt.value)}
                      className="accent-primary size-3.5"
                    />
                    <span className="text-sm">{opt.label}</span>
                    {reminderType === opt.value && opt.value !== 'none' && (
                      <div className="ml-2 flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">
                          {opt.value === 'one-time' ? 'on' : 'from'}
                        </span>
                        <input
                          type="date"
                          value={reminderDate}
                          min={today}
                          onChange={(e) => setReminderDate(e.target.value)}
                          className="border-input bg-background rounded-md border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={!canSchedule} onClick={handleContinue}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SendConfirmationSheet
        open={open && step === 'confirm'}
        onOpenChange={(next) => {
          if (!next) setStep('settings')
        }}
        title={title}
        recipientClasses={recipientClasses}
        totalRecipients={totalRecipients}
        scheduledAt={scheduledAt}
        dueDate={ackDeadline}
        responseType="acknowledge"
        subject="report"
        onConfirm={handleConfirm}
      />
    </>
  )
}
