import { useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  Copy,
  Lock,
  MoreHorizontal,
  Paperclip,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import type { PGAnnouncement, PGStatus } from '@/types/pg-announcement'
import type { FormStatus } from '@/types/form'
import type { AnnouncementFilters } from '@/components/comms/announcement-filter-bar'
import { clearDraft, loadDraft } from '@/lib/draft-storage'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { mockPGAnnouncements } from '@/data/mock-pg-announcements'
import { mockForms } from '@/data/mock-forms'
import { StatusBadge } from '@/components/comms/status-badge'
import { ReadRate } from '@/components/comms/read-rate'
import {
  AnnouncementFilterBar,
  EMPTY_ANNOUNCEMENT_FILTERS,
} from '@/components/comms/announcement-filter-bar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/empty-state'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFeatureFlag } from '@/hooks/use-feature-flag'

export const Route = createFileRoute('/announcements/')({
  validateSearch: (search) => ({
    tab: (search.tab as PostTab) ?? 'view-only',
  }),
  component: ParentsGatewayPage,
})

function formatDate(iso: string | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function isLowReadRate(
  postedAt: string | undefined,
  readCount: number,
  total: number,
): boolean {
  if (!postedAt || total === 0) return false
  const hoursElapsed = (Date.now() - new Date(postedAt).getTime()) / 3600000
  return hoursElapsed >= 48 && readCount / total < 0.5
}

function getRelevantDate(
  status: PGStatus,
  postedAt?: string,
  scheduledAt?: string,
  createdAt?: string,
): string | undefined {
  if (status === 'posted') return postedAt
  if (status === 'scheduled') return scheduledAt
  return createdAt
}

function SegmentedTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      className={cn(
        'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function getFormStatusBadge(status: FormStatus) {
  const config = {
    active: {
      label: 'Open',
      className: 'bg-green-100 text-green-700 hover:bg-green-100',
    },
    draft: {
      label: 'Draft',
      className: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
    },
    closed: {
      label: 'Closed',
      className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    },
  }
  const { label, className } = config[status]
  return <Badge className={className}>{label}</Badge>
}

type PostTab = 'view-only' | 'with-responses' | 'custom-forms'

function ParentsGatewayPage() {
  const { tab: initialTab } = Route.useSearch()
  const [searchQuery, setSearchQuery] = useState('')
  const [tab, setTab] = useState<PostTab>(initialTab)
  const [filters, setFilters] = useState<AnnouncementFilters>(
    EMPTY_ANNOUNCEMENT_FILTERS,
  )
  const formsEnabled = useFeatureFlag('forms')

  // Multi-select + delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteMode, setDeleteMode] = useState<
    'remove-from-list' | 'delete-for-everyone'
  >('remove-from-list')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  // Incrementing this key forces allAnnouncements to re-read mockPGAnnouncements after a deletion
  const [refreshKey, setRefreshKey] = useState(0)

  useSetBreadcrumbs([{ label: 'Posts', href: '/announcements' }])
  const navigate = useNavigate()

  // Include any in-progress localStorage draft as a synthetic row at the top
  const allAnnouncements = useMemo<Array<PGAnnouncement>>(() => {
    const draft = loadDraft()
    if (!draft) return mockPGAnnouncements
    const draftRow: PGAnnouncement = {
      id: '__draft__',
      title: draft.title.trim() || 'Untitled post',
      description: draft.description,
      shortcuts: draft.shortcuts ?? [],
      websiteLinks: draft.websiteLinks ?? [],
      status: 'draft',
      recipients: [],
      staffInCharge: [],
      enquiryEmail: draft.enquiryEmail ?? '',
      ownership: 'mine',
      role: 'editor',
      createdAt: draft.savedAt,
      responseType: draft.responseType ?? 'view-only',
    }
    return [draftRow, ...mockPGAnnouncements]
  }, [refreshKey])

  const filtered = useMemo(() => {
    return allAnnouncements
      .filter((a) => {
        // Tab filter
        const hasResponse =
          a.responseType === 'acknowledge' || a.responseType === 'yes-no'
        if (tab === 'view-only' && hasResponse) return false
        if (tab === 'with-responses' && !hasResponse) return false

        // Response type filter
        if (filters.responseTypes.length > 0) {
          const effectiveType = a.responseType ?? 'view-only'
          if (!filters.responseTypes.includes(effectiveType)) return false
        }
        // Status filter
        if (filters.statuses.length > 0 && !filters.statuses.includes(a.status))
          return false

        // Ownership filter
        if (
          filters.ownerships.length > 0 &&
          !filters.ownerships.includes(a.ownership)
        )
          return false

        // Date range filter — compare against the relevant date for this status
        const relevantDate = getRelevantDate(
          a.status,
          a.postedAt,
          a.scheduledAt,
          a.createdAt,
        )
        if (filters.dateFrom && relevantDate) {
          if (new Date(relevantDate) < new Date(filters.dateFrom)) return false
        }
        if (filters.dateTo && relevantDate) {
          // dateTo is inclusive — compare to end of day
          const toEnd = new Date(filters.dateTo)
          toEnd.setHours(23, 59, 59, 999)
          if (new Date(relevantDate) > toEnd) return false
        }

        // Search query
        if (searchQuery) {
          const q = searchQuery.toLowerCase()
          return (
            a.title.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q)
          )
        }
        return true
      })
      .sort((a, b) => {
        // Drafts always float to the top
        const aDraft = a.status === 'draft' ? 0 : 1
        const bDraft = b.status === 'draft' ? 0 : 1
        if (aDraft !== bDraft) return aDraft - bDraft

        const dateA =
          getRelevantDate(a.status, a.postedAt, a.scheduledAt, a.createdAt) ??
          ''
        const dateB =
          getRelevantDate(b.status, b.postedAt, b.scheduledAt, b.createdAt) ??
          ''
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })
  }, [searchQuery, filters, tab, allAnnouncements])

  const filteredForms = useMemo(() => {
    return mockForms
      .filter((form) => {
        if ((form.source ?? 'custom') !== 'custom') return false
        if (searchQuery) {
          const q = searchQuery.toLowerCase()
          return (
            form.title.toLowerCase().includes(q) ||
            form.description.toLowerCase().includes(q)
          )
        }
        return true
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
  }, [searchQuery])

  const tabs: Array<{ value: PostTab; label: string; hidden?: boolean }> = [
    { value: 'view-only', label: 'Posts' },
    { value: 'with-responses', label: 'Posts with responses' },
    { value: 'custom-forms', label: 'Custom forms', hidden: !formsEnabled },
  ]
  const visibleTabs = tabs.filter((t) => !t.hidden)

  // Selection helpers
  const filteredIds = filtered.map((a) => a.id)
  const selectedInView = filteredIds.filter((id) => selectedIds.has(id))
  const allSelectedInView =
    filteredIds.length > 0 && selectedInView.length === filteredIds.length
  const someSelectedInView = selectedInView.length > 0 && !allSelectedInView

  const selectedItems = allAnnouncements.filter((a) => selectedIds.has(a.id))
  const postedSelected = selectedItems.filter((a) => a.status === 'posted')
  const nonPostedSelected = selectedItems.filter((a) => a.status !== 'posted')
  const hasPostedSelected = postedSelected.length > 0

  function toggleSelectAll() {
    if (allSelectedInView) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelectedIds((prev) => new Set([...prev, ...filteredIds]))
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function openDeleteDialog(id?: string) {
    if (id) setSelectedIds(new Set([id]))
    setDeleteMode('remove-from-list')
    setShowDeleteDialog(true)
  }

  function handleDelete() {
    const count = selectedIds.size
    for (const id of selectedIds) {
      if (id === '__draft__') {
        clearDraft()
        continue
      }
      const idx = mockPGAnnouncements.findIndex((a) => a.id === id)
      if (idx !== -1) mockPGAnnouncements.splice(idx, 1)
    }
    setSelectedIds(new Set())
    setShowDeleteDialog(false)
    setDeleteConfirmText('')
    setRefreshKey((k) => k + 1)

    const msg =
      hasPostedSelected && deleteMode === 'remove-from-list'
        ? `${count} post${count > 1 ? 's' : ''} removed from your list`
        : `${count} post${count > 1 ? 's' : ''} deleted`
    toast.success(msg)
  }

  return (
    <div className="flex flex-col">
      {/* Segmented tabs, Search & Filter */}
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-4 px-6 pb-0">
          <div className="flex shrink-0 rounded-full bg-muted p-1 gap-1">
            {visibleTabs.map((t) => (
              <SegmentedTab
                key={t.value}
                active={tab === t.value}
                onClick={() => setTab(t.value)}
              >
                {t.label}
              </SegmentedTab>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={
                  tab === 'custom-forms' ? 'Search forms...' : 'Search posts...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[240px] pl-9"
                aria-label={
                  tab === 'custom-forms' ? 'Search forms' : 'Search posts'
                }
              />
            </div>
            <AnnouncementFilterBar filters={filters} onChange={setFilters} />
          </div>
        </div>

        {/* Table */}
        {tab === 'custom-forms' ? (
          <div className="max-w-full overflow-x-auto bg-background">
            {filteredForms.length === 0 ? (
              <div className="flex flex-col items-center py-16">
                <EmptyState
                  title="No forms found"
                  description="Try adjusting your search, or create a new form."
                />
              </div>
            ) : (
              <Table tableClassName="table-fixed w-full">
                <TableHeader className="border-b bg-background">
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className="w-[500px] pl-6">Title</TableHead>
                    <TableHead className="w-[110px]">Date</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[90px]">Created by</TableHead>
                    <TableHead className="w-[150px]">Read / Response</TableHead>
                    <TableHead className="w-[48px] pr-2" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.map((form) => {
                    const isShared = form.ownership === 'shared'
                    return (
                      <TableRow
                        key={form.id}
                        className="cursor-pointer"
                        onClick={() =>
                          navigate({
                            to: '/forms/$id',
                            params: { id: form.id },
                          })
                        }
                      >
                        <TableCell className="overflow-hidden whitespace-normal pl-6">
                          <div className="min-w-0">
                            <span className="truncate font-medium">
                              {form.title}
                            </span>
                            <div className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                              {form.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(form.createdAt).toLocaleDateString(
                            'en-SG',
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            },
                          )}
                        </TableCell>
                        <TableCell>{getFormStatusBadge(form.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            {isShared ? (
                              <>
                                <Users className="h-3.5 w-3.5 shrink-0" />
                                <span>Shared</span>
                              </>
                            ) : (
                              <span>Me</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="pr-6">
                          {form.status === 'draft' ? (
                            <span className="text-sm text-muted-foreground">
                              —
                            </span>
                          ) : (
                            <ReadRate
                              readCount={form.completedCount}
                              totalCount={form.recipientCount}
                            />
                          )}
                        </TableCell>
                        <TableCell
                          className="w-[48px] pr-2 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                aria-label="More actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto bg-background">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16">
                <EmptyState
                  title="No posts found"
                  description="Try adjusting your search or filter, or create a new post."
                />
              </div>
            ) : (
              <Table tableClassName="table-fixed w-full">
                <TableHeader className="border-b bg-background">
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className="w-[44px] pl-5">
                      <Checkbox
                        checked={allSelectedInView}
                        indeterminate={someSelectedInView}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="w-[456px] pl-2">Title</TableHead>
                    <TableHead className="w-[110px]">Date</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[90px]">Created by</TableHead>
                    <TableHead className="w-[150px]">
                      {tab === 'with-responses' ? 'Response' : 'Read'}
                    </TableHead>
                    <TableHead className="w-[48px] pr-2" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((announcement) => {
                    const totalCount = announcement.recipients.length
                    const readCount = announcement.recipients.filter(
                      (r) => r.readStatus === 'read',
                    ).length
                    const responseCount = announcement.recipients.filter(
                      (r) => r.respondedAt != null,
                    ).length
                    const yesCount = announcement.recipients.filter(
                      (r) => r.formResponse === 'yes',
                    ).length
                    const noCount = announcement.recipients.filter(
                      (r) => r.formResponse === 'no',
                    ).length
                    const hasResponseType =
                      announcement.responseType === 'acknowledge' ||
                      announcement.responseType === 'yes-no'
                    const showUrgency = isLowReadRate(
                      announcement.postedAt,
                      readCount,
                      totalCount,
                    )
                    const relevantDate = getRelevantDate(
                      announcement.status,
                      announcement.postedAt,
                      announcement.scheduledAt,
                      announcement.createdAt,
                    )
                    const isViewer = announcement.role === 'viewer'
                    const isShared = announcement.ownership === 'shared'

                    const isSelected = selectedIds.has(announcement.id)

                    return (
                      <TableRow
                        key={announcement.id}
                        className={cn(
                          'cursor-pointer',
                          isSelected &&
                            'bg-primary/[0.04] hover:bg-primary/[0.06]',
                        )}
                        onClick={() =>
                          announcement.id === '__draft__'
                            ? navigate({
                                to: '/announcements/new',
                                search: { resume: 'true' },
                              })
                            : announcement.status === 'draft'
                              ? navigate({
                                  to: '/announcements/new',
                                  search: { edit: announcement.id },
                                })
                              : navigate({
                                  to: '/announcements/$id',
                                  params: { id: announcement.id },
                                })
                        }
                      >
                        <TableCell
                          className="pl-5 w-[44px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              toggleSelect(announcement.id)
                            }
                            aria-label={`Select ${announcement.title}`}
                          />
                        </TableCell>
                        <TableCell className="overflow-hidden whitespace-normal pl-2">
                          <div className="flex items-start gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate font-medium">
                                  {announcement.title}
                                </span>
                                {(announcement.attachments?.length ?? 0) >
                                  0 && (
                                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                )}
                                {announcement.responseType ===
                                  'acknowledge' && (
                                  <span className="shrink-0 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 ring-1 ring-inset ring-blue-200">
                                    Acknowledge
                                  </span>
                                )}
                                {announcement.responseType === 'yes-no' && (
                                  <span className="shrink-0 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-600 ring-1 ring-inset ring-violet-200">
                                    Yes/No
                                  </span>
                                )}
                                {showUrgency && (
                                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                                )}
                              </div>
                              <div className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                                {announcement.description.replace(
                                  /<[^>]*>/g,
                                  '',
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {announcement.status !== 'draft' && (
                            <span
                              className={
                                announcement.status === 'scheduled'
                                  ? 'text-amber-600'
                                  : undefined
                              }
                            >
                              {formatDate(relevantDate)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={announcement.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            {isShared ? (
                              <>
                                <Users className="h-3.5 w-3.5 shrink-0" />
                                <span>Shared</span>
                                {isViewer && (
                                  <Lock className="h-3 w-3 shrink-0 text-slate-400" />
                                )}
                              </>
                            ) : (
                              <span>Me</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="pr-6">
                          {announcement.status !== 'posted' ? (
                            <span className="text-sm text-muted-foreground">
                              —
                            </span>
                          ) : hasResponseType ? (
                            <ReadRate
                              readCount={responseCount}
                              totalCount={totalCount}
                            />
                          ) : (
                            <ReadRate
                              readCount={readCount}
                              totalCount={totalCount}
                            />
                          )}
                        </TableCell>
                        <TableCell
                          className="w-[48px] pr-2 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                aria-label="More actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() =>
                                  openDeleteDialog(announcement.id)
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}

            {/* Floating selection action bar */}
            {selectedIds.size > 0 && tab !== 'custom-forms' && (
              <div className="flex items-center gap-3 border-t bg-background px-6 py-3">
                <span className="text-sm font-medium text-foreground">
                  {selectedIds.size} selected
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
                <div className="flex-1" />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setDeleteMode('remove-from-list')
                    setShowDeleteDialog(true)
                  }}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete{' '}
                  {selectedIds.size > 1 ? `${selectedIds.size} posts` : 'post'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open)
          if (!open) setDeleteConfirmText('')
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Delete{' '}
              {selectedIds.size > 1 ? `${selectedIds.size} posts` : 'post'}?
            </DialogTitle>
            {!hasPostedSelected ? (
              <DialogDescription>
                This action cannot be undone.
              </DialogDescription>
            ) : (
              <DialogDescription>
                {nonPostedSelected.length > 0 && (
                  <span>
                    {nonPostedSelected.length}{' '}
                    {nonPostedSelected.length > 1 ? 'posts' : 'post'} (draft /
                    scheduled) will be permanently deleted.{' '}
                  </span>
                )}
                {nonPostedSelected.length > 0
                  ? `For the ${postedSelected.length} published ${postedSelected.length > 1 ? 'posts' : 'post'}, choose what to do:`
                  : `This post has already been sent to parents. What would you like to do?`}
              </DialogDescription>
            )}
          </DialogHeader>

          {hasPostedSelected && (
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

          {/* Type DELETE confirmation — only for "Delete for everyone" */}
          {hasPostedSelected && deleteMode === 'delete-for-everyone' && (
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
                !hasPostedSelected || deleteMode === 'delete-for-everyone'
                  ? 'destructive'
                  : 'default'
              }
              disabled={
                hasPostedSelected &&
                deleteMode === 'delete-for-everyone' &&
                deleteConfirmText.trim().toUpperCase() !== 'DELETE'
              }
              onClick={handleDelete}
            >
              {!hasPostedSelected
                ? `Delete ${selectedIds.size > 1 ? `${selectedIds.size} posts` : 'post'}`
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
