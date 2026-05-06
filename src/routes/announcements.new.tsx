import { useEffect, useRef, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  ImagePlus,
  Info,
  Lock,
  MapPin,
  MoreHorizontal,
  Paperclip,
  Plus,
  Send,
  User,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ChangeEvent } from 'react'
import type {
  PGAnnouncement,
  PGRecipient,
  PGRole,
  PGWebsiteLink,
  Shortcut,
} from '@/types/pg-announcement'
import type { FormQuestion, ReminderType, ResponseType } from '@/types/form'
import type { SelectedEntity } from '@/components/comms/entity-selector'
import type { FileMeta } from '@/lib/draft-storage'
import { QuestionBuilder } from '@/components/comms/question-builder'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { StudentRecipientSelector } from '@/components/comms/student-recipient-selector'
import { SendConfirmationSheet } from '@/components/comms/send-confirmation-sheet'
import { RichTextArea } from '@/components/comms/rich-text-area'
import { PGShortcutsSelector } from '@/components/comms/pg-shortcuts-selector'
import { StaffSelector } from '@/components/comms/staff-selector'
import { EnquiryEmailSelector } from '@/components/comms/enquiry-email-selector'
import { mockStudents } from '@/data/mock-students'
import {
  getPGAnnouncementById,
  mockPGAnnouncements,
} from '@/data/mock-pg-announcements'
import { MOCK_STAFF, MOCK_STAFF_GROUPS } from '@/data/mock-staff'
import { PG_SHORTCUT_PRESETS } from '@/data/pg-shortcuts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent } from '@/components/ui/popover'
import { cn, stripSalutation } from '@/lib/utils'
import {
  clearDraft,
  daysRemaining,
  loadDraft,
  saveDraft,
} from '@/lib/draft-storage'

export const Route = createFileRoute('/announcements/new')({
  validateSearch: (search: Record<string, unknown>) => ({
    edit: typeof search.edit === 'string' ? search.edit : undefined,
    responseType:
      typeof search.responseType === 'string' ? search.responseType : undefined,
    resume: search.resume === 'true',
  }),
  component: NewAnnouncementPage,
})

type SendOption = 'now' | 'scheduled'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wrap bare URLs in <a> tags, leaving existing <a> blocks and HTML tags untouched. */
function linkifyHtml(html: string): string {
  return html.replace(
    /(<a\b[^>]*>[\s\S]*?<\/a>)|(<[^>]+>)|(https?:\/\/[^\s<>"']+)/g,
    (match, aBlock, tag, url) => {
      if (aBlock ?? tag) return match
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
    },
  )
}

// ---------------------------------------------------------------------------
// Upload helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Generates a compressed JPEG thumbnail (≤200 px wide/tall) as a base64 data URL. */
function generateThumbnail(file: File, maxPx = 200): Promise<string> {
  return new Promise((resolve) => {
    const blobUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(blobUrl)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl)
      resolve('')
    }
    img.src = blobUrl
  })
}

// ---------------------------------------------------------------------------
// Response type card mockups
// ---------------------------------------------------------------------------
function AcknowledgeMockup() {
  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="h-2 w-2/3 rounded-full bg-slate-300" />
      <div className="h-1.5 w-full rounded-full bg-slate-200" />
      <div className="h-1.5 w-5/6 rounded-full bg-slate-200" />
      <div className="mt-1 flex h-7 items-center justify-center rounded-md bg-primary/80">
        <div className="h-1.5 w-14 rounded-full bg-white/70" />
      </div>
    </div>
  )
}

