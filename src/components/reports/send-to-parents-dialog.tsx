import { useEffect, useState } from 'react'
import { format, parse } from 'date-fns'
import { CalendarClock, Send } from 'lucide-react'

import type { ReminderType } from '@/types/form'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SendConfirmationSheet } from '@/components/comms/send-confirmation-sheet'
import { cn } from '@/lib/utils'

// 15-minute time slots, 7am–10pm — same convention as meetings.new.tsx's
// own buildTimeSlots(), reimplemented locally since that one isn't exported.
function buildTimeSlots(): Array<{ value: string; label: string }> {
  const slots: Array<{ value: string; label: string }> = []
  for (let min = 7 * 60; min <= 22 * 60; min += 15) {
    const h = Math.floor(min / 60)
    const m = min % 60
    const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    const period = h < 12 ? 'AM' : 'PM'
    slots.push({
      value,
      label: `${h12}:${String(m).padStart(2, '0')} ${period}`,
    })
  }
  return slots
}

const TIME_SLOTS = buildTimeSlots()

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
                <div className="bg-twblue-3 mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md px-3 py-2">
                  <span className="text-twblue-12 flex shrink-0 items-center gap-1.5 text-sm font-medium whitespace-nowrap">
                    <CalendarClock className="text-twblue-11 size-4 shrink-0" />
                    Send on
                  </span>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            'bg-background justify-start font-normal',
                            !scheduledDate && 'text-muted-foreground',
                          )}
                        />
                      }
                    >
                      {scheduledDate
                        ? format(
                            parse(scheduledDate, 'yyyy-MM-dd', new Date()),
                            'dd MMM yyyy',
                          )
                        : 'Pick a date'}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          scheduledDate
                            ? parse(scheduledDate, 'yyyy-MM-dd', new Date())
                            : undefined
                        }
                        disabled={{ before: new Date(today) }}
                        onSelect={(date) =>
                          setScheduledDate(date ? format(date, 'yyyy-MM-dd') : '')
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-twblue-11 text-sm whitespace-nowrap">
                    at
                  </span>
                  <Select
                    value={scheduledTime}
                    onValueChange={(v) => setScheduledTime(v ?? '')}
                  >
                    <SelectTrigger size="sm" className="bg-background w-28">
                      <SelectValue placeholder="Time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Acknowledge-by deadline */}
            <div className="space-y-1.5">
              <Label htmlFor="ack-deadline">Acknowledge by</Label>
              <div>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        id="ack-deadline"
                        type="button"
                        variant="outline"
                        size="sm"
                        className="bg-background justify-start font-normal"
                      />
                    }
                  >
                    {format(
                      parse(ackDeadline, 'yyyy-MM-dd', new Date()),
                      'dd MMM yyyy',
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parse(ackDeadline, 'yyyy-MM-dd', new Date())}
                      disabled={{ before: new Date(today) }}
                      onSelect={(date) => {
                        if (date) setAckDeadline(format(date, 'yyyy-MM-dd'))
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
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
                        <Popover>
                          <PopoverTrigger
                            render={
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className={cn(
                                  'bg-background justify-start font-normal',
                                  !reminderDate && 'text-muted-foreground',
                                )}
                              />
                            }
                          >
                            {reminderDate
                              ? format(
                                  parse(reminderDate, 'yyyy-MM-dd', new Date()),
                                  'dd MMM yyyy',
                                )
                              : 'Pick a date'}
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                reminderDate
                                  ? parse(reminderDate, 'yyyy-MM-dd', new Date())
                                  : undefined
                              }
                              disabled={{ before: new Date(today) }}
                              onSelect={(date) =>
                                setReminderDate(
                                  date ? format(date, 'yyyy-MM-dd') : '',
                                )
                              }
                            />
                          </PopoverContent>
                        </Popover>
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
              Review
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
