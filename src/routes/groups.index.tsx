import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit2,
  Info,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  Trash2,
  Users,
} from 'lucide-react'

import type { StructuredGroup, StudentGroup } from '@/types/student-group'
import { usePagination } from '@/hooks/use-pagination'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { MOCK_GROUPS } from '@/data/mock-groups'
import { TEACHER_STRUCTURED_GROUPS } from '@/data/mock-structured-groups'
import { cn, stripSalutation } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/empty-state'

export const Route = createFileRoute('/groups/')({
  component: GroupsIndex,
})

const CURRENT_USER_EMAIL = 'tanml@school.edu.sg'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUniqueClasses(members: StudentGroup['members']): Array<string> {
  const seen = new Set<string>()
  for (const m of members) seen.add(m.class)
  return [...seen].sort()
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  )
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}

// ─── Sortable column header ───────────────────────────────────────────────────

type SortState = { column: string; direction: 'asc' | 'desc' } | null

function SortableHeader({
  label,
  column,
  sort,
  onSort,
}: {
  label: string
  column: string
  sort: SortState
  onSort: (col: string, dir: 'asc' | 'desc') => void
}) {
  const [open, setOpen] = useState(false)
  const isSortedBy = sort?.column === column
  const sortDir = isSortedBy ? sort.direction : null
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              '-ml-2 flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 transition-colors whitespace-nowrap',
              'hover:bg-accent hover:text-accent-foreground',
              isSortedBy && 'text-primary',
            )}
          >
            <span>{label}</span>
            <span className="shrink-0">
              {sortDir === 'asc' ? (
                <ArrowUp className="h-3 w-3" />
              ) : sortDir === 'desc' ? (
                <ArrowDown className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </span>
          </button>
        }
      />
      <PopoverContent align="start" className="w-52 gap-1 p-3">
        <button
          type="button"
          onClick={() => {
            onSort(column, 'asc')
            setOpen(false)
          }}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--slate-5)]',
            isSortedBy && sortDir === 'asc' && 'bg-[var(--slate-5)]',
          )}
        >
          <ArrowUp className="h-4 w-4 text-[var(--slate-11)]" />
          Sort ascending
          {isSortedBy && sortDir === 'asc' && (
            <Check className="ml-auto h-4 w-4 text-[var(--slate-11)]" />
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            onSort(column, 'desc')
            setOpen(false)
          }}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--slate-5)]',
            isSortedBy && sortDir === 'desc' && 'bg-[var(--slate-5)]',
          )}
        >
          <ArrowDown className="h-4 w-4 text-[var(--slate-11)]" />
          Sort descending
          {isSortedBy && sortDir === 'desc' && (
            <Check className="ml-auto h-4 w-4 text-[var(--slate-11)]" />
          )}
        </button>
      </PopoverContent>
    </Popover>
  )
}

// ─── SegmentedTab (matches Posts page) ────────────────────────────────────────

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

// ─── Classes pill list ─────────────────────────────────────────────────────────

function ClassPills({
  members,
}: {
  members: StudentGroup['members'] | StructuredGroup['members']
}) {
  const classes = getUniqueClasses(members)
  const visible = classes.slice(0, 3)
  const hidden = classes.length - 3
  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((cls) => (
        <span
          key={cls}
          className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
        >
          {cls}
        </span>
      ))}
      {hidden > 0 && (
        <span className="text-xs text-muted-foreground">+{hidden}</span>
      )}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

type GroupTab = 'my-groups' | 'shared' | 'assigned'

