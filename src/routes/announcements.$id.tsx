import { useMemo, useState } from 'react'
import {
  Link,
  createFileRoute,
  notFound,
  useNavigate,
} from '@tanstack/react-router'
import {
  ArrowLeft,
  CalendarClock,
  ChevronDown,
  Clock,
  Lock,
  Mail,
  MessageSquare,
  Paperclip,
  Plus,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { SelectedEntity } from '@/components/comms/entity-selector'
import type { PGRole } from '@/types/pg-announcement'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { getPGAnnouncementById } from '@/data/mock-pg-announcements'
import { getStudentById } from '@/data/mock-students'
import { CLASS_GROUPS } from '@/data/mock-student-groups'
import { PG_SHORTCUT_PRESETS } from '@/data/pg-shortcuts'
import { StatusBadge } from '@/components/comms/status-badge'
import { ReadRate } from '@/components/comms/read-rate'
import { RecipientReadTable } from '@/components/comms/recipient-read-table'
import { StaffSelector } from '@/components/comms/staff-selector'
import { EnquiryEmailSelector } from '@/components/comms/enquiry-email-selector'
import { MOCK_STAFF } from '@/data/mock-staff'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn, stripSalutation } from '@/lib/utils'

export const Route = createFileRoute('/announcements/$id')({
  loader: ({ params }) => {
    const announcement = getPGAnnouncementById(params.id)
    if (!announcement) throw notFound()
    return { announcement }
  },
  component: AnnouncementDetailPage,
})

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Strip HTML tags to produce plain text for textarea display */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