function YesNoMockup() {
  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="h-2 w-2/3 rounded-full bg-slate-300" />
      <div className="h-1.5 w-full rounded-full bg-slate-200" />
      <div className="mt-1 flex gap-2">
        <div className="flex h-7 flex-1 items-center justify-center rounded-md bg-green-100 text-[9px] font-semibold text-green-700">
          Yes
        </div>
        <div className="flex h-7 flex-1 items-center justify-center rounded-md bg-red-100 text-[9px] font-semibold text-red-700">
          No
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Preview pane — mirrors the Parents Gateway app layout as seen by parents
// ---------------------------------------------------------------------------

type AnnouncementPreviewScreen =
  | 'main'
  | 'submitted'
  | { questionId: string; responseChoice: 'yes' | 'no' }
  | { screen: 'photos'; index: number }

interface AnnouncementPreviewProps {
  title: string
  description: string
  shortcuts: Array<Shortcut>
  staffInCharge: string
  enquiryEmail: string
  recipients: Array<SelectedEntity>
  responseType: ResponseType
  dueDate?: string
  questions?: Array<FormQuestion>
  editingQuestionId?: string | null
  venue?: string
  eventStart?: string
  eventStartTime?: string
  eventEnd?: string
  eventEndTime?: string
  uploadedFiles?: Array<File>
  uploadedPhotos?: Array<{ file: File; url: string }>
  websiteLinks?: Array<PGWebsiteLink>
  draftFilesMeta?: Array<FileMeta>
}

function AnnouncementPreview({
  title,
  description,
  shortcuts,
  staffInCharge,
  enquiryEmail,
  recipients,
  responseType,
  dueDate,
  questions = [],
  editingQuestionId,
  venue = '',
  eventStart = '',
  eventStartTime = '',
  eventEnd = '',
  eventEndTime = '',
  uploadedFiles = [],
  uploadedPhotos = [],
  websiteLinks = [],
  draftFilesMeta = [],
}: AnnouncementPreviewProps) {
  const totalCount = recipients.reduce((s, r) => s + r.count, 0)
  const [screen, setScreen] = useState<AnnouncementPreviewScreen>('main')

  // Reset to main when responseType changes
  useEffect(() => {
    setScreen('main')
  }, [responseType])

  // Auto-navigate to question being edited
  useEffect(() => {
    if (!editingQuestionId) return
    setScreen({ questionId: editingQuestionId, responseChoice: 'yes' })
  }, [editingQuestionId])

  const previewDate = new Date()
    .toLocaleDateString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    .toUpperCase()
  const previewTime = new Date()
    .toLocaleTimeString('en-SG', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toUpperCase()
  const timestamp = `${previewDate}, ${previewTime}`

  const formattedDueDate = dueDate
    ? new Date(dueDate).toLocaleDateString('en-SG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'DD Mmm YYYY'

  const formattedEventDate = (() => {
    if (!eventStart) return ''
    const startDate = new Date(`${eventStart}T${eventStartTime || '00:00'}`)
    const dateOpts: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
    const startDateStr = startDate.toLocaleDateString('en-SG', dateOpts)
    const startTimeStr = eventStartTime
      ? startDate
          .toLocaleTimeString('en-SG', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })
          .toUpperCase()
      : ''

    if (!eventEnd) {
      return startTimeStr ? `${startDateStr}, ${startTimeStr}` : startDateStr
    }

    const endDate = new Date(`${eventEnd}T${eventEndTime || '00:00'}`)
    const sameDay = eventStart === eventEnd
    if (sameDay) {
      const endTimeStr = eventEndTime
        ? endDate
            .toLocaleTimeString('en-SG', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })
            .toUpperCase()
        : ''
      return startTimeStr && endTimeStr
        ? `${startDateStr}, ${startTimeStr} – ${endTimeStr}`
        : startDateStr
    }

    const endDateStr = endDate.toLocaleDateString('en-SG', dateOpts)
    return `${startDateStr} – ${endDateStr}`
  })()

  // Question screen helpers
  const isMainScreen = screen === 'main'
  const isSubmittedScreen = screen === 'submitted'
  const isPhotoScreen =
    typeof screen === 'object' &&
    'screen' in screen &&
    screen.screen === 'photos'
  const isQuestionScreen = !isMainScreen && !isSubmittedScreen && !isPhotoScreen
  const screenChoice = isQuestionScreen
    ? (screen as { questionId: string; responseChoice: 'yes' | 'no' })
        .responseChoice
    : 'yes'
  const currentQuestionId = isQuestionScreen
    ? (screen as { questionId: string; responseChoice: 'yes' | 'no' })
        .questionId
    : null
  const photoViewerIndex = isPhotoScreen
    ? (screen as { screen: 'photos'; index: number }).index
    : 0

  function getRelevantQuestions(_choice: 'yes' | 'no') {
    return questions
  }

  const relevantQuestions = getRelevantQuestions(screenChoice)
  const currentQIndex = relevantQuestions.findIndex(
    (q) => q.id === currentQuestionId,
  )
  const currentQ = relevantQuestions[currentQIndex] ?? null
  const isLastQ = currentQIndex === relevantQuestions.length - 1
  const progressPct = isSubmittedScreen
    ? 100
    : isQuestionScreen
      ? ((currentQIndex + 1) / Math.max(relevantQuestions.length, 1)) * 100
      : 0

  function handleYesClick() {
    const qs = getRelevantQuestions('yes')
    if (qs.length > 0)
      setScreen({ questionId: qs[0].id, responseChoice: 'yes' })
  }
  function handleNoClick() {
    const qs = getRelevantQuestions('no')
    if (qs.length > 0) setScreen({ questionId: qs[0].id, responseChoice: 'no' })
  }
  function handleNextQuestion() {
    const next = relevantQuestions[currentQIndex + 1]
    if (next) setScreen({ questionId: next.id, responseChoice: screenChoice })
    else setScreen('submitted')
  }
  function handleNavBack() {
    if (isQuestionScreen || isSubmittedScreen || isPhotoScreen)
      setScreen('main')
  }

  // ---------------------------------------------------------------------------
  // Main announcement content (shared across all screens)
  // ---------------------------------------------------------------------------
  const announcementContent = (
    <div className="flex-1 divide-y divide-slate-100 overflow-y-auto bg-white">
      {/* Photo gallery — full-width carousel preview */}
      {uploadedPhotos.length > 0 && (
        <div
          className="relative cursor-pointer"
          onClick={() => setScreen({ screen: 'photos', index: 0 })}
        >
          <img
            src={uploadedPhotos[0].url}
            alt={uploadedPhotos[0].file.name}
            className="aspect-[16/9] w-full object-cover"
          />
          {/* Photo count badge */}
          {uploadedPhotos.length > 1 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-slate-900/60 px-2.5 py-1 text-[10px] font-medium text-white">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                className="h-3 w-3"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="8" cy="8" r="5" />
                <line x1="8" y1="5" x2="8" y2="8" />
                <line x1="8" y1="8" x2="10" y2="8" />
                <circle cx="8" cy="8" r="0.5" fill="currentColor" />
              </svg>
              {uploadedPhotos.length} photos
            </div>
          )}
        </div>
      )}

      {/* Announcement header */}
      <div className="px-4 py-4">
        {title ? (
          <h3 className="text-sm font-bold leading-snug text-slate-900">
            {title}
          </h3>
        ) : (
          <h3 className="text-sm font-bold leading-snug text-slate-300">
            Title
          </h3>
        )}
        <p className="mt-1 text-[10px] text-slate-400">
          {timestamp}
          {' · DANIEL TAN'}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <User className="h-3 w-3 shrink-0 text-slate-400" />
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            STUDENT NAME
          </p>
        </div>
        {responseType !== 'view-only' && venue && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
            <p className="text-[11px] text-slate-600">{venue}</p>
          </div>
        )}
        {responseType !== 'view-only' && eventStart && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3 shrink-0 text-blue-500" />
            <p className="text-[11px] font-medium text-blue-600">
              {formattedEventDate}
            </p>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="px-4 py-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Details
        </p>
        {description ? (
          <div
            className="text-xs leading-relaxed text-slate-700 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-slate-200 [&_blockquote]:pl-2 [&_blockquote]:italic [&_h1]:text-sm [&_h1]:font-bold [&_h2]:text-xs [&_h2]:font-semibold [&_h3]:text-xs [&_h3]:font-semibold [&_mark]:bg-yellow-100 [&_ol]:ml-4 [&_ol]:list-decimal [&_ul]:ml-4 [&_ul]:list-disc"
            dangerouslySetInnerHTML={{ __html: linkifyHtml(description) }}
          />
        ) : (
          <p className="text-xs leading-relaxed text-slate-300">
            Your post details will appear here.
          </p>
        )}
      </div>

      {/* Shortcuts */}
      {shortcuts.length > 0 && (
        <div className="px-4 py-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Shortcuts
          </p>
          <div className="space-y-2">
            {shortcuts.map((s, i) => {
              const preset = PG_SHORTCUT_PRESETS.find((p) => p.url === s.url)
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5"
                >
                  {preset ? (
                    <span className="text-base leading-none">
                      {preset.emoji}
                    </span>
                  ) : (
                    <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
                  )}
                  <span className="text-xs font-semibold text-slate-800">
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Website links */}
      {websiteLinks.filter((l) => l.url).length > 0 && (
        <div className="px-4 py-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Website links
          </p>
          <div className="space-y-2">
            {websiteLinks
              .filter((l) => l.url)
              .map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 hover:bg-slate-50"
                >
                  <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate text-xs font-semibold text-slate-800">
                    {link.label || link.url}
                  </span>
                </a>
              ))}
          </div>
        </div>
      )}

      {/* Attachments — real uploads + draft-seeded stubs */}
      {(uploadedFiles.length > 0 || draftFilesMeta.length > 0) && (
        <div className="px-4 py-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Attachments
          </p>
          <div className="space-y-2">
            {uploadedFiles.map((file, i) => (
              <div
                key={`upload-${i}`}
                className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5"
              >
                <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-800">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            ))}
            {draftFilesMeta.map((meta, i) => (
              <div
                key={`draft-${i}`}
                className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5"
              >
                <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-800">
                    {meta.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {formatFileSize(meta.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enquiry footer */}
      <div className="px-4 py-5">
        <p className="text-center text-[10px] italic text-slate-500">
          For enquiries on this post, please contact{' '}
          {enquiryEmail ? (
            <span className="not-italic text-primary">{enquiryEmail}</span>
          ) : (
            <span className="not-italic text-slate-300">
              enquiry@school.edu.sg
            </span>
          )}
        </p>
      </div>
    </div>
  )

  // ---------------------------------------------------------------------------
  // Main screen (with footer based on responseType)
  // ---------------------------------------------------------------------------
  const mainScreenContent = (
    <div className="flex flex-1 flex-col overflow-hidden">
      {announcementContent}

      {/* Footer — varies by responseType */}
      {responseType === 'acknowledge' && (
        <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="shrink-0">
              <p className="text-[10px] text-slate-400">
                Please acknowledge by
              </p>
              <p className="text-xs font-bold text-slate-700">
                {formattedDueDate}
              </p>
            </div>
            <div className="whitespace-nowrap rounded-lg bg-[#c47565] px-4 py-1.5 text-[11px] font-semibold text-white opacity-80">
              Acknowledge
            </div>
          </div>
        </div>
      )}

      {responseType === 'yes-no' && (
        <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="shrink-0">
              <p className="text-[10px] text-slate-400">Please respond by</p>
              <p className="text-xs font-bold text-slate-700">
                {formattedDueDate}
              </p>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={questions.length === 0}
                onClick={handleYesClick}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition-opacity',
                  questions.length > 0
                    ? 'bg-[#c47565] hover:opacity-90'
                    : 'cursor-not-allowed bg-slate-300',
                )}
              >
                Yes
              </button>
              <button
                type="button"
                disabled={questions.length === 0}
                onClick={handleNoClick}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-opacity',
                  questions.length > 0
                    ? 'border-[#c47565] text-[#c47565] hover:opacity-80'
                    : 'cursor-not-allowed border-slate-300 text-slate-300',
                )}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ---------------------------------------------------------------------------
  // Question screen
  // ---------------------------------------------------------------------------
  const questionScreenContent = currentQ ? (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Progress bar */}
      <div className="shrink-0 border-b border-slate-100 bg-white px-4 pb-2 pt-2">
        <div className="flex items-center justify-between">
          <div className="mr-3 h-0.5 flex-1 rounded-full bg-slate-100">
            <div
              className="h-0.5 rounded-full bg-slate-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="shrink-0 text-[10px] text-slate-400">
            Q{currentQIndex + 1} of {relevantQuestions.length}
          </span>
        </div>
      </div>

      {/* Question body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="mb-4 text-[11px] font-medium leading-snug text-slate-800">
          {currentQ.required && <span className="text-red-500">* </span>}
          {currentQ.text || (
            <span className="text-slate-300">Question text</span>
          )}
        </p>

        {currentQ.type === 'free-text' && (
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[11px] text-slate-300">
              Type your answer here...
            </p>
            <p className="mt-8 text-right text-[10px] text-slate-300">
              500 characters left
            </p>
          </div>
        )}

        {currentQ.type === 'mcq' && (
          <div className="space-y-2">
            {(currentQ.options ?? []).map((opt, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2"
              >
                <div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-slate-300" />
                <span className="text-[11px] text-slate-700">{opt}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Next / Submit footer */}
      <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">
        <button
          type="button"
          onClick={handleNextQuestion}
          className="w-full rounded-lg bg-slate-700 py-2 text-[11px] font-semibold text-white hover:bg-slate-800"
        >
          {isLastQ ? 'Submit' : 'Next →'}
        </button>
      </div>
    </div>
  ) : null

  // ---------------------------------------------------------------------------
  // Submitted screen
  // ---------------------------------------------------------------------------
  const submittedContent = (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-100 bg-white px-4 pb-2 pt-2">
        <div className="flex items-center justify-between">
          <div className="mr-3 h-0.5 flex-1 rounded-full bg-slate-100">
            <div className="h-0.5 w-full rounded-full bg-slate-500" />
          </div>
          <span className="shrink-0 text-[10px] text-slate-400">Done</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        </div>
        <p className="text-center text-sm font-semibold text-slate-800">
          Response submitted
        </p>
        <p className="text-center text-[11px] leading-relaxed text-slate-400">
          This is a preview —<br />
          no data was sent.
        </p>
      </div>
      <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => setScreen('main')}
          className="w-full rounded-lg border border-slate-200 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to start
        </button>
      </div>
    </div>
  )

  // ---------------------------------------------------------------------------
  // Photo viewer screen — full-screen gallery within the phone frame
  // ---------------------------------------------------------------------------
  const photoViewerContent = (
    <div className="relative flex h-full flex-col bg-black">
      {/* Image fills the space */}
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <img
          src={uploadedPhotos[photoViewerIndex]?.url}
          alt={uploadedPhotos[photoViewerIndex]?.file.name}
          className="max-h-full w-full object-contain"
        />
      </div>

      {/* Prev / Next tap zones */}
      {photoViewerIndex > 0 && (
        <button
          type="button"
          aria-label="Previous photo"
          onClick={() =>
            setScreen({ screen: 'photos', index: photoViewerIndex - 1 })
          }
          className="absolute left-0 top-0 h-full w-1/3 focus:outline-none"
        >
          <div className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/50">
            <ChevronLeft className="h-4 w-4 text-white" />
          </div>
        </button>
      )}
      {photoViewerIndex < uploadedPhotos.length - 1 && (
        <button
          type="button"
          aria-label="Next photo"
          onClick={() =>
            setScreen({ screen: 'photos', index: photoViewerIndex + 1 })
          }
          className="absolute right-0 top-0 h-full w-1/3 focus:outline-none"
        >
          <div className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/50">
            <ChevronRight className="h-4 w-4 text-white" />
          </div>
        </button>
      )}

      {/* Dot indicators */}
      {uploadedPhotos.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
          {uploadedPhotos.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setScreen({ screen: 'photos', index: i })}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === photoViewerIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40',
              )}
            />
          ))}
        </div>
      )}

      {/* Top chrome: back + counter */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-slate-900/60 to-transparent px-3 py-2.5">
        <button
          type="button"
          onClick={handleNavBack}
          className="flex h-6 w-6 items-center justify-center"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
        <span className="text-[10px] font-medium text-white/80">
          {photoViewerIndex + 1} / {uploadedPhotos.length}
        </span>
        <div className="w-6" /> {/* spacer */}
      </div>
    </div>
  )

  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      {/* Card header */}
      <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
        <span className="text-sm font-semibold">Preview</span>
      </div>

      <div className="p-4">
        <p className="mb-3 text-xs text-muted-foreground">
          This is how parents will see your post on the Parents Gateway App.
        </p>

        {/* Phone mockup */}
        <div className="mx-auto max-w-[272px]">
          <div className="relative h-[520px] overflow-hidden rounded-[28px] border-[7px] border-slate-900 bg-white shadow-md">
            {/* Nav bar — hidden on photo viewer (it has its own chrome), transparent on main+photo, white otherwise */}
            {!isPhotoScreen &&
              (() => {
                const photoOnMain = uploadedPhotos.length > 0 && isMainScreen
                return (
                  <div
                    className={cn(
                      'absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 py-2.5',
                      photoOnMain
                        ? 'bg-gradient-to-b from-slate-900/40 to-transparent'
                        : 'border-b border-slate-100 bg-white',
                    )}
                  >
                    <ChevronLeft
                      className={cn(
                        'h-5 w-5 transition-colors',
                        isQuestionScreen || isSubmittedScreen
                          ? 'cursor-pointer text-slate-600 hover:text-slate-900'
                          : photoOnMain
                            ? 'text-white'
                            : 'text-slate-400',
                      )}
                      onClick={handleNavBack}
                    />
                    <div
                      className={cn(
                        'flex items-center gap-3',
                        photoOnMain ? 'text-white' : 'text-slate-400',
                      )}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                      <ArrowDown className="h-3.5 w-3.5" />
                      <MoreHorizontal className="h-4 w-4" />
                    </div>
                  </div>
                )
              })()}

            {/* Content — scrollable, padded top only when no photo overlay */}
            {isPhotoScreen ? (
              photoViewerContent
            ) : (
              <div
                className={cn(
                  'flex h-full flex-col',
                  uploadedPhotos.length === 0 ||
                    isQuestionScreen ||
                    isSubmittedScreen
                    ? 'pt-[42px]'
                    : '',
                )}
              >
                {isSubmittedScreen
                  ? submittedContent
                  : isQuestionScreen
                    ? questionScreenContent
                    : mainScreenContent}
              </div>
            )}
          </div>
        </div>

        {/* Recipient count */}
        {totalCount > 0 && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Sending to {totalCount} parent{totalCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------
function isDescriptionEmpty(html: string): boolean {
  // Treat empty string or a bare empty-paragraph as empty
  return !html.trim() || html.trim() === '<p></p>'
}

interface MissingField {
  field: string
  hint: string
}

function getMissingFields(
  sendOption: SendOption,
  title: string,
  description: string,
  recipients: Array<SelectedEntity>,
  enquiryEmail: string,
  responseType: string,
  dueDate: string,
  scheduledDate: string,
  scheduledTime: string,
): Array<MissingField> {
  const missing: Array<MissingField> = []
  if (!title.trim()) missing.push({ field: 'Title', hint: 'Add a title' })
  if (isDescriptionEmpty(description))
    missing.push({ field: 'Details', hint: 'Write the post details' })
  if (recipients.length === 0)
    missing.push({ field: 'Recipients', hint: 'Select at least one recipient' })
  if (!enquiryEmail.trim())
    missing.push({ field: 'Enquiry email', hint: 'Select an enquiry email' })
  if (responseType !== 'view-only' && !dueDate)
    missing.push({ field: 'Due date', hint: 'Set a due date for responses' })
  if (sendOption === 'scheduled' && (!scheduledDate || !scheduledTime))
    missing.push({
      field: 'Send date & time',
      hint: 'Choose when to send this post',
    })
  return missing
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
function NewAnnouncementPage() {
  const {
    edit: editId,
    responseType: initialResponseType,
    resume,
  } = Route.useSearch()
  const isEditing = Boolean(editId)
  const existingAnnouncement = editId
    ? getPGAnnouncementById(editId)
    : undefined
  // When editing a posted post: lock content/recipients/shortcuts, show "Save changes"
  const isEditingPosted = existingAnnouncement?.status === 'posted'

  useSetBreadcrumbs([
    { label: 'Posts', href: '/announcements' },
    {
      label: isEditing ? 'Edit Post' : 'New Post',
      href: '/announcements/new',
    },
  ])

  // Resolve effective response type: URL param takes priority, then existing announcement data
  const resolvedResponseType: ResponseType =
    initialResponseType === 'acknowledge' || initialResponseType === 'yes-no'
      ? initialResponseType
      : existingAnnouncement?.responseType === 'acknowledge' ||
          existingAnnouncement?.responseType === 'yes-no'
        ? (existingAnnouncement.responseType as ResponseType)
        : 'view-only'

  const showResponseSection = resolvedResponseType !== 'view-only'

  const navigate = useNavigate()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [shortcuts, setShortcuts] = useState<Array<Shortcut>>([])
  const [websiteLinks, setWebsiteLinks] = useState<Array<PGWebsiteLink>>([])
  const [recipients, setRecipients] = useState<Array<SelectedEntity>>([])
  const [staffInCharge, setStaffInCharge] = useState<Array<SelectedEntity>>([])
  const [staffRoles, setStaffRoles] = useState<Record<string, PGRole>>({})
  const [enquiryEmail, setEnquiryEmail] = useState('')

  // Attachment state
  const [uploadedFiles, setUploadedFiles] = useState<Array<File>>([])
  const [uploadedPhotos, setUploadedPhotos] = useState<
    Array<{ file: File; url: string }>
  >([])
  const [coverPhotoIndices, setCoverPhotoIndices] = useState<Set<number>>(
    new Set(),
  )
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragSourceIndex = useRef<number | null>(null)
  const [fileDragOver, setFileDragOver] = useState(false)
  const [photoDragOver, setPhotoDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // Response type — seeded from resolvedResponseType so editing a draft with responses shows the right section immediately
  const [responseType, setResponseType] =
    useState<ResponseType>(resolvedResponseType)
  const [dueDate, setDueDate] = useState(() => {
    if (!existingAnnouncement?.dueDate) return ''
    const d = new Date(existingAnnouncement.dueDate)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  })
  const [reminderType, setReminderType] = useState<ReminderType>('none')
  const [reminderDate, setReminderDate] = useState('')
  const [questions, setQuestions] = useState<Array<FormQuestion>>([])
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  )

  // Event details (acknowledge + yes-no)
  const [eventStart, setEventStart] = useState('')
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventEnd, setEventEnd] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [venue, setVenue] = useState('')

  function handleResponseTypeChange(type: ResponseType) {
    setResponseType(type)
    if (type === 'view-only') {
      setDueDate('')
      setReminderType('none')
      setReminderDate('')
      setQuestions([])
      setEditingQuestionId(null)
      setEventStart('')
      setEventStartTime('')
      setEventEnd('')
      setEventEndTime('')
      setVenue('')
    }
  }

  // Send options
  const [sendOption, setSendOption] = useState<SendOption>('now')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('08:00')

  // UI state
  const [showConfirmSheet, setShowConfirmSheet] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Per-file upload metadata — mirrors uploadedFiles / uploadedPhotos (current session)
  const [filesMeta, setFilesMeta] = useState<Array<FileMeta>>([])
  const [photosMeta, setPhotosMeta] = useState<Array<FileMeta>>([])
  // Stubs loaded from a previous draft session (no blob available, shown as placeholders)
  const [draftFilesMeta, setDraftFilesMeta] = useState<Array<FileMeta>>([])
  const [draftPhotosMeta, setDraftPhotosMeta] = useState<Array<FileMeta>>([])
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [fileBannerDismissed, setFileBannerDismissed] = useState(false)

  // Debounced auto-save — persists to localStorage 2 s after any form state change
  useEffect(() => {
    if (isEditing) return
    const hasContent =
      title.trim() ||
      description.replace(/<[^>]*>/g, '').trim() ||
      recipients.length > 0 ||
      filesMeta.length > 0 ||
      draftFilesMeta.length > 0 ||
      photosMeta.length > 0 ||
      draftPhotosMeta.length > 0
    if (!hasContent) return
    const timer = setTimeout(() => {
      setIsSaving(true)
      saveDraft({
        savedAt: new Date().toISOString(),
        title,
        description,
        shortcuts,
        websiteLinks,
        recipients,
        staffInCharge,
        enquiryEmail,
        responseType,
        dueDate,
        reminderType,
        reminderDate,
        questions,
        eventStart,
        eventStartTime,
        eventEnd,
        eventEndTime,
        venue,
        sendOption,
        scheduledDate,
        scheduledTime,
        filesMeta: [...draftFilesMeta, ...filesMeta],
        photosMeta: [...draftPhotosMeta, ...photosMeta],
        coverPhotoIndices: [...coverPhotoIndices],
        staffRoles,
      })
      setTimeout(() => {
        setIsSaving(false)
        setSavedAt(new Date())
      }, 400)
    }, 2000)
    return () => clearTimeout(timer)
  }, [
    isEditing,
    title,
    description,
    shortcuts,
    websiteLinks,
    recipients,
    staffInCharge,
    staffRoles,
    enquiryEmail,
    responseType,
    dueDate,
    reminderType,
    reminderDate,
    questions,
    eventStart,
    eventStartTime,
    eventEnd,
    eventEndTime,
    venue,
    sendOption,
    scheduledDate,
    scheduledTime,
    filesMeta,
    draftFilesMeta,
    photosMeta,
    draftPhotosMeta,
    coverPhotoIndices,
  ])

  // Pre-fill from existing announcement (edit) or restore from localStorage draft (?resume=true only)
  useEffect(() => {
    if (!existingAnnouncement) {
      const draft = resume ? loadDraft() : null
      if (draft) {
        setTitle(draft.title)
        setDescription(draft.description)
        setShortcuts(draft.shortcuts ?? [])
        setWebsiteLinks(draft.websiteLinks ?? [])
        setRecipients(draft.recipients ?? [])
        setStaffInCharge(draft.staffInCharge ?? [])
        setEnquiryEmail(draft.enquiryEmail ?? '')
        setResponseType(draft.responseType ?? 'view-only')
        setDueDate(draft.dueDate ?? '')
        setReminderType(draft.reminderType ?? 'none')
        setReminderDate(draft.reminderDate ?? '')
        setQuestions(draft.questions ?? [])
        setEventStart(draft.eventStart ?? '')
        setEventStartTime(draft.eventStartTime ?? '')
        setEventEnd(draft.eventEnd ?? '')
        setEventEndTime(draft.eventEndTime ?? '')
        setVenue(draft.venue ?? '')
        setSendOption(draft.sendOption ?? 'now')
        setScheduledDate(draft.scheduledDate ?? '')
        setScheduledTime(draft.scheduledTime ?? '08:00')
        setCoverPhotoIndices(new Set(draft.coverPhotoIndices ?? []))
        setStaffRoles(draft.staffRoles ?? {})
        setDraftFilesMeta(draft.filesMeta ?? [])
        setDraftPhotosMeta(draft.photosMeta ?? [])
        setSavedAt(new Date(draft.savedAt))
        setDraftLoaded(true)
      }
      return
    }
    setTitle(existingAnnouncement.title)
    setDescription(existingAnnouncement.description)
    setShortcuts(existingAnnouncement.shortcuts)
    setEnquiryEmail(existingAnnouncement.enquiryEmail)

    // Re-hydrate staffInCharge from the new array type
    if (existingAnnouncement.staffInCharge.length > 0) {
      setStaffInCharge(
        existingAnnouncement.staffInCharge.map((m) => ({
          id: m.id,
          label: m.name,
          count: 1,
          type: 'individual' as const,
        })),
      )
      const roleMap: Record<string, PGRole> = {}
      for (const m of existingAnnouncement.staffInCharge) roleMap[m.id] = m.role
      setStaffRoles(roleMap)
    }

    // Re-hydrate recipients: group PGRecipients by classLabel
    if (existingAnnouncement.recipients.length > 0) {
      const byClass = new Map<string, number>()
      for (const r of existingAnnouncement.recipients) {
        byClass.set(r.classLabel, (byClass.get(r.classLabel) ?? 0) + 1)
      }
      const recipientEntities: Array<SelectedEntity> = Array.from(
        byClass.entries(),
      ).map(([cls, count]) => ({
        id: `class:${cls}`,
        label: cls,
        count,
        groupType: 'class' as const,
      }))
      setRecipients(recipientEntities)
    }

    // Seed attachments so the files section shows them and the 30-day banner triggers
    if (existingAnnouncement.attachments?.length) {
      setDraftFilesMeta(
        existingAnnouncement.attachments.map((att) => {
          // Parse "214 KB" / "1.2 MB" → bytes
          const [num, unit] = att.size.split(' ')
          const multiplier = unit?.toUpperCase() === 'MB' ? 1024 * 1024 : 1024
          return {
            name: att.name,
            size: Math.round(parseFloat(num) * multiplier),
            uploadedAt: existingAnnouncement.createdAt,
          }
        }),
      )
    }

    // Restore scheduled date/time if applicable
    if (existingAnnouncement.scheduledAt) {
      const dt = new Date(existingAnnouncement.scheduledAt)
      const pad = (n: number) => String(n).padStart(2, '0')
      setScheduledDate(
        `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`,
      )
      setScheduledTime(`${pad(dt.getHours())}:${pad(dt.getMinutes())}`)
      setSendOption('scheduled')
    }
  }, [])

  // Attachment handlers — core logic accepts File[] so drag-drop and input share the same path
  function processFiles(incoming: Array<File>) {
    const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
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
    const dropped = Math.max(0, valid.length - available)
    if (dropped > 0) {
      toast.warning(
        `${dropped} file${dropped > 1 ? 's' : ''} not added — maximum 3 files allowed.`,
      )
    }
    const added = valid.slice(0, available)
    if (added.length > 0) {
      toast.info(
        'Uploaded files are available for 30 days when saved as draft.',
        { duration: 5000 },
      )
      const uploadedAt = new Date().toISOString()
      setUploadedFiles((prev) => [...prev, ...added])
      setFilesMeta((prev) => [
        ...prev,
        ...added.map((f) => ({ name: f.name, size: f.size, uploadedAt })),
      ])
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    processFiles(Array.from(e.target.files ?? []))
    e.target.value = ''
  }

  function processPhotos(incoming: Array<File>) {
    const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
    const oversized = incoming.filter((f) => f.size > MAX_SIZE)
    const valid = incoming.filter((f) => f.size <= MAX_SIZE)
    if (oversized.length === 1) {
      toast.error(`"${oversized[0].name}" exceeds the 5 MB photo size limit.`)
    } else if (oversized.length > 1) {
      toast.error(
        `${oversized.length} photos exceed the 5 MB limit and were not added.`,
      )
    }
    const remaining = 12 - uploadedPhotos.length
    if (remaining <= 0) return
    const dropped = Math.max(0, valid.length - remaining)
    if (dropped > 0) {
      toast.warning(
        `${dropped} photo${dropped > 1 ? 's' : ''} not added — maximum 12 photos allowed.`,
      )
    }
    const added = valid.slice(0, remaining)
    if (added.length > 0) {
      toast.info(
        'Uploaded photos are available for 30 days when saved as draft.',
        { duration: 5000 },
      )
      const uploadedAt = new Date().toISOString()
      setUploadedPhotos((prev) => [
        ...prev,
        ...added.map((file) => ({ file, url: URL.createObjectURL(file) })),
      ])
      // Generate compressed thumbnails async so they're available if the draft is reopened
      void Promise.all(added.map((f) => generateThumbnail(f))).then(
        (thumbnails) => {
          setPhotosMeta((prev) => [
            ...prev,
            ...added.map((f, i) => ({
              name: f.name,
              size: f.size,
              uploadedAt,
              thumbnailUrl: thumbnails[i] || undefined,
            })),
          ])
        },
      )
    }
  }

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    processPhotos(Array.from(e.target.files ?? []))
    e.target.value = ''
  }

  function removeFile(index: number) {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
    setFilesMeta((prev) => prev.filter((_, i) => i !== index))
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

  function removePhoto(index: number) {
    setUploadedPhotos((prev) => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
    })
    setPhotosMeta((prev) => prev.filter((_, i) => i !== index))
    // Re-index cover selections after removal
    setCoverPhotoIndices((prev) => {
      const next = new Set<number>()
      for (const i of prev) {
        if (i < index) next.add(i)
        else if (i > index) next.add(i - 1)
        // i === index is dropped
      }
      return next
    })
  }

  function reorderPhoto(from: number, to: number) {
    if (from === to) return
    setUploadedPhotos((prev) => {
      const arr = [...prev]
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return arr
    })
    setPhotosMeta((prev) => {
      const arr = [...prev]
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return arr
    })
    setCoverPhotoIndices((prev) => {
      const next = new Set<number>()
      for (const i of prev) {
        if (i === from) {
          next.add(to)
        } else if (from < to && i > from && i <= to) {
          next.add(i - 1)
        } else if (from > to && i >= to && i < from) {
          next.add(i + 1)
        } else {
          next.add(i)
        }
      }
      return next
    })
  }

  function toggleCoverPhoto(index: number) {
    if (coverPhotoIndices.has(index)) {
      setCoverPhotoIndices((prev) => {
        const next = new Set(prev)
        next.delete(index)
        return next
      })
    } else if (coverPhotoIndices.size >= 3) {
      toast.warning('You can select up to 3 cover photos.')
    } else {
      setCoverPhotoIndices((prev) => new Set([...prev, index]))
    }
  }

  // Strip HTML tags to get plain-text character count for description
  const descriptionCharCount = description.replace(/<[^>]*>/g, '').length

  // Validation
  const totalRecipientCount = recipients.reduce((s, r) => s + r.count, 0)
  // A link with a URL but no description is incomplete
  const hasIncompleteLinks = websiteLinks.some(
    (l) => l.url.trim() && !l.label.trim(),
  )
  const canPost =
    title.trim().length > 0 &&
    !isDescriptionEmpty(description) &&
    recipients.length > 0 &&
    enquiryEmail.trim().length > 0 &&
    (responseType === 'view-only' || dueDate.length > 0) &&
    !hasIncompleteLinks
  const canSchedule =
    canPost && scheduledDate.length > 0 && scheduledTime.length > 0
  const canSubmit = sendOption === 'scheduled' ? canSchedule : canPost
  const missingFields = getMissingFields(
    sendOption,
    title,
    description,
    recipients,
    enquiryEmail,
    responseType,
    dueDate,
    scheduledDate,
    scheduledTime,
  )

  // Validation popover state
  const [showValidationPopover, setShowValidationPopover] = useState(false)
  const postBtnWrapRef = useRef<HTMLDivElement>(null)

  // Auto-close validation popover once all required fields are filled
  useEffect(() => {
    if (missingFields.length === 0) setShowValidationPopover(false)
  }, [missingFields.length])

  // Open validation popover when user clicks disabled Post button
  function handlePostClick() {
    if (!canSubmit) {
      setShowValidationPopover(true)
      return
    }
    setShowValidationPopover(false)
    setShowConfirmSheet(true)
  }

  function getScheduledAt(): string | undefined {
    if (sendOption !== 'scheduled' || !scheduledDate) return undefined
    return new Date(
      `${scheduledDate}T${scheduledTime || '08:00'}:00`,
    ).toISOString()
  }

  function handleConfirmPost() {
    const scheduledAt = getScheduledAt()
    const isScheduled = sendOption === 'scheduled' && Boolean(scheduledAt)

    const builtRecipients: Array<PGRecipient> = recipients.flatMap((entity) => {
      if (entity.groupType === 'class') {
        const cls = entity.id.replace('class:', '')
        return mockStudents
          .filter(
            (s) =>
              s.class === cls && s.schoolName === 'Bandung Secondary School',
          )
          .map((s) => ({
            studentId: s.id,
            studentName: s.name,
            classLabel: s.class,
            parentName: `Parent of ${s.name.split(' ')[0]}`,
            readStatus: 'unread' as const,
          }))
      }
      if (entity.type === 'individual') {
        const studentId = entity.id.replace('student:', '')
        const student = mockStudents.find((s) => s.id === studentId)
        if (!student) return []
        return [
          {
            studentId: student.id,
            studentName: student.name,
            classLabel: student.class,
            parentName: `Parent of ${student.name.split(' ')[0]}`,
            readStatus: 'unread' as const,
          },
        ]
      }
      // For level / school / CCA / teaching / custom groups:
      // Expand into placeholder recipients by count (real data would come from API)
      return Array.from({ length: entity.count }, (_, i) => ({
        studentId: `mock-${entity.id}-${i}`,
        studentName: `Recipient ${i + 1} (${entity.label})`,
        classLabel: entity.label,
        parentName: `Parent ${i + 1}`,
        readStatus: 'unread' as const,
      }))
    })

    // Expand entity selections → flat deduplicated StaffInChargeMember list
    const seen = new Set<string>()
    const staffInChargeList = staffInCharge.flatMap((entity) => {
      const entityRole = staffRoles[entity.id] ?? 'viewer'
      if (entity.type === 'individual') {
        const m = MOCK_STAFF.find((s) => s.id === entity.id)
        if (!m || seen.has(m.id)) return []
        seen.add(m.id)
        return [{ id: m.id, name: stripSalutation(m.name), role: entityRole }]
      }
      const group = MOCK_STAFF_GROUPS.find((g) => g.id === entity.id)
      if (!group) return []
      return group.memberIds.flatMap((mid) => {
        if (seen.has(mid)) return []
        const m = MOCK_STAFF.find((s) => s.id === mid)
        if (!m) return []
        if (entity.excludedMemberNames?.includes(stripSalutation(m.name)))
          return []
        seen.add(mid)
        return [{ id: m.id, name: stripSalutation(m.name), role: entityRole }]
      })
    })

    const newAnnouncement: PGAnnouncement = {
      id: `pg-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      shortcuts: shortcuts.filter((s) => s.label || s.url),
      websiteLinks: [],
      status: isScheduled ? 'scheduled' : 'posted',
      recipients: isScheduled ? [] : builtRecipients,
      staffInCharge: staffInChargeList,
      enquiryEmail: enquiryEmail.trim(),
      ownership: 'mine',
      role: 'editor',
      createdAt: new Date().toISOString(),
      postedAt: isScheduled ? undefined : new Date().toISOString(),
      scheduledAt: isScheduled ? scheduledAt : undefined,
    }

    if (isEditing && editId) {
      // Update the existing announcement in place
      const idx = mockPGAnnouncements.findIndex((a) => a.id === editId)
      if (idx !== -1) {
        mockPGAnnouncements[idx] = {
          ...mockPGAnnouncements[idx],
          title: newAnnouncement.title,
          description: newAnnouncement.description,
          shortcuts: newAnnouncement.shortcuts,
          staffInCharge: newAnnouncement.staffInCharge,
          enquiryEmail: newAnnouncement.enquiryEmail,
          status: newAnnouncement.status,
          recipients: newAnnouncement.recipients,
          postedAt: newAnnouncement.postedAt,
          scheduledAt: newAnnouncement.scheduledAt,
        }
      }
      setShowConfirmSheet(false)
      toast.success(isScheduled ? 'Schedule updated' : 'Post sent to parents')
      navigate({ to: '/announcements/$id', params: { id: editId } })
    } else {
      mockPGAnnouncements.unshift(newAnnouncement)
      clearDraft()
      setShowConfirmSheet(false)
      toast.success(isScheduled ? 'Post scheduled' : 'Post sent to parents')
      navigate({
        to: '/announcements/$id',
        params: { id: newAnnouncement.id },
      })
    }
  }

  // For posted posts: save only the unlocked fields (staff-in-charge, enquiry email)
  function handleSavePostedEdit() {
    if (!editId) return
    const seen = new Set<string>()
    const staffInChargeList = staffInCharge.flatMap((entity) => {
      const entityRole = staffRoles[entity.id] ?? 'viewer'
      if (entity.type === 'individual') {
        const m = MOCK_STAFF.find((s) => s.id === entity.id)
        if (!m || seen.has(m.id)) return []
        seen.add(m.id)
        return [{ id: m.id, name: stripSalutation(m.name), role: entityRole }]
      }
      const group = MOCK_STAFF_GROUPS.find((g) => g.id === entity.id)
      if (!group) return []
      return group.memberIds.flatMap((mid) => {
        if (seen.has(mid)) return []
        const m = MOCK_STAFF.find((s) => s.id === mid)
        if (!m) return []
        if (entity.excludedMemberNames?.includes(stripSalutation(m.name)))
          return []
        seen.add(mid)
        return [{ id: m.id, name: stripSalutation(m.name), role: entityRole }]
      })
    })
    const idx = mockPGAnnouncements.findIndex((a) => a.id === editId)
    if (idx !== -1) {
      mockPGAnnouncements[idx] = {
        ...mockPGAnnouncements[idx],
        staffInCharge: staffInChargeList,
        enquiryEmail: enquiryEmail.trim(),
      }
    }
    toast.success('Changes saved')
    navigate({ to: '/announcements/$id', params: { id: editId } })
  }

  const recipientClasses = [
    ...new Set(
      recipients.flatMap((r) =>
        r.groupType === 'class' ? [r.id.replace('class:', '')] : [],
      ),
    ),
  ]

  // Formatted save time
  const savedTimeLabel = savedAt
    ? savedAt.toLocaleTimeString('en-SG', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white">
        {/* Top bar */}
        <div className="flex items-center gap-3 border-b px-6 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            render={
              <Link
                to="/announcements"
                search={{
                  tab:
                    responseType !== 'view-only'
                      ? 'with-responses'
                      : 'view-only',
                }}
              />
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="flex-1 text-base font-semibold">
            {isEditing ? 'Edit Post' : 'New Post'}
          </h1>

          {/* Autosave status — replaces Save Draft button */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {isSaving ? (
              <span>Saving…</span>
            ) : savedAt ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Saved · {savedTimeLabel}</span>
              </>
            ) : title ? (
              <span className="text-slate-400">Draft</span>
            ) : null}
          </div>

          {/* Preview toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview((v) => !v)}
            className="gap-1.5"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Show Preview
              </>
            )}
          </Button>

          {/* Split button + validation hint */}
          <div className="flex flex-col items-end gap-1">
            {isEditingPosted ? (
              /* Posted edit: single "Save changes" button, no schedule option */
              <Button size="sm" onClick={handleSavePostedEdit}>
                <Check className="mr-2 h-3.5 w-3.5" />
                Save changes
              </Button>
            ) : (
              <Popover
                open={showValidationPopover}
                onOpenChange={setShowValidationPopover}
              >
                <div
                  ref={postBtnWrapRef}
                  className="flex overflow-hidden rounded-md"
                >
                  <Button
                    size="sm"
                    className={cn(
                      'rounded-r-none',
                      !canSubmit && 'cursor-not-allowed opacity-50',
                    )}
                    onClick={handlePostClick}
                  >
                    {sendOption === 'scheduled' ? (
                      <>
                        <CalendarClock className="mr-2 h-3.5 w-3.5" />
                        Schedule
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-3.5 w-3.5" />
                        Post
                      </>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          size="sm"
                          className={cn(
                            'rounded-l-none border-l border-primary-foreground/25 px-2',
                            !canSubmit && 'cursor-not-allowed opacity-50',
                          )}
                          aria-label="Choose send option"
                        />
                      }
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setSendOption('now')}>
                        <Send className="h-4 w-4" />
                        Post now
                        {sendOption === 'now' && (
                          <Check className="ml-auto h-3.5 w-3.5 text-primary" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSendOption('scheduled')}
                      >
                        <CalendarClock className="h-4 w-4" />
                        Schedule for later
                        {sendOption === 'scheduled' && (
                          <Check className="ml-auto h-3.5 w-3.5 text-primary" />
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {/* Validation popover — shown when Post is clicked but form is incomplete */}
                <PopoverContent
                  anchor={postBtnWrapRef}
                  side="bottom"
                  align="end"
                  className="w-64 gap-2 p-3"
                >
                  <p className="text-sm font-medium text-slate-800">
                    Complete these fields before posting
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {missingFields.map((f) => (
                      <li
                        key={f.field}
                        className="flex items-start gap-1.5 text-xs text-slate-600"
                      >
                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                        {f.hint}
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {/* Scheduling strip — hidden when editing a posted post */}
        {!isEditingPosted && sendOption === 'scheduled' && (
          <div className="flex items-center gap-3 border-b bg-blue-50 px-6 py-2">
            <CalendarClock className="h-4 w-4 shrink-0 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Send on</span>
            <input
              type="date"
              value={scheduledDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="rounded-md border border-blue-200 bg-white px-2.5 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-blue-300"
            />
            <span className="text-sm text-blue-600">at</span>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="rounded-md border border-blue-200 bg-white px-2.5 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-blue-300"
            />
            <div className="ml-auto flex items-center gap-3">
              <Button
                size="sm"
                onClick={() => setShowConfirmSheet(true)}
                disabled={!canSchedule}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                Schedule
              </Button>
              <button
                type="button"
                onClick={() => setSendOption('now')}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
              >
                <X className="h-3 w-3" />
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form body */}
      <div
        className={cn(
          'mx-auto w-full px-6 py-8',
          showPreview ? 'max-w-5xl' : 'max-w-2xl',
        )}
      >
        <div
          className={cn(
            showPreview
              ? 'grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start'
              : 'space-y-6',
          )}
        >
          {/* Form sections */}
          <div className="space-y-6">
            {/* Locked-fields notice — shown when editing a posted post */}
            {isEditingPosted && (
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                <div>
                  <p className="font-semibold text-slate-700">
                    Some fields are locked
                  </p>
                  <p className="mt-0.5 text-slate-500">
                    Title, description, recipients, shortcuts, links, and
                    attachments cannot be changed for a posted post. You can
                    still update staff-in-charge and enquiry email.
                  </p>
                </div>
              </div>
            )}

            {/* 30-day media retention banner — dismissable per session, resets on each entry */}
            {!fileBannerDismissed &&
              (draftLoaded || isEditing) &&
              (draftFilesMeta.length > 0 || draftPhotosMeta.length > 0) &&
              (() => {
                const allMeta = [...draftFilesMeta, ...draftPhotosMeta]
                const minDays = Math.min(
                  ...allMeta.map((m) => daysRemaining(m.uploadedAt)),
                )
                const fileCount = draftFilesMeta.length
                const photoCount = draftPhotosMeta.length
                const mediaLabel = [
                  fileCount > 0
                    ? `${fileCount} file${fileCount > 1 ? 's' : ''}`
                    : '',
                  photoCount > 0
                    ? `${photoCount} photo${photoCount > 1 ? 's' : ''}`
                    : '',
                ]
                  .filter(Boolean)
                  .join(' and ')
                return (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900">
                        {mediaLabel} from this draft{' '}
                        {minDays === 0
                          ? 'have expired'
                          : `expire${minDays === 1 ? 's' : ''} in ${minDays} day${minDays > 1 ? 's' : ''}`}
                      </p>
                      <p className="mt-0.5 text-amber-700">
                        Files and photos are retained for 30 days from upload.
                        Re-upload them before posting to avoid losing them.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFileBannerDismissed(true)}
                      className="shrink-0 rounded p-0.5 text-amber-500 hover:bg-amber-100 hover:text-amber-700"
                      aria-label="Dismiss"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })()}

            {/* RECIPIENTS — first section */}
            <section className="rounded-xl border bg-white p-6">
              <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Recipients
              </h2>
              <div className="space-y-5">
                {/* Students */}
                <div
                  className={cn(
                    'space-y-1.5',
                    isEditingPosted && 'pointer-events-none opacity-50',
                  )}
                >
                  <Label>
                    Students <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Parents of the selected students will receive this post via
                    Parents Gateway.
                  </p>
                  <StudentRecipientSelector
                    value={recipients}
                    onChange={setRecipients}
                  />
                </div>

                {/* Staff in charge */}
                <div className="space-y-1.5">
                  <Label>Staff-in-charge</Label>
                  <p className="text-xs text-muted-foreground">
                    Editors can edit and delete the post. Viewers can only view
                    read status.
                  </p>
                  <StaffSelector
                    value={staffInCharge}
                    onChange={setStaffInCharge}
                    renderChipExtra={(entity) => {
                      const isEditor =
                        (staffRoles[entity.id] ?? 'viewer') === 'editor'
                      return (
                        <button
                          type="button"
                          title={
                            isEditor ? 'Switch to Viewer' : 'Switch to Editor'
                          }
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.stopPropagation()
                            setStaffRoles((prev) => ({
                              ...prev,
                              [entity.id]: isEditor ? 'viewer' : 'editor',
                            }))
                          }}
                          className={cn(
                            'flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold transition-colors',
                            isEditor
                              ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                          )}
                        >
                          {isEditor ? 'Editor' : 'Viewer'}
                          <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                        </button>
                      )
                    }}
                  />
                </div>

                {/* Enquiry email */}
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
                </div>
              </div>
            </section>

            {/* CONTENT */}
            <section className="rounded-xl border bg-white p-6">
              <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Content
              </h2>

              {/* Zone A — core fields (locked for posted posts) */}
              <div
                className={cn(
                  'space-y-4',
                  isEditingPosted && 'pointer-events-none opacity-50',
                )}
              >
                {/* Title */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <Label htmlFor="title">
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
                    id="title"
                    placeholder="e.g. Term 3 School Camp Consent & Payment"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                  />
                </div>

                {/* Description — Tiptap rich text */}
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
                    placeholder="Write your post here. Use the toolbar to format text and insert inline links."
                    minHeight="160px"
                    toolbar="simple"
                  />
                </div>
              </div>

              {/* Zone B — optional extras (locked for posted posts) */}
              <div
                className={cn(
                  'mt-5 border-t pt-5 space-y-5',
                  isEditingPosted && 'pointer-events-none opacity-50',
                )}
              >
                {/* Shortcuts */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      Shortcuts
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Optional
                    </span>
                  </div>
                  <PGShortcutsSelector
                    value={shortcuts}
                    onChange={setShortcuts}
                  />
                </div>

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
                      {/* Column labels */}
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

                      {websiteLinks.map((link, i) => {
                        const missingDescription =
                          link.url.trim() && !link.label.trim()
                        return (
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
                              aria-invalid={Boolean(missingDescription)}
                              className={cn(
                                'h-8 w-48 shrink-0 text-xs',
                                missingDescription && 'border-destructive',
                              )}
                            />
                            <button
                              type="button"
                              aria-label="Remove link"
                              onClick={() => removeWebsiteLink(i)}
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )
                      })}
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

                {/* Files */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      Files
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {uploadedFiles.length}/3 · Max 5 MB each
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
                            aria-label={`Remove ${file.name}`}
                            onClick={() => removeFile(i)}
                            className="shrink-0 rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Draft-loaded file stubs — styled identically to real files */}
                  {draftFilesMeta.length > 0 && (
                    <div className="space-y-1.5">
                      {draftFilesMeta.map((meta, i) => (
                        <div
                          key={`draft-file-${i}`}
                          className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                          <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-slate-700">
                              {meta.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatFileSize(meta.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-label={`Remove ${meta.name}`}
                            onClick={() =>
                              setDraftFilesMeta((prev) =>
                                prev.filter((_, j) => j !== i),
                              )
                            }
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
                        'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-4 text-center transition-colors',
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

                {/* Photos */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      Photos
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {uploadedPhotos.length}/12 · Max 5 MB each
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Drag to reorder · Select up to 3 as cover photos.
                  </p>

                  {uploadedPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {uploadedPhotos.map((photo, i) => (
                        <div
                          key={i}
                          draggable
                          onDragStart={(e) => {
                            dragSourceIndex.current = i
                            e.dataTransfer.effectAllowed = 'move'
                          }}
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                            setDragOverIndex(i)
                          }}
                          onDragLeave={() => setDragOverIndex(null)}
                          onDrop={(e) => {
                            e.preventDefault()
                            if (dragSourceIndex.current !== null) {
                              reorderPhoto(dragSourceIndex.current, i)
                              dragSourceIndex.current = null
                            }
                            setDragOverIndex(null)
                          }}
                          onDragEnd={() => {
                            dragSourceIndex.current = null
                            setDragOverIndex(null)
                          }}
                          className={cn(
                            'relative cursor-grab overflow-hidden rounded-md border transition-all active:cursor-grabbing',
                            coverPhotoIndices.has(i)
                              ? 'border-primary ring-2 ring-primary ring-offset-1'
                              : 'border-slate-200',
                            dragOverIndex === i && dragSourceIndex.current !== i
                              ? 'scale-95 ring-2 ring-primary/50 ring-offset-1'
                              : '',
                          )}
                        >
                          {/* Top toolbar — cover toggle + delete */}
                          <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-0.5 bg-slate-900/75 px-1.5 py-1">
                            <button
                              type="button"
                              onClick={() => toggleCoverPhoto(i)}
                              className="flex flex-1 items-center gap-1 text-left"
                            >
                              <span
                                className={cn(
                                  'flex h-3 w-3 shrink-0 items-center justify-center rounded border',
                                  coverPhotoIndices.has(i)
                                    ? 'border-primary bg-primary'
                                    : 'border-white/70 bg-transparent',
                                )}
                              >
                                {coverPhotoIndices.has(i) && (
                                  <Check className="h-2 w-2 text-white" />
                                )}
                              </span>
                            </button>
                            <button
                              type="button"
                              aria-label={`Remove ${photo.file.name}`}
                              onClick={() => removePhoto(i)}
                              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>

                          <img
                            src={photo.url}
                            alt={photo.file.name}
                            className="aspect-square w-full object-cover"
                            draggable={false}
                          />

                          <div className="flex items-center gap-1 bg-white px-1.5 py-0.5">
                            {coverPhotoIndices.has(i) && (
                              <span className="shrink-0 rounded bg-primary/10 px-1 py-px text-[8px] font-semibold uppercase tracking-wide text-primary">
                                Cover
                              </span>
                            )}
                            <p className="truncate text-[10px] italic text-muted-foreground">
                              {photo.file.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Draft-loaded photo stubs — show saved thumbnail if available, else grey placeholder */}
                  {draftPhotosMeta.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {draftPhotosMeta.map((meta, i) => (
                        <div
                          key={`draft-photo-${i}`}
                          className="relative overflow-hidden rounded-md border border-slate-200"
                        >
                          {meta.thumbnailUrl ? (
                            <img
                              src={meta.thumbnailUrl}
                              alt={meta.name}
                              className="aspect-square w-full object-cover"
                              draggable={false}
                            />
                          ) : (
                            <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 bg-slate-100 p-2">
                              <ImagePlus className="h-5 w-5 text-slate-400" />
                              <p className="line-clamp-2 text-center text-[9px] leading-tight text-slate-500">
                                {meta.name}
                              </p>
                            </div>
                          )}
                          <button
                            type="button"
                            aria-label={`Remove ${meta.name}`}
                            onClick={() =>
                              setDraftPhotosMeta((prev) =>
                                prev.filter((_, j) => j !== i),
                              )
                            }
                            className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900/50 text-white hover:bg-slate-900/70"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadedPhotos.length < 12 && (
                    <div
                      onClick={() => photoInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setPhotoDragOver(true)
                      }}
                      onDragLeave={() => setPhotoDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setPhotoDragOver(false)
                        processPhotos(Array.from(e.dataTransfer.files))
                      }}
                      className={cn(
                        'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-4 text-center transition-colors',
                        photoDragOver
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-slate-300 text-muted-foreground hover:border-slate-400 hover:bg-slate-50 hover:text-foreground',
                      )}
                    >
                      <ImagePlus className="h-4 w-4" />
                      <p className="text-xs">
                        {photoDragOver
                          ? 'Drop photos here'
                          : uploadedPhotos.length > 0
                            ? 'Drop photos or click to add more'
                            : 'Drop photos here or click to browse'}
                      </p>
                    </div>
                  )}
                  <input
                    ref={photoInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
              </div>
            </section>

            {/* RESPONSE TYPE */}
            {showResponseSection && (
              <section className="rounded-xl border bg-white p-6">
                <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Response Type
                </h2>
                <p className="mb-5 text-xs text-muted-foreground">
                  Choose how parents respond to this post.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {(
                    [
                      {
                        value: 'acknowledge' as ResponseType,
                        label: 'Acknowledge',
                        hint: 'Parents tap a button to acknowledge.',
                        mockup: <AcknowledgeMockup />,
                      },
                      {
                        value: 'yes-no' as ResponseType,
                        label: 'Yes or No',
                        hint: 'Parents tap Yes or No. Supports follow-up questions.',
                        mockup: <YesNoMockup />,
                      },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleResponseTypeChange(opt.value)}
                      className={cn(
                        'flex flex-col gap-3 rounded-xl border-2 p-4 text-left transition-all',
                        responseType === opt.value
                          ? 'border-primary bg-primary/[0.04] ring-1 ring-primary/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-[100px] w-full items-center justify-center overflow-hidden rounded-lg border',
                          responseType === opt.value
                            ? 'border-primary/15 bg-white'
                            : 'border-slate-100 bg-slate-50/50',
                        )}
                      >
                        <div className="w-full">{opt.mockup}</div>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {opt.label}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            {opt.hint}
                          </p>
                        </div>
                        {responseType === opt.value && (
                          <div className="mt-0.5 shrink-0 rounded-full bg-primary p-0.5 text-white">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Attach a Form — coming soon */}
                <div className="mt-4 flex cursor-not-allowed items-center gap-3 rounded-lg border border-dashed border-slate-200 px-4 py-3 opacity-50">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <FileText className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Attach a Form
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Coming soon.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* CUSTOM QUESTIONS — yes/no only */}
            {responseType === 'yes-no' && (
              <QuestionBuilder
                questions={questions}
                onChange={setQuestions}
                responseType={responseType}
                onEditQuestion={setEditingQuestionId}
              />
            )}

            {/* EVENT DETAILS — acknowledge + yes/no */}
            {responseType !== 'view-only' && (
              <section className="rounded-xl border bg-white p-6">
                <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Event Details
                </h2>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Event start (optional)</Label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={eventStart}
                          onChange={(e) => setEventStart(e.target.value)}
                          className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                        />
                        <input
                          type="time"
                          value={eventStartTime}
                          onChange={(e) => setEventStartTime(e.target.value)}
                          className="w-32 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Event end (optional)</Label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={eventEnd}
                          onChange={(e) => setEventEnd(e.target.value)}
                          className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                        />
                        <input
                          type="time"
                          value={eventEndTime}
                          onChange={(e) => setEventEndTime(e.target.value)}
                          className="w-32 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <Label>Venue (optional)</Label>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {venue.length}/100
                      </span>
                    </div>
                    <Input
                      placeholder="e.g. School hall, Pasir Ris Park"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      maxLength={100}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* SETTINGS (due date + reminders) — acknowledge + yes/no */}
            {responseType !== 'view-only' && (
              <section className="rounded-xl border bg-white p-6">
                <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Settings
                </h2>
                <div className="space-y-5">
                  {/* Due date */}
                  <div className="space-y-1.5">
                    <Label>
                      Due date to respond by{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <input
                      type="date"
                      value={dueDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                    />
                    {dueDate && (
                      <p className="text-xs text-muted-foreground">
                        Default reminder will be sent on:{' '}
                        {new Date(dueDate).toLocaleDateString('en-SG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>

                  {/* Additional reminders */}
                  <div className="space-y-2">
                    <Label>Send additional reminder(s) to parents</Label>
                    <div className="space-y-2">
                      {(
                        [
                          { value: 'none', label: 'None' },
                          { value: 'one-time', label: 'One Time' },
                          { value: 'daily', label: 'Daily' },
                        ] as const
                      ).map((opt) => (
                        <label
                          key={opt.value}
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <input
                            type="radio"
                            name="pg-reminder"
                            value={opt.value}
                            checked={reminderType === opt.value}
                            onChange={() => setReminderType(opt.value)}
                            className="h-3.5 w-3.5 accent-primary"
                          />
                          <span className="text-sm">{opt.label}</span>
                          {reminderType === opt.value &&
                            opt.value !== 'none' && (
                              <div className="ml-2 flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {opt.value === 'one-time' ? 'on' : 'from'}
                                </span>
                                <input
                                  type="date"
                                  value={reminderDate}
                                  onChange={(e) =>
                                    setReminderDate(e.target.value)
                                  }
                                  className="rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                                />
                              </div>
                            )}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Preview pane — sticky alongside form on lg screens */}
          {showPreview && (
            <div className="lg:sticky lg:top-[60px]">
              <AnnouncementPreview
                title={title}
                description={description}
                shortcuts={shortcuts}
                staffInCharge={staffInCharge.map((s) => s.label).join(', ')}
                enquiryEmail={enquiryEmail}
                recipients={recipients}
                responseType={responseType}
                dueDate={dueDate}
                questions={questions}
                editingQuestionId={editingQuestionId}
                venue={venue}
                eventStart={eventStart}
                eventStartTime={eventStartTime}
                eventEnd={eventEnd}
                eventEndTime={eventEndTime}
                uploadedFiles={uploadedFiles}
                uploadedPhotos={uploadedPhotos}
                websiteLinks={websiteLinks}
                draftFilesMeta={draftFilesMeta}
              />
            </div>
          )}
        </div>
      </div>

      <SendConfirmationSheet
        open={showConfirmSheet}
        onOpenChange={setShowConfirmSheet}
        title={title}
        recipientClasses={recipientClasses}
        totalRecipients={totalRecipientCount}
        scheduledAt={getScheduledAt()}
        onConfirm={handleConfirmPost}
        responseType={responseType}
        dueDate={dueDate}
      />
    </div>
  )
}