function GroupsIndex() {
  useSetBreadcrumbs([{ label: 'Student Groups', href: '/groups' }])
  const navigate = useNavigate()

  const [tab, setTab] = useState<GroupTab>('my-groups')
  const [sort, setSort] = useState<SortState>(null)
  const [groups, setGroups] = useState<Array<StudentGroup>>(MOCK_GROUPS)
  const [mySearch, setMySearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteMode, setDeleteMode] = useState<
    'delete-for-self' | 'delete-for-everyone'
  >('delete-for-self')
  const [assignedSearch, setAssignedSearch] = useState('')
  const [sharedSearch, setSharedSearch] = useState('')
  const filteredCombinedGroups = useMemo(() => {
    const mine = groups
      .filter((g) => g.createdBy.email === CURRENT_USER_EMAIL)
      .map((g) => ({ ...g, _source: 'mine' as const }))
    const sorted = [...mine].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    if (!mySearch) return sorted
    const q = mySearch.toLowerCase()
    return sorted.filter((g) => g.name.toLowerCase().includes(q))
  }, [groups, mySearch])

  const filteredAssignedGroups = useMemo(
    () =>
      TEACHER_STRUCTURED_GROUPS.filter(
        (g) =>
          !assignedSearch ||
          g.name.toLowerCase().includes(assignedSearch.toLowerCase()),
      ),
    [assignedSearch],
  )

  const filteredSharedGroups = useMemo(() => {
    const shared = groups.filter(
      (g) =>
        g.createdBy.email !== CURRENT_USER_EMAIL &&
        g.sharedWith.some((s) => s.email === CURRENT_USER_EMAIL),
    )
    if (!sharedSearch) return shared
    const q = sharedSearch.toLowerCase()
    return shared.filter((g) => g.name.toLowerCase().includes(q))
  }, [groups, sharedSearch])

  const sortedGroups = useMemo(() => {
    if (!sort) return filteredCombinedGroups
    const dir = sort.direction === 'asc' ? 1 : -1
    return [...filteredCombinedGroups].sort((a, b) => {
      switch (sort.column) {
        case 'name':
          return a.name.localeCompare(b.name) * dir
        case 'students':
          return (a.members.length - b.members.length) * dir
        case 'last-updated':
          return (
            (new Date(a.updatedAt).getTime() -
              new Date(b.updatedAt).getTime()) *
            dir
          )
        case 'created-by':
          return a.createdBy.name.localeCompare(b.createdBy.name) * dir
        default:
          return 0
      }
    })
  }, [filteredCombinedGroups, sort])

  const GROUPS_PAGE_SIZE = 20
  const myGroupsPagination = usePagination({
    totalItems: sortedGroups.length,
    pageSize: GROUPS_PAGE_SIZE,
  })
  const sharedGroupsPagination = usePagination({
    totalItems: filteredSharedGroups.length,
    pageSize: GROUPS_PAGE_SIZE,
  })
  const assignedGroupsPagination = usePagination({
    totalItems: filteredAssignedGroups.length,
    pageSize: GROUPS_PAGE_SIZE,
  })

  const pagedMyGroups = sortedGroups.slice(
    myGroupsPagination.startIndex,
    myGroupsPagination.startIndex + GROUPS_PAGE_SIZE,
  )
  const pagedSharedGroups = filteredSharedGroups.slice(
    sharedGroupsPagination.startIndex,
    sharedGroupsPagination.startIndex + GROUPS_PAGE_SIZE,
  )
  const pagedAssignedGroups = filteredAssignedGroups.slice(
    assignedGroupsPagination.startIndex,
    assignedGroupsPagination.startIndex + GROUPS_PAGE_SIZE,
  )

  const filteredGroupIds = sortedGroups.map((g) => g.id)
  const allSelectedInView =
    filteredGroupIds.length > 0 &&
    filteredGroupIds.every((id) => selectedIds.has(id))
  const someSelectedInView =
    filteredGroupIds.some((id) => selectedIds.has(id)) && !allSelectedInView
  const selectedGroups = sortedGroups.filter((g) => selectedIds.has(g.id))
  // Two-option dialog when user is owner or editor of any selected group
  const hasElevatedAccess = selectedGroups.length > 0

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelectedInView) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredGroupIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelectedIds((prev) => new Set([...prev, ...filteredGroupIds]))
    }
  }

  function openDeleteDialog(id?: string) {
    if (id) setSelectedIds(new Set([id]))
    setDeleteMode('delete-for-self')
    setShowDeleteDialog(true)
  }

  function handleDeleteGroups() {
    const count = selectedIds.size
    setGroups((prev) => prev.filter((g) => !selectedIds.has(g.id)))
    for (const id of selectedIds) {
      const idx = MOCK_GROUPS.findIndex((g) => g.id === id)
      if (idx !== -1) MOCK_GROUPS.splice(idx, 1)
    }
    setSelectedIds(new Set())
    setShowDeleteDialog(false)
    toast.success(
      deleteMode === 'delete-for-self'
        ? `${count} group${count > 1 ? 's' : ''} removed from your list`
        : `${count} group${count > 1 ? 's' : ''} deleted`,
    )
  }

  return (
    <div className="flex flex-col">
      {/* ── Page header (matches forms.tsx pattern) ───────────────────────── */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">Groups</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Organise students into reusable groups for posts, forms, and
              reports.
            </p>
          </div>
          {tab === 'my-groups' && (
            <Button size="sm" render={<Link to="/groups/create" />}>
              <Plus className="mr-1.5 h-4 w-4" />
              New group
            </Button>
          )}
        </div>
      </div>

      {/* ── Toolbar: segmented tabs + school-wide toggle + search + filter ── */}
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-4 px-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex shrink-0 rounded-full bg-muted p-1 gap-1">
              <SegmentedTab
                active={tab === 'my-groups'}
                onClick={() => setTab('my-groups')}
              >
                Created by me
              </SegmentedTab>
              <SegmentedTab
                active={tab === 'shared'}
                onClick={() => setTab('shared')}
              >
                Shared with me
              </SegmentedTab>
              <SegmentedTab
                active={tab === 'assigned'}
                onClick={() => setTab('assigned')}
              >
                Assigned to me
              </SegmentedTab>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search groups…"
                value={
                  tab === 'my-groups'
                    ? mySearch
                    : tab === 'shared'
                      ? sharedSearch
                      : assignedSearch
                }
                onChange={(e) =>
                  tab === 'my-groups'
                    ? setMySearch(e.target.value)
                    : tab === 'shared'
                      ? setSharedSearch(e.target.value)
                      : setAssignedSearch(e.target.value)
                }
                className="w-[240px] pl-9"
              />
            </div>
          </div>
        </div>

        {/* ── My Groups table ─────────────────────────────────────────────── */}
        {tab === 'my-groups' && (
          <div className="max-w-full overflow-x-auto bg-background">
            {sortedGroups.length === 0 ? (
              <div className="flex flex-col items-center py-16">
                <EmptyState
                  title={mySearch ? 'No groups found' : 'No groups yet'}
                  description={
                    mySearch
                      ? 'Try adjusting your search.'
                      : 'Create a group to reuse student lists across announcements, forms, and reports.'
                  }
                />
                {!mySearch && (
                  <Button
                    size="sm"
                    className="mt-4"
                    render={<Link to="/groups/create" />}
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Create your first group
                  </Button>
                )}
              </div>
            ) : (
              <Table tableClassName="table-fixed w-full">
                <TableHeader className="border-b bg-background">
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className="pl-5 w-[44px] sticky left-0 z-10 bg-background">
                      <Checkbox
                        checked={
                          allSelectedInView
                            ? true
                            : someSelectedInView
                              ? 'indeterminate'
                              : false
                        }
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="pl-2 sticky left-[44px] z-10 bg-background">
                      <SortableHeader
                        label="Name"
                        column="name"
                        sort={sort}
                        onSort={(col, dir) =>
                          setSort({ column: col, direction: dir })
                        }
                      />
                    </TableHead>
                    <TableHead className="w-24">
                      <SortableHeader
                        label="Students"
                        column="students"
                        sort={sort}
                        onSort={(col, dir) =>
                          setSort({ column: col, direction: dir })
                        }
                      />
                    </TableHead>
                    <TableHead className="w-32">
                      <SortableHeader
                        label="Last updated"
                        column="last-updated"
                        sort={sort}
                        onSort={(col, dir) =>
                          setSort({ column: col, direction: dir })
                        }
                      />
                    </TableHead>
                    <TableHead className="w-36">
                      <SortableHeader
                        label="Created by"
                        column="created-by"
                        sort={sort}
                        onSort={(col, dir) =>
                          setSort({ column: col, direction: dir })
                        }
                      />
                    </TableHead>
                    <TableHead className="w-[80px] pr-4 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedMyGroups.map((group) => {
                    const isSelected = selectedIds.has(group.id)
                    return (
                      <TableRow
                        key={group.id}
                        className={cn(
                          'cursor-pointer',
                          isSelected &&
                            'bg-primary/[0.04] hover:bg-primary/[0.06]',
                        )}
                        onClick={() =>
                          navigate({
                            to: '/groups/$groupId',
                            params: { groupId: group.id },
                          })
                        }
                      >
                        <TableCell
                          className="pl-5 w-[44px] sticky left-0 z-10 bg-background"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(group.id)}
                            aria-label={`Select ${group.name}`}
                          />
                        </TableCell>
                        <TableCell className="overflow-hidden whitespace-normal pl-2 sticky left-[44px] z-10 bg-background">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate font-medium">
                                {group.name}
                              </span>
                              {group.visibility === 'school' && (
                                <Badge
                                  variant="outline"
                                  className="shrink-0 py-0 text-xs"
                                >
                                  School-wide
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Users className="h-3.5 w-3.5 shrink-0" />
                            {group.members.length}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatRelativeDate(group.updatedAt)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {group.createdBy.email === CURRENT_USER_EMAIL
                            ? 'Me'
                            : stripSalutation(group.createdBy.name)}
                        </TableCell>
                        <TableCell
                          className="w-[48px] pr-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    aria-label="More actions"
                                  />
                                }
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  render={
                                    <Link
                                      to="/groups/$groupId"
                                      params={{ groupId: group.id }}
                                    />
                                  }
                                >
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Edit group
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  render={
                                    <Link
                                      to="/groups/$groupId"
                                      params={{ groupId: group.id }}
                                    />
                                  }
                                >
                                  <Share2 className="mr-2 h-4 w-4" />
                                  Share group
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    const src = MOCK_GROUPS.find(
                                      (g) => g.id === group.id,
                                    )
                                    if (src) {
                                      const copy = {
                                        ...src,
                                        id: `cg-${Date.now()}`,
                                        name: `${src.name} (copy)`,
                                        createdAt: new Date().toISOString(),
                                        updatedAt: new Date().toISOString(),
                                        lastUsedAt: undefined,
                                      }
                                      MOCK_GROUPS.push(copy)
                                      setGroups([...MOCK_GROUPS])
                                      toast.success('Copy created')
                                    }
                                  }}
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  Make a copy
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => openDeleteDialog(group.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete group
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
            <div className="flex shrink-0 items-center justify-between bg-card px-6 py-4">
              <div className="text-sm text-muted-foreground">
                {myGroupsPagination.startIndex + 1}–
                {Math.min(
                  myGroupsPagination.startIndex + GROUPS_PAGE_SIZE,
                  sortedGroups.length,
                )}{' '}
                of {sortedGroups.length} records
              </div>
              {myGroupsPagination.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={myGroupsPagination.goToPreviousPage}
                    disabled={!myGroupsPagination.canGoPrevious}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  {myGroupsPagination.pageNumbers.map((page, index) =>
                    page === 'ellipsis' ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 text-muted-foreground"
                      >
                        ...
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant={
                          myGroupsPagination.currentPage === page
                            ? 'outline'
                            : 'ghost'
                        }
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => myGroupsPagination.goToPage(page)}
                      >
                        {page}
                      </Button>
                    ),
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={myGroupsPagination.goToNextPage}
                    disabled={!myGroupsPagination.canGoNext}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Selection action bar */}
            {selectedIds.size > 0 && (
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
                    setDeleteMode('delete-for-self')
                    setShowDeleteDialog(true)
                  }}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete{' '}
                  {selectedIds.size > 1
                    ? `${selectedIds.size} groups`
                    : 'group'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Assigned Groups table ────────────────────────────────────────── */}
        {tab === 'shared' && (
          <div className="max-w-full overflow-x-auto bg-background">
            {filteredSharedGroups.length === 0 ? (
              <div className="flex flex-col items-center py-16">
                <EmptyState
                  title={sharedSearch ? 'No groups found' : 'No shared groups'}
                  description={
                    sharedSearch
                      ? 'Try adjusting your search.'
                      : 'Groups shared with you by other teachers will appear here.'
                  }
                />
              </div>
            ) : (
              <Table tableClassName="table-fixed w-full">
                <TableHeader className="border-b bg-background">
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className="pl-6">Name</TableHead>
                    <TableHead className="w-24">Students</TableHead>
                    <TableHead className="w-32">Shared by</TableHead>
                    <TableHead className="w-36">Last updated</TableHead>
                    <TableHead className="w-[48px] pr-2" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedSharedGroups.map((group) => (
                    <TableRow
                      key={group.id}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate({
                          to: '/groups/$groupId',
                          params: { groupId: group.id },
                        })
                      }
                    >
                      <TableCell className="overflow-hidden whitespace-normal pl-6">
                        <span className="truncate font-medium">
                          {group.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          {group.members.length}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {stripSalutation(group.createdBy.name)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelativeDate(group.updatedAt)}
                      </TableCell>
                      <TableCell className="w-[48px] pr-2" />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="flex shrink-0 items-center justify-between bg-card px-6 py-4">
              <div className="text-sm text-muted-foreground">
                {sharedGroupsPagination.startIndex + 1}–
                {Math.min(
                  sharedGroupsPagination.startIndex + GROUPS_PAGE_SIZE,
                  filteredSharedGroups.length,
                )}{' '}
                of {filteredSharedGroups.length} records
              </div>
              {sharedGroupsPagination.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={sharedGroupsPagination.goToPreviousPage}
                    disabled={!sharedGroupsPagination.canGoPrevious}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  {sharedGroupsPagination.pageNumbers.map((page, index) =>
                    page === 'ellipsis' ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 text-muted-foreground"
                      >
                        ...
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant={
                          sharedGroupsPagination.currentPage === page
                            ? 'outline'
                            : 'ghost'
                        }
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => sharedGroupsPagination.goToPage(page)}
                      >
                        {page}
                      </Button>
                    ),
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={sharedGroupsPagination.goToNextPage}
                    disabled={!sharedGroupsPagination.canGoNext}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'assigned' && (
          <>
            <div className="px-6">
              <div className="rounded-lg border border-twblue-6 bg-twblue-3/60 px-4 py-2.5">
                <p className="text-sm text-twblue-11">
                  Membership updates automatically based on selected criteria.
                  Contact your school administrator to make changes.
                </p>
              </div>
            </div>

            <div className="max-w-full overflow-x-auto bg-background">
              {filteredAssignedGroups.length === 0 ? (
                <div className="flex flex-col items-center py-16">
                  <EmptyState
                    title={
                      assignedSearch ? 'No groups found' : 'No groups assigned'
                    }
                    description={
                      assignedSearch
                        ? 'Try adjusting your search.'
                        : 'Your school administrator assigns groups in School Cockpit.'
                    }
                  />
                </div>
              ) : (
                <Table tableClassName="table-fixed w-full">
                  <TableHeader className="border-b bg-background">
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableHead className="pl-6">Name</TableHead>
                      <TableHead className="w-24">Students</TableHead>
                      <TableHead className="w-[48px] pr-2" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedAssignedGroups.map((group) => (
                      <TableRow
                        key={group.id}
                        className="cursor-pointer"
                        onClick={() =>
                          navigate({
                            to: '/groups/structured/$groupId',
                            params: { groupId: group.id },
                          })
                        }
                      >
                        <TableCell className="overflow-hidden whitespace-normal pl-6">
                          <span className="truncate font-medium">
                            {group.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Users className="h-3.5 w-3.5 shrink-0" />
                            {group.members.length}
                          </div>
                        </TableCell>
                        <TableCell
                          className="w-[48px] pr-2"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="flex shrink-0 items-center justify-between bg-card px-6 py-4">
                <div className="text-sm text-muted-foreground">
                  {assignedGroupsPagination.startIndex + 1}–
                  {Math.min(
                    assignedGroupsPagination.startIndex + GROUPS_PAGE_SIZE,
                    filteredAssignedGroups.length,
                  )}{' '}
                  of {filteredAssignedGroups.length} records
                </div>
                {assignedGroupsPagination.totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={assignedGroupsPagination.goToPreviousPage}
                      disabled={!assignedGroupsPagination.canGoPrevious}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    {assignedGroupsPagination.pageNumbers.map((page, index) =>
                      page === 'ellipsis' ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-2 text-muted-foreground"
                        >
                          ...
                        </span>
                      ) : (
                        <Button
                          key={page}
                          variant={
                            assignedGroupsPagination.currentPage === page
                              ? 'outline'
                              : 'ghost'
                          }
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            assignedGroupsPagination.goToPage(page)
                          }
                        >
                          {page}
                        </Button>
                      ),
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={assignedGroupsPagination.goToNextPage}
                      disabled={!assignedGroupsPagination.canGoNext}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Delete confirmation ──────────────────────────────────────────────── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Delete{' '}
              {selectedIds.size > 1 ? `${selectedIds.size} groups` : 'group'}?
            </DialogTitle>
            {!hasElevatedAccess ? (
              <DialogDescription>
                This action cannot be undone.
              </DialogDescription>
            ) : (
              <DialogDescription>
                Choose what to do with{' '}
                {selectedIds.size > 1 ? 'these groups' : 'this group'}:
              </DialogDescription>
            )}
          </DialogHeader>

          {hasElevatedAccess && (
            <div className="space-y-2 py-1">
              {/* Option: Delete for myself */}
              <button
                type="button"
                onClick={() => setDeleteMode('delete-for-self')}
                className={cn(
                  'w-full rounded-md border p-3.5 text-left transition-colors',
                  deleteMode === 'delete-for-self'
                    ? 'border-primary bg-primary/[0.04]'
                    : 'border-border hover:bg-muted',
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                      deleteMode === 'delete-for-self'
                        ? 'border-primary bg-primary'
                        : 'border-border',
                    )}
                  >
                    {deleteMode === 'delete-for-self' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-medium">Delete for myself</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Remove from your list. Others you've shared it with can
                      still access the group.
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
                        : 'border-border',
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
                      Permanently deletes the group for all users it has been
                      shared with. This cannot be undone.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={
                !hasElevatedAccess || deleteMode === 'delete-for-everyone'
                  ? 'destructive'
                  : 'default'
              }
              onClick={handleDeleteGroups}
            >
              {!hasElevatedAccess
                ? `Delete ${selectedIds.size > 1 ? `${selectedIds.size} groups` : 'group'}`
                : deleteMode === 'delete-for-self'
                  ? 'Delete for myself'
                  : 'Delete for everyone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