function AnnouncementDetailPage() {
  const { announcement: loadedAnnouncement } = Route.useLoaderData()

  // ---------------------------------------------------------------------------
  // Local shadow state — allows optimistic saves without a backend
  // ---------------------------------------------------------------------------
  const [savedData, setSavedData] = useState({
    title: loadedAnnouncement.title,
    description: loadedAnnouncement.description,
    staffInCharge: loadedAnnouncement.staffInCharge,
    enquiryEmail: loadedAnnouncement.enquiryEmail,
    recipients: loadedAnnouncement.recipients,
    scheduledAt: loadedAnnouncement.scheduledAt,
  })

  // Merge loaded (immutable) fields with local overrides
  const announcement = { ...loadedAnnouncement, ...savedData }

  // ---------------------------------------------------------------------------
  // Edit mode state
  // ---------------------------------------------------------------------------
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStaffInCharge, setEditStaffInCharge] = useState<
    Array<SelectedEntity>
  >([])
  const [editStaffRoles, setEditStaffRoles] = useState<Record<string, PGRole>>(
    {},
  )
  const [editEnquiryEmail, setEditEnquiryEmail] = useState('')
  const [editClasses, setEditClasses] = useState<Array<string>>([])

  // ---------------------------------------------------------------------------
  // Schedule edit state
  // ---------------------------------------------------------------------------
  const [isEditingSchedule, setIsEditingSchedule] = useState(false)
  const [editScheduleDate, setEditScheduleDate] = useState('')
  const [editScheduleTime, setEditScheduleTime] = useState('')

  // ---------------------------------------------------------------------------
  // Delete state
  // ---------------------------------------------------------------------------
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteMode, setDeleteMode] = useState<
    'remove-from-list' | 'delete-for-everyone'
  >('remove-from-list')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const responseType = announcement.responseType ?? 'view-only'
  const totalCount = savedData.recipients.length
  const readCount = savedData.recipients.filter(
    (r) => r.readStatus === 'read',
  ).length
  const unreadCount = totalCount - readCount

  // Response-type-aware stats
  const acknowledgedCount = savedData.recipients.filter(
    (r) => r.respondedAt != null || r.acknowledgedAt != null,
  ).length
  const pendingAckCount = totalCount - acknowledgedCount
  const respondedCount = savedData.recipients.filter(
    (r) => r.respondedAt != null,
  ).length
  const yesCount = savedData.recipients.filter(
    (r) => r.formResponse === 'yes',
  ).length
  const noCount = savedData.recipients.filter(
    (r) => r.formResponse === 'no',
  ).length
  const pendingResponseCount = totalCount - respondedCount

  const uniqueClasses = useMemo(
    () => [...new Set(savedData.recipients.map((r) => r.classLabel))].sort(),
    [savedData.recipients],
  )

  // Class labels available to add (not already in current edit selection)
  const addableClasses = useMemo(
    () =>
      CLASS_GROUPS.map((g) => g.label).filter((l) => !editClasses.includes(l)),
    [editClasses],
  )

  const postedDate = announcement.postedAt
    ? formatDateTime(announcement.postedAt)
    : null
  const scheduledDate = savedData.scheduledAt
    ? formatDateTime(savedData.scheduledAt)
    : null

  const isViewer = announcement.role === 'viewer'
  const isShared = announcement.ownership === 'shared'

  // Posted announcements lock content; only metadata fields are editable
  const contentLocked = announcement.status === 'posted'

  const navigate = useNavigate()

  useSetBreadcrumbs([
    { label: 'Posts', href: '/announcements' },
    { label: announcement.title, href: `/announcements/${announcement.id}` },
  ])

  // ---------------------------------------------------------------------------
  // Delete handler
  // ---------------------------------------------------------------------------
  function handleDelete() {
    const toastMsg =
      announcement.status !== 'posted' || deleteMode === 'delete-for-everyone'
        ? 'Post deleted'
        : 'Post removed from your list'
    setShowDeleteDialog(false)
    setDeleteConfirmText('')
    toast.success(toastMsg)
    navigate({ to: '/announcements' })
  }

  // ---------------------------------------------------------------------------
  // Edit handlers
  // ---------------------------------------------------------------------------
  function startEditing() {
    setEditTitle(savedData.title)
    setEditDescription(stripHtml(savedData.description))
    setEditStaffInCharge(
      savedData.staffInCharge.map((m) => ({
        id: m.id,
        label: m.name,
        type: 'individual' as const,
        count: 1,
      })),
    )
    const roleMap: Record<string, PGRole> = {}
    for (const m of savedData.staffInCharge) roleMap[m.id] = m.role
    setEditStaffRoles(roleMap)
    setEditEnquiryEmail(savedData.enquiryEmail)
    setEditClasses([...uniqueClasses])
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
  }

  function startEditingSchedule() {
    const current = savedData.scheduledAt
      ? new Date(savedData.scheduledAt)
      : new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    setEditScheduleDate(
      `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`,
    )
    setEditScheduleTime(
      `${pad(current.getHours())}:${pad(current.getMinutes())}`,
    )
    setIsEditingSchedule(true)
  }

  function cancelEditingSchedule() {
    setIsEditingSchedule(false)
  }

  function saveSchedule() {
    if (!editScheduleDate) return
    const newScheduledAt = new Date(
      `${editScheduleDate}T${editScheduleTime || '08:00'}:00`,
    ).toISOString()
    setSavedData((prev) => ({ ...prev, scheduledAt: newScheduledAt }))
    toast.success('Schedule updated')
    setIsEditingSchedule(false)
  }

  function saveEditing() {
    // For posted: only staff in charge, recipients, and enquiry email can change.
    // For draft/scheduled: additionally title and description.
    const updatedRecipients = savedData.recipients.filter((r) =>
      editClasses.includes(r.classLabel),
    )

    setSavedData((prev) => ({
      ...prev,
      ...(!contentLocked
        ? {
            title: editTitle.trim(),
            description: editDescription.trim()
              ? `<p>${editDescription.trim()}</p>`
              : prev.description,
          }
        : {}),
      staffInCharge: editStaffInCharge.map((s) => ({
        id: s.id,
        name: s.label,
        role: editStaffRoles[s.id] ?? 'viewer',
      })),
      enquiryEmail: editEnquiryEmail.trim(),
      recipients: updatedRecipients,
    }))
    toast.success('Changes saved')
    setIsEditing(false)
  }

  function removeClass(cls: string) {
    setEditClasses((prev) => prev.filter((c) => c !== cls))
  }

  function addClass(cls: string) {
    setEditClasses((prev) => [...prev, cls].sort())
  }

  return (
    <div className="flex flex-col gap-6 pt-6">
      {/* ── Header ── */}
      <div className="px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="mt-0.5 shrink-0"
              render={
                <Link
                  to="/announcements"
                  search={{
                    tab:
                      responseType === 'acknowledge' ||
                      responseType === 'yes-no'
                        ? 'with-responses'
                        : 'view-only',
                  }}
                />
              }
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold">{announcement.title}</h1>
                <StatusBadge status={announcement.status} />
              </div>
              {postedDate && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Posted {postedDate}
                  {' · Daniel Tan'}
                  {isShared && isViewer && (
                    <span className="ml-2 inline-flex items-center gap-1 text-slate-400">
                      <Lock className="h-3 w-3" />
                      Viewer
                    </span>
                  )}
                </p>
              )}
              {announcement.status === 'scheduled' &&
                (isEditingSchedule ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <CalendarClock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <input
                      type="date"
                      value={editScheduleDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setEditScheduleDate(e.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <input
                      type="time"
                      value={editScheduleTime}
                      onChange={(e) => setEditScheduleTime(e.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <Button
                      size="sm"
                      onClick={saveSchedule}
                      disabled={!editScheduleDate}
                    >
                      Save
                    </Button>
                    <button
                      type="button"
                      onClick={cancelEditingSchedule}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-amber-600">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Scheduled for {scheduledDate}
                    <span className="text-muted-foreground">· Daniel Tan</span>
                    {!isViewer && (
                      <button
                        type="button"
                        onClick={startEditingSchedule}
                        className="ml-1 text-xs font-medium text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                    )}
                  </p>
                ))}
              {announcement.status === 'draft' && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Not yet sent
                  {isShared && (
                    <span className="ml-2 inline-flex items-center gap-1 text-slate-400">
                      <Users className="h-3 w-3" />
                      Shared
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Edit / Save / Cancel + Delete */}
          <div className="flex shrink-0 items-center gap-2">
            {isViewer ? (
              <Button variant="outline" size="sm" disabled>
                <Lock className="h-3.5 w-3.5" />
                View only
              </Button>
            ) : isEditing ? (
              <>
                <Button variant="ghost" size="sm" onClick={cancelEditing}>
                  Cancel
                </Button>
                <Button size="sm" onClick={saveEditing}>
                  Save changes
                </Button>
              </>
            ) : (
              <Button
                variant={
                  announcement.status === 'draft' ? 'default' : 'outline'
                }
                size="sm"
                render={
                  <Link
                    to="/announcements/new"
                    search={{ edit: announcement.id }}
                  />
                }
              >
                Edit
              </Button>
            )}

            {/* Delete button — hidden while in editing mode */}
            {!isEditing && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => {
                  setDeleteMode('remove-from-list')
                  setShowDeleteDialog(true)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 30-day file expiry banner — shown whenever the announcement has attachments */}
      {(announcement.attachments?.length ?? 0) > 0 && (
        <div className="mx-6 mb-2 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p>
            <span className="font-medium">Files expire after 30 days.</span>{' '}
            Uploaded files and images are automatically removed 30 days after
            upload. Re-upload before sending if needed.
          </p>
        </div>
      )}

      <div className="grid gap-6 px-6 lg:grid-cols-3">
        {/* ── Left: read tracking (2/3) ── */}
        <div className="space-y-6 lg:col-span-2">
          {announcement.status === 'posted' && responseType === 'view-only' && (
            <div className="rounded-lg border bg-background p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Overview
                  </p>
                  <p className="mt-1 text-3xl font-bold">
                    {readCount}
                    <span className="text-xl font-normal text-muted-foreground">
                      {' '}
                      / {totalCount}
                    </span>
                  </p>
                  {unreadCount > 0 ? (
                    <p className="mt-1 text-sm text-amber-600">
                      {unreadCount} unread
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-green-700">All read</p>
                  )}
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-twblue-2">
                  <Users className="h-7 w-7 text-twblue-9" />
                </div>
              </div>
              <div className="mt-4">
                <ReadRate
                  readCount={readCount}
                  totalCount={totalCount}
                  className="w-full [&>div:first-child]:h-2 [&>div:first-child]:w-full"
                />
              </div>
            </div>
          )}

          {announcement.status === 'posted' &&
            responseType === 'acknowledge' && (
              <div className="rounded-lg border bg-background p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Acknowledged by parents
                    </p>
                    <p className="mt-1 text-3xl font-bold">
                      {acknowledgedCount}
                      <span className="text-xl font-normal text-muted-foreground">
                        {' '}
                        / {totalCount}
                      </span>
                    </p>
                    {pendingAckCount > 0 ? (
                      <p className="mt-1 text-sm text-amber-600">
                        {pendingAckCount} pending
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-green-700">
                        All acknowledged
                      </p>
                    )}
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-twblue-2">
                    <Users className="h-7 w-7 text-twblue-9" />
                  </div>
                </div>
                <div className="mt-4">
                  <ReadRate
                    readCount={acknowledgedCount}
                    totalCount={totalCount}
                    className="w-full [&>div:first-child]:h-2 [&>div:first-child]:w-full"
                  />
                </div>
              </div>
            )}

          {announcement.status === 'posted' && responseType === 'yes-no' && (
            <div className="rounded-lg border bg-background p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Overview
                  </p>
                  <p className="mt-1 text-3xl font-bold">
                    {respondedCount}
                    <span className="text-xl font-normal text-muted-foreground">
                      {' '}
                      / {totalCount}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-6 text-center">
                  <div className="text-center">
                    <p className="text-3xl font-semibold text-green-700">
                      {yesCount}
                    </p>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Yes
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-semibold text-rose-600">
                      {noCount}
                    </p>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      No
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <ReadRate
                  readCount={respondedCount}
                  totalCount={totalCount}
                  className="w-full [&>div:first-child]:h-2 [&>div:first-child]:w-full"
                />
              </div>
            </div>
          )}

          {announcement.status === 'scheduled' && (
            <div className="flex h-40 items-center justify-center rounded-lg border bg-background">
              <div className="flex flex-col items-center gap-2 text-center">
                <CalendarClock className="h-8 w-8 text-blue-400" />
                <p className="text-sm text-muted-foreground">
                  Read tracking will be available after the announcement is
                  sent.
                </p>
              </div>
            </div>
          )}

          {announcement.status === 'posted' && totalCount > 0 && (
            <div className="rounded-lg border bg-background p-6">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {'Status'}
              </h2>
              <RecipientReadTable
                recipients={savedData.recipients}
                announcementTitle={announcement.title}
                responseType={responseType}
                questions={announcement.questions}
              />
            </div>
          )}

          {announcement.status === 'draft' && (
            <div className="flex h-40 items-center justify-center rounded-lg border bg-background">
              <p className="text-sm text-muted-foreground">
                Send this announcement to start tracking read status.
              </p>
            </div>
          )}
        </div>

        {/* ── Right: announcement content (1/3) ── */}
        <div className="space-y-4">
          {/* Post card */}
          <div className="rounded-lg border bg-background p-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Post
            </h2>
            <div className="space-y-3">
              {/* Title */}
              {isEditing && !contentLocked ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Title
                  </p>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-sm font-medium"
                  />
                </div>
              ) : (
                <p
                  className={cn(
                    'font-medium',
                    isEditing && contentLocked && 'text-muted-foreground',
                  )}
                >
                  {announcement.title}
                </p>
              )}

              {/* Description */}
              {isEditing && !contentLocked ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Description
                  </p>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={5}
                    className="resize-none text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Formatting is simplified here. Use the compose form for
                    rich-text editing.
                  </p>
                </div>
              ) : (
                announcement.description && (
                  <p
                    className={cn(
                      'text-sm leading-relaxed',
                      isEditing && contentLocked
                        ? 'text-muted-foreground/60'
                        : 'text-muted-foreground',
                    )}
                  >
                    {stripHtml(announcement.description)}
                  </p>
                )
              )}

              {/* Locked content notice */}
              {isEditing && contentLocked && (
                <p className="flex items-center gap-1.5 rounded-md bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3 shrink-0" />
                  Title, description, and shortcuts cannot be edited after
                  posting.
                </p>
              )}

              {/* Shortcuts — only shown when the announcement has relevant ones */}
              {announcement.shortcuts.length > 0 && (
                <div
                  className={cn(
                    'space-y-1.5 border-t pt-3',
                    isEditing && contentLocked && 'opacity-50',
                  )}
                >
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Shortcuts
                  </p>
                  {PG_SHORTCUT_PRESETS.filter((preset) =>
                    announcement.shortcuts.some((s) => s.url === preset.url),
                  ).map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2"
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-blue-600 bg-blue-600 text-white">
                        <svg
                          viewBox="0 0 10 8"
                          fill="none"
                          className="h-2.5 w-2.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 4l3 3 5-6" />
                        </svg>
                      </span>
                      <p className="text-sm font-medium text-blue-900">
                        {preset.composerLabel}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Attachments */}
              {announcement.attachments &&
                announcement.attachments.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground">Attachments</p>
                    <div className="mt-1 space-y-1.5">
                      {announcement.attachments.map((att, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 truncate text-sm">
                            {att.name}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {att.size}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Questions — shown for acknowledge / yes-no types */}
              {announcement.questions && announcement.questions.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Questions asked
                  </p>
                  {announcement.questions.map((q, i) => (
                    <div
                      key={q.id}
                      className="rounded-md bg-slate-50 px-3 py-2.5"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-snug text-foreground">
                            {q.text}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {q.type === 'mcq' && q.options ? (
                              q.options.map((opt) => (
                                <span
                                  key={opt}
                                  className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-muted-foreground"
                                >
                                  {opt}
                                </span>
                              ))
                            ) : (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <MessageSquare className="h-3 w-3" />
                                Open-ended
                              </span>
                            )}
                          </div>
                          {q.showAfter && q.showAfter !== 'both' && (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Shown after:{' '}
                              <span
                                className={cn(
                                  'font-medium',
                                  q.showAfter === 'yes'
                                    ? 'text-green-700'
                                    : 'text-rose-600',
                                )}
                              >
                                {q.showAfter === 'yes' ? 'Yes' : 'No'}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Enquiry email — above staff in charge */}
              {isEditing ? (
                <div className="space-y-1 border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Enquiry email
                  </p>
                  <EnquiryEmailSelector
                    value={editEnquiryEmail}
                    onChange={setEditEnquiryEmail}
                  />
                </div>
              ) : (
                announcement.enquiryEmail && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground">
                      Enquiry contact
                    </p>
                    <a
                      href={`mailto:${announcement.enquiryEmail}`}
                      className="mt-1 block truncate text-sm font-medium hover:text-primary hover:underline"
                    >
                      {announcement.enquiryEmail}
                    </a>
                  </div>
                )
              )}

              {/* Staff-in-charge — always editable */}
              <div className="border-t pt-3">
                {isEditing ? (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      Staff-in-charge
                    </p>
                    <StaffSelector
                      value={editStaffInCharge}
                      onChange={(staff) =>
                        setEditStaffInCharge(
                          staff.map((s) => ({
                            ...s,
                            label: stripSalutation(s.label),
                          })),
                        )
                      }
                      renderChipExtra={(entity) => {
                        const isEditor =
                          (editStaffRoles[entity.id] ?? 'viewer') === 'editor'
                        return (
                          <button
                            type="button"
                            title={
                              isEditor ? 'Switch to Viewer' : 'Switch to Editor'
                            }
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditStaffRoles((prev) => ({
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
                ) : (
                  announcement.staffInCharge.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">
                        Staff-in-charge
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {announcement.staffInCharge.map((m) => (
                          <span
                            key={m.id}
                            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-slate-700"
                          >
                            <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="flex-1 truncate">{m.name}</span>
                            <span
                              className={cn(
                                'ml-2 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold',
                                m.role === 'editor'
                                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                                  : 'border-slate-200 bg-slate-50 text-slate-500',
                              )}
                            >
                              {m.role === 'editor' ? 'Editor' : 'Viewer'}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delete dialog ── */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open)
          if (!open) setDeleteConfirmText('')
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete post?</DialogTitle>
            <DialogDescription>
              {announcement.status === 'posted'
                ? 'This post has already been sent to parents. What would you like to do?'
                : 'This will permanently delete the post. This cannot be undone.'}
            </DialogDescription>
          </DialogHeader>

          {announcement.status === 'posted' && (
            <div className="space-y-2 py-1">
              {/* Option: Remove from my list */}
              <button
                type="button"
                onClick={() => {
                  setDeleteMode('remove-from-list')
                  setDeleteConfirmText('')
                }}
                className={cn(
                  'w-full rounded-md border p-3.5 text-left transition-colors',
                  deleteMode === 'remove-from-list'
                    ? 'border-primary bg-primary/[0.04]'
                    : 'border-border hover:bg-muted',
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                      deleteMode === 'remove-from-list'
                        ? 'border-primary bg-primary'
                        : 'border-slate-300',
                    )}
                  >
                    {deleteMode === 'remove-from-list' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-medium">Remove from my list</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Parents can still see this post. It will only be removed
                      from your view.
                    </p>
                  </div>
                </div>
              </button>

              {/* Option: Delete for everyone */}
              <button
                type="button"
                onClick={() => setDeleteMode('delete-for-everyone')}
                className={cn(
                  'w-full rounded-md border p-3.5 text-left transition-colors',
                  deleteMode === 'delete-for-everyone'
                    ? 'border-destructive bg-destructive/[0.04]'
                    : 'border-border hover:bg-muted',
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                      deleteMode === 'delete-for-everyone'
                        ? 'border-destructive bg-destructive'
                        : 'border-slate-300',
                    )}
                  >
                    {deleteMode === 'delete-for-everyone' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      Delete for everyone
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      This post will be removed from the Parents Gateway app.
                      Parents will no longer be able to see it. This cannot be
                      undone.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Type DELETE confirmation — only for "Delete for everyone" on posted posts */}
          {announcement.status === 'posted' &&
            deleteMode === 'delete-for-everyone' && (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs text-muted-foreground">
                  Type{' '}
                  <span className="font-mono font-semibold text-destructive">
                    DELETE
                  </span>{' '}
                  to confirm.
                </p>
                <Input
                  placeholder=""
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="font-mono uppercase"
                  autoComplete="off"
                />
              </div>
            )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteDialog(false)
                setDeleteConfirmText('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant={
                announcement.status !== 'posted' ||
                deleteMode === 'delete-for-everyone'
                  ? 'destructive'
                  : 'default'
              }
              disabled={
                announcement.status === 'posted' &&
                deleteMode === 'delete-for-everyone' &&
                deleteConfirmText.trim().toUpperCase() !== 'DELETE'
              }
              onClick={handleDelete}
            >
              {announcement.status !== 'posted'
                ? 'Delete post'
                : deleteMode === 'remove-from-list'
                  ? 'Remove from my list'
                  : 'Delete for everyone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
