import { Fragment, useMemo, useRef, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Check,
  FileText,
  Info,
  Paperclip,
  Plus,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ChangeEvent } from 'react'
import type { SelectedEntity } from '@/components/comms/entity-selector'
import { RichTextArea } from '@/components/comms/rich-text-area'
import { StudentRecipientSelector } from '@/components/comms/student-recipient-selector'
import { StaffSelector } from '@/components/comms/staff-selector'
import { EnquiryEmailSelector } from '@/components/comms/enquiry-email-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { mockMeetings } from '@/data/mock-meetings'

export const Route = createFileRoute('/meetings/new')({
  component: CreateMeetingPage,
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

const DURATION_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
]

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function formatTime12(time: string): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

function formatDateFull(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-SG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateMedium(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------

const STEPS = [
  'Basic Info',
  'Meeting Details',
  'Booking Period',
  'Preview',
] as const

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((label, i) => {
        const num = i + 1
        const done = num < current
        const active = num === current
        return (
          <Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold',
                  done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : active
                      ? 'border-primary text-primary'
                      : 'border-muted-foreground/25 text-muted-foreground/40',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : num}
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  done || active ? 'text-primary' : 'text-muted-foreground/40',
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'mb-5 h-px flex-1',
                  num < current ? 'bg-primary' : 'bg-muted-foreground/20',
                )}
              />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 1 | 2 | 3 | 4

interface MeetingDayEntry {
  date: string
  startTime: string
  endTime: string
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function CreateMeetingPage() {
  const navigate = useNavigate()

  // Step
  const [step, setStep] = useState<Step>(1)
  const [showErrors, setShowErrors] = useState(false)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [previewTab, setPreviewTab] = useState<'before' | 'open' | 'closed'>(
    'before',
  )

  // Step 1 — basic info
  const [recipients, setRecipients] = useState<Array<SelectedEntity>>([])
  const [staffInCharge, setStaffInCharge] = useState<Array<SelectedEntity>>([])
  const [enquiryEmail, setEnquiryEmail] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [venue, setVenue] = useState('')
  const [websiteLinks, setWebsiteLinks] = useState<
    Array<{ url: string; label: string }>
  >([])
  const [uploadedFiles, setUploadedFiles] = useState<Array<File>>([])
  const [fileDragOver, setFileDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 2 — meeting details
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [maxPerSlot, setMaxPerSlot] = useState<1 | 2 | 3 | null>(null)
  const [meetingDays, setMeetingDays] = useState<Array<MeetingDayEntry>>([
    { date: '', startTime: '', endTime: '' },
  ])

  // Step 3 — booking period
  const [bookingOpensDate, setBookingOpensDate] = useState('')
  const [bookingOpensTime, setBookingOpensTime] = useState('')
  const [bookingClosesDate, setBookingClosesDate] = useState('')
  const [bookingClosesTime, setBookingClosesTime] = useState('')

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const totalStudents = useMemo(
    () => recipients.reduce((s, r) => s + r.count, 0),
    [recipients],
  )

  const totalMeetings = useMemo(() => {
    if (!durationMinutes || !maxPerSlot) return 0
    return meetingDays.reduce((total, day) => {
      if (!day.startTime || !day.endTime) return total
      const mins = toMinutes(day.endTime) - toMinutes(day.startTime)
      if (mins <= 0) return total
      return total + Math.floor(mins / durationMinutes) * maxPerSlot
    }, 0)
  }, [meetingDays, durationMinutes, maxPerSlot])

  const reminders = useMemo(() => {
    if (!bookingOpensDate || !bookingClosesDate) return []

    const dayBefore = (dateStr: string) => {
      const d = new Date(dateStr + 'T00:00:00')
      d.setDate(d.getDate() - 1)
      return d.toLocaleDateString('en-SG', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    }

    return [
      {
        dateLabel: dayBefore(bookingOpensDate),
        time: '2:00 PM',
        context: '1 day before booking opens',
      },
      {
        dateLabel: dayBefore(bookingClosesDate),
        time: '10:00 AM',
        context: '1 day before booking closes',
      },
    ]
  }, [bookingOpensDate, bookingClosesDate])

  const previewSlots = useMemo(() => {
    const firstDay = meetingDays.find((d) => d.date && d.startTime && d.endTime)
    if (!firstDay || !durationMinutes) return []
    const start = toMinutes(firstDay.startTime)
    const end = toMinutes(firstDay.endTime)
    const slots: Array<string> = []
    for (
      let t = start;
      t + durationMinutes <= end && slots.length < 6;
      t += durationMinutes
    ) {
      const h = Math.floor(t / 60)
      const m = t % 60
      slots.push(
        formatTime12(
          `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        ),
      )
    }
    return slots
  }, [meetingDays, durationMinutes])

  const descriptionCharCount = description.replace(/<[^>]*>/g, '').length

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const step1Valid =
    recipients.length > 0 &&
    enquiryEmail !== '' &&
    title.trim() !== '' &&
    Boolean(description.trim()) &&
    description.trim() !== '<p></p>'

  const step2Valid =
    durationMinutes !== null &&
    maxPerSlot !== null &&
    meetingDays.some((d) => d.date && d.startTime && d.endTime)

  const step3Valid =
    bookingOpensDate !== '' &&
    bookingOpensTime !== '' &&
    bookingClosesDate !== '' &&
    bookingClosesTime !== ''

  const canProceed =
    step === 1
      ? step1Valid
      : step === 2
        ? step2Valid
        : step === 3
          ? step3Valid
          : true

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleNext() {
    if (!canProceed) {
      setShowErrors(true)
      return
    }
    setShowErrors(false)
    setStep((s) => (s + 1) as Step)
    window.scrollTo({ top: 0 })
  }

  function handleBack() {
    setShowErrors(false)
    setStep((s) => (s - 1) as Step)
    window.scrollTo({ top: 0 })
  }

  function handlePublish() {
    // Add to mock data and navigate
    const validDays = meetingDays.filter(
      (d) => d.date && d.startTime && d.endTime,
    )
    mockMeetings.unshift({
      id: `m-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      venue: venue.trim() || undefined,
      meetingDays: validDays,
      durationMinutes: durationMinutes!,
      maxPerSlot: maxPerSlot!,
      bookingOpens: `${bookingOpensDate}T${bookingOpensTime}:00`,
      bookingCloses: `${bookingClosesDate}T${bookingClosesTime}:00`,
      enquiryEmail,
      invitedCount: totalStudents,
      available: totalMeetings,
      booked: 0,
      pending: totalStudents,
    })
    toast.success('Meeting event published. Parents have been invited.')
    void navigate({ to: '/meetings/' })
  }

  // File handlers
  function processFiles(incoming: Array<File>) {
    const MAX_SIZE = 5 * 1024 * 1024
    const oversized = incoming.filter((f) => f.size > MAX_SIZE)
    const valid = incoming.filter((f) => f.size <= MAX_SIZE)
    if (oversized.length === 1) {
      toast.error(`"${oversized[0].name}" exceeds the 5 MB file size limit.`)
    } else if (oversized.length > 1) {
      toast.error(
        `${oversized.length} files exceed the 5 MB limit and were not added.`,
      )
    }
    const available = 3 - uploadedFiles.length
    if (available <= 0) return
    const added = valid.slice(0, available)
    if (added.length > 0) setUploadedFiles((prev) => [...prev, ...added])
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    processFiles(Array.from(e.target.files ?? []))
    e.target.value = ''
  }

  function removeFile(index: number) {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Website link handlers
  function addWebsiteLink() {
    if (websiteLinks.length >= 3) return
    setWebsiteLinks((prev) => [...prev, { url: '', label: '' }])
  }

  function updateWebsiteLink(
    index: number,
    field: 'url' | 'label',
    value: string,
  ) {
    setWebsiteLinks((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    )
  }

  function removeWebsiteLink(index: number) {
    setWebsiteLinks((prev) => prev.filter((_, i) => i !== index))
  }

  // Meeting day handlers
  function addMeetingDay() {
    setMeetingDays((prev) => [
      ...prev,
      { date: '', startTime: '', endTime: '' },
    ])
  }

  function removeMeetingDay(index: number) {
    setMeetingDays((prev) => prev.filter((_, i) => i !== index))
  }

  function updateMeetingDay(
    index: number,
    field: keyof MeetingDayEntry,
    value: string,
  ) {
    setMeetingDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    )
  }

  const nextLabel =
    step === 3 ? 'Preview' : step === 4 ? 'Publish Meeting' : 'Next'

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="flex items-center gap-4 px-6 py-4">
          <Button
            variant="ghost"
            size="icon"
            render={<Link to="/meetings" />}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-base font-semibold">
              Create new meeting event
            </h1>
            <p className="text-xs text-muted-foreground">
              Invite parents of selected students to book a meeting with you
            </p>
          </div>
        </div>
        <div className="px-6 pb-5">
          <StepIndicator current={step} />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-8">
        {/* ── Step 1: Basic Info ─────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <div>
              <h2 className="text-xl font-bold">
                Basic meeting event information
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Inform other staff and parents about this event
              </p>
            </div>

            {/* Recipients */}
            <section className="rounded-xl border bg-white p-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Recipients
              </h3>
              <div className="space-y-1.5">
                <Label>
                  Students <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Parents of the selected students will choose from the same set
                  of available booking slots.
                </p>
                <StudentRecipientSelector
                  value={recipients}
                  onChange={setRecipients}
                />
                {showErrors && recipients.length === 0 && (
                  <p className="text-xs text-destructive">
                    Select at least one student group.
                  </p>
                )}
              </div>

              <Separator className="my-5" />

              <div className="space-y-1.5">
                <Label>Staff-in-charge</Label>
                <p className="text-xs text-muted-foreground">
                  These staff will be able to view and edit responses, and
                  delete the meeting.
                </p>
                <StaffSelector
                  value={staffInCharge}
                  onChange={setStaffInCharge}
                />
              </div>

              <Separator className="my-5" />

              <div className="space-y-1.5">
                <Label>
                  Enquiry email <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Select the preferred email address to receive enquiries from
                  parents.
                </p>
                <EnquiryEmailSelector
                  value={enquiryEmail}
                  onChange={setEnquiryEmail}
                />
                {showErrors && !enquiryEmail && (
                  <p className="text-xs text-destructive">
                    Select an enquiry email.
                  </p>
                )}
              </div>
            </section>

            {/* Content */}
            <section className="rounded-xl border bg-white p-6">
              <h3 className="mb-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Content
              </h3>
              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <Label htmlFor="meeting-title">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <span
                      className={cn(
                        'text-xs tabular-nums',
                        title.length > 120
                          ? 'text-destructive'
                          : 'text-muted-foreground',
                      )}
                    >
                      {title.length}/120
                    </span>
                  </div>
                  <Input
                    id="meeting-title"
                    placeholder="e.g. PTM with Form/Math Teacher"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                  />
                  {showErrors && !title.trim() && (
                    <p className="text-xs text-destructive">
                      Title is required.
                    </p>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <Label>
                      Details <span className="text-destructive">*</span>
                    </Label>
                    <span
                      className={cn(
                        'text-xs tabular-nums',
                        descriptionCharCount > 2000
                          ? 'text-destructive'
                          : 'text-muted-foreground',
                      )}
                    >
                      {descriptionCharCount}/2000
                    </span>
                  </div>
                  <RichTextArea
                    value={description}
                    onChange={setDescription}
                    placeholder="Write your meeting details here. Use the toolbar to format text and insert inline links."
                    toolbar="simple"
                  />
                  {showErrors && !description.trim() && (
                    <p className="text-xs text-destructive">
                      Details are required.
                    </p>
                  )}
                </div>

                {/* Venue */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      Venue
                    </span>
                    <span
                      className={cn(
                        'text-xs tabular-nums text-muted-foreground',
                        venue.length > 100 && 'text-destructive',
                      )}
                    >
                      Optional · {venue.length}/100
                    </span>
                  </div>
                  <Input
                    placeholder="e.g. School hall, Library"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <Separator />

                {/* Links */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      Links
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Optional · {websiteLinks.length}/3
                    </span>
                  </div>
                  {websiteLinks.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="flex-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                          URL
                        </span>
                        <span className="w-48 shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                          Description{' '}
                          <span className="text-destructive">*</span>
                        </span>
                        <div className="w-6 shrink-0" />
                      </div>
                      {websiteLinks.map((link, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <Input
                            type="url"
                            placeholder="https://…"
                            value={link.url}
                            onChange={(e) =>
                              updateWebsiteLink(i, 'url', e.target.value)
                            }
                            className="h-8 flex-1 text-xs"
                          />
                          <Input
                            placeholder="e.g. School website"
                            value={link.label}
                            onChange={(e) =>
                              updateWebsiteLink(i, 'label', e.target.value)
                            }
                            className="h-8 w-48 shrink-0 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => removeWebsiteLink(i)}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {websiteLinks.length < 3 && (
                    <button
                      type="button"
                      onClick={addWebsiteLink}
                      className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {websiteLinks.length > 0
                        ? 'Add another link'
                        : 'Add link'}
                    </button>
                  )}
                </div>

                <Separator />

                {/* Files */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      Files
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Optional · {uploadedFiles.length}/3 · Max 5 MB each
                    </span>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-1.5">
                      {uploadedFiles.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                          <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-slate-700">
                              {file.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="shrink-0 rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {uploadedFiles.length < 3 && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setFileDragOver(true)
                      }}
                      onDragLeave={() => setFileDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setFileDragOver(false)
                        processFiles(Array.from(e.dataTransfer.files))
                      }}
                      className={cn(
                        'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-5 text-center transition-colors',
                        fileDragOver
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-slate-300 text-muted-foreground hover:border-slate-400 hover:bg-slate-50 hover:text-foreground',
                      )}
                    >
                      <Paperclip className="h-4 w-4" />
                      <p className="text-xs">
                        {fileDragOver
                          ? 'Drop files here'
                          : uploadedFiles.length > 0
                            ? 'Drop files or click to add more'
                            : 'Drop files here or click to browse'}
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </section>
          </>
        )}

        {/* ── Step 2: Meeting Details ─────────────────────────────────────── */}
        {step === 2 && (
          <>
            <section className="rounded-xl border bg-white p-6">
              <div className="mb-5">
                <h2 className="text-xl font-bold">Set meeting details</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Define the duration and meetings available per time slot
                </p>
              </div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Meeting Details
              </h3>
              <div className="space-y-5">
                {/* Duration */}
                <div className="space-y-1.5">
                  <Label>
                    Meeting duration <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    How long is each time slot?
                  </p>
                  <Select
                    value={durationMinutes?.toString() ?? ''}
                    onValueChange={(v) => setDurationMinutes(Number(v))}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value.toString()}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showErrors && !durationMinutes && (
                    <p className="text-xs text-destructive">
                      Select a meeting duration.
                    </p>
                  )}
                </div>

                <Separator />

                {/* Max per slot */}
                <div className="space-y-1.5">
                  <Label>
                    Max. number of meetings per time slot{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    E.g. if Form and Co-Form Teachers choose to meet the parents
                    of 2 students at the same time, they may select the option
                    'Two'
                  </p>
                  <div className="flex gap-3">
                    {([1, 2, 3] as const).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setMaxPerSlot(n)}
                        className={cn(
                          'flex flex-1 items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all',
                          maxPerSlot === n
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40',
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                            maxPerSlot === n
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground',
                          )}
                        >
                          {maxPerSlot === n && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <span
                          className={cn(
                            maxPerSlot === n ? 'font-semibold' : 'font-medium',
                          )}
                        >
                          {n === 1 ? 'One' : n === 2 ? 'Two' : 'Three'}
                        </span>
                      </button>
                    ))}
                  </div>
                  {showErrors && !maxPerSlot && (
                    <p className="text-xs text-destructive">
                      Select max meetings per slot.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-xl border bg-white p-6">
              <div className="mb-5">
                <h2 className="text-xl font-bold">
                  Set meeting event date and time
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Note: You will be able to block out time for lunch and other
                  matters separately after creating the meeting event
                </p>
              </div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Date and Time
              </h3>

              <div className="space-y-3">
                {meetingDays.map((day, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Day {i + 1} <span className="text-destructive">*</span>
                      </Label>
                      <input
                        type="date"
                        value={day.date}
                        onChange={(e) =>
                          updateMeetingDay(i, 'date', e.target.value)
                        }
                        className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">From</Label>
                      <Select
                        value={day.startTime}
                        onValueChange={(v) =>
                          updateMeetingDay(i, 'startTime', v)
                        }
                      >
                        <SelectTrigger size="sm" className="w-32">
                          <SelectValue placeholder="Start time" />
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
                    <span className="mb-2 text-muted-foreground">→</span>
                    <div className="space-y-1">
                      <Label className="text-xs">To</Label>
                      <Select
                        value={day.endTime}
                        onValueChange={(v) => updateMeetingDay(i, 'endTime', v)}
                      >
                        <SelectTrigger size="sm" className="w-32">
                          <SelectValue placeholder="End time" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.filter(
                            (s) => !day.startTime || s.value > day.startTime,
                          ).map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {meetingDays.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMeetingDay(i)}
                        className="mb-1 flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-slate-100 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addMeetingDay}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add day
                </button>
              </div>

              {/* Summary */}
              <div className="mt-6">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Summary
                </h3>
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs font-medium text-primary">
                    Based on your inputs
                  </p>
                  <p className="mt-2 text-sm">
                    There will be{' '}
                    <span className="text-2xl font-bold">{totalMeetings}</span>{' '}
                    meeting{totalMeetings !== 1 ? 's' : ''} available for
                    booking by the parents of{' '}
                    <span className="text-2xl font-bold">{totalStudents}</span>{' '}
                    students.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ── Step 3: Booking Period ──────────────────────────────────────── */}
        {step === 3 && (
          <>
            <div>
              <h2 className="text-xl font-bold">Set booking period</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Parents will be able to book a meeting within this period
              </p>
            </div>

            {/* Meeting event details summary */}
            <section className="rounded-xl border bg-white p-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Meeting Event Details
              </h3>
              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="font-semibold">
                  You have selected {meetingDays.filter((d) => d.date).length}{' '}
                  meeting day
                  {meetingDays.filter((d) => d.date).length !== 1 ? 's' : ''}
                </p>
                <div className="mt-3 space-y-2">
                  {meetingDays
                    .filter((d) => d.date)
                    .map((day, i) => (
                      <div key={i}>
                        <p className="font-semibold">
                          {formatDateFull(day.date)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime12(day.startTime)} –{' '}
                          {formatTime12(day.endTime)}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </section>

            {/* Booking details */}
            <section className="rounded-xl border bg-white p-6">
              <h3 className="mb-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Booking Details
              </h3>
              <div className="space-y-5">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-end gap-4">
                    {/* Booking opens */}
                    <div className="space-y-1.5">
                      <Label>
                        Booking opens{' '}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={bookingOpensDate}
                          onChange={(e) => setBookingOpensDate(e.target.value)}
                          className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                        />
                        <Select
                          value={bookingOpensTime}
                          onValueChange={setBookingOpensTime}
                        >
                          <SelectTrigger size="sm" className="w-32">
                            <SelectValue placeholder="Start time" />
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
                    </div>

                    <span className="mb-1.5 text-muted-foreground">→</span>

                    {/* Booking closes */}
                    <div className="space-y-1.5">
                      <Label>
                        Booking closes{' '}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={bookingClosesDate}
                          min={bookingOpensDate || undefined}
                          onChange={(e) => setBookingClosesDate(e.target.value)}
                          className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                        />
                        <Select
                          value={bookingClosesTime}
                          onValueChange={setBookingClosesTime}
                        >
                          <SelectTrigger size="sm" className="w-32">
                            <SelectValue placeholder="End time" />
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
                    </div>
                  </div>
                  {showErrors &&
                    (!bookingOpensDate ||
                      !bookingOpensTime ||
                      !bookingClosesDate ||
                      !bookingClosesTime) && (
                      <p className="text-xs text-destructive">
                        Set both booking open and close dates with times.
                      </p>
                    )}
                </div>

                <Separator />

                {/* Default reminders */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label>Default reminders to parents</Label>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  {reminders.length > 0 ? (
                    <div className="space-y-1">
                      {reminders.map((r, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 text-sm text-muted-foreground"
                        >
                          <Check className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            On{' '}
                            <span className="font-medium text-foreground">
                              {r.dateLabel}, from {r.time}
                            </span>{' '}
                            ({r.context})
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>
            </section>
          </>
        )}

        {/* ── Step 4: Preview ─────────────────────────────────────────────── */}
        {step === 4 && (
          <>
            <div>
              <h2 className="text-xl font-bold">Preview</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Review what you've set up before publishing
              </p>
            </div>

            {/* Meeting summary */}
            <section className="rounded-xl border bg-white p-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Meeting Summary
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Title</dt>
                  <dd className="font-medium">{title || '—'}</dd>
                </div>
                {venue && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Venue</dt>
                    <dd>{venue}</dd>
                  </div>
                )}
                <div>
                  <dt className="mb-1 text-xs text-muted-foreground">
                    Meeting days
                  </dt>
                  <dd className="space-y-0.5">
                    {meetingDays
                      .filter((d) => d.date)
                      .map((d, i) => (
                        <p key={i}>
                          {formatDateFull(d.date)}, {formatTime12(d.startTime)}{' '}
                          – {formatTime12(d.endTime)}
                        </p>
                      ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Slot duration
                  </dt>
                  <dd>
                    {durationMinutes} min ·{' '}
                    {maxPerSlot === 1 ? '1 parent' : `${maxPerSlot} parents`}{' '}
                    per slot
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Booking window
                  </dt>
                  <dd>
                    {formatDateMedium(bookingOpensDate)}{' '}
                    {formatTime12(bookingOpensTime)} –{' '}
                    {formatDateMedium(bookingClosesDate)}{' '}
                    {formatTime12(bookingClosesTime)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Total availability
                  </dt>
                  <dd className="font-semibold">
                    {totalMeetings} meeting slot
                    {totalMeetings !== 1 ? 's' : ''} for {totalStudents} student
                    {totalStudents !== 1 ? 's' : ''}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Parent view */}
            <section className="rounded-xl border bg-white p-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Parent View
              </h3>

              {/* Tab switcher */}
              <div className="mb-5 flex w-fit gap-1 rounded-full bg-muted p-1">
                {(
                  [
                    { id: 'before', label: 'Before booking' },
                    { id: 'open', label: 'Booking open' },
                    { id: 'closed', label: 'After booking' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPreviewTab(tab.id)}
                    className={cn(
                      'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                      previewTab === tab.id
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="rounded-xl border bg-slate-50 p-4">
                <p className="mb-3 text-xs text-muted-foreground">
                  {previewTab === 'before'
                    ? 'Parent sees this before booking opens'
                    : previewTab === 'open'
                      ? 'Parent sees this during the booking window'
                      : 'Parent sees this after booking closes'}
                </p>

                {/* Mock parent card */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h4 className="font-semibold">{title || 'Meeting title'}</h4>
                  {venue && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      📍 {venue}
                    </p>
                  )}
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {description || 'Meeting description will appear here.'}
                  </p>

                  {previewTab === 'before' && (
                    <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2.5">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      <p className="text-xs text-blue-700">
                        Booking opens on{' '}
                        <span className="font-semibold">
                          {bookingOpensDate
                            ? `${formatDateMedium(bookingOpensDate)} at ${formatTime12(bookingOpensTime)}`
                            : '[booking open date]'}
                        </span>
                      </p>
                    </div>
                  )}

                  {previewTab === 'open' && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-medium">
                        Select an available slot
                      </p>
                      {previewSlots.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {previewSlots.map((slot, i) => (
                            <div
                              key={i}
                              className={cn(
                                'rounded-lg border px-2 py-2 text-center text-xs',
                                i === 0
                                  ? 'border-primary bg-primary/5 font-medium text-primary'
                                  : 'border-slate-200 text-muted-foreground',
                              )}
                            >
                              {slot}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Fill in meeting days and duration to see available
                          slots.
                        </p>
                      )}
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        Booking closes{' '}
                        {bookingClosesDate
                          ? `${formatDateMedium(bookingClosesDate)} at ${formatTime12(bookingClosesTime)}`
                          : '—'}
                      </p>
                    </div>
                  )}

                  {previewTab === 'closed' && (
                    <div className="mt-4 rounded-lg bg-slate-50 px-4 py-4 text-center">
                      <p className="text-sm font-medium text-slate-700">
                        Booking period has ended
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        No further bookings can be made.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 z-10 flex items-center justify-between border-t bg-white px-6 py-4">
        {step > 1 ? (
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
        ) : (
          <div />
        )}
        <Button
          onClick={step === 4 ? () => setShowPublishDialog(true) : handleNext}
          disabled={!canProceed}
        >
          {nextLabel}
        </Button>
      </div>

      {/* Publish confirmation dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish meeting event?</DialogTitle>
            <DialogDescription>
              Once published, parents of the selected students will receive an
              invitation to book a meeting slot.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button onClick={handlePublish}>Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
