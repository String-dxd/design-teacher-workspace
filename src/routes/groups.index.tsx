import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Copy,
  Edit2,
  Filter,
  Info,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Share2,
  Trash2,
  Users,
} from 'lucide-react'

import type {
  GroupTypeFilterOption,
  StructuredGroup,
  StudentGroup,
} from '@/types/student-group'
import { getStructuredTypeLabel } from '@/types/student-group'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { MOCK_GROUPS, MOCK_SHARED_GROUPS } from '@/data/mock-groups'
import { TEACHER_STRUCTURED_GROUPS } from '@/data/mock-structured-groups'
import { cn, stripSalutation } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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

// ─── Type filter popover (Assigned Groups tab) ─────────────────────────────────

const STRUCTURED_FILTER_OPTIONS: Array<{
  value: Exclude<GroupTypeFilterOption, 'regular'>
  label: string
}> = [
  { value: 'class', label: 'Class' },
  { value: 'level', label: 'Level' },
  { value: 'cca', label: 'CCA' },
  { value: 'teaching', label: 'Teaching Group' },
]

interface TypeFilterPopoverProps {
  value: Set<Exclude<GroupTypeFilterOption, 'regular'>>
  onChange: (v: Set<Exclude<GroupTypeFilterOption, 'regular'>>) => void
}

function TypeFilterPopover({ value, onChange }: TypeFilterPopoverProps) {
  function toggle(opt: Exclude<GroupTypeFilterOption, 'regular'>) {
    const next = new Set(value)
    if (next.has(opt)) next.delete(opt)
    else next.add(opt)
    onChange(next)
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
            {value.size > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {value.size}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-[360px] p-0">
        <div className="px-5 pb-3 pt-4">
          <h3 className="text-sm font-semibold">Show records</h3>
        </div>
        <div className="px-5 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-sm font-medium">Type</span>
            <div className="flex flex-1 flex-wrap gap-1.5">
              {STRUCTURED_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className={cn(
                    'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                    value.has(opt.value)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-foreground hover:border-primary hover:text-primary',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end border-t px-5 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(new Set())}
            disabled={value.size === 0}
            className="gap-2 text-sm font-medium"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── Ownership filter popover (My Groups tab) ──────────────────────────────────

const OWNERSHIP_OPTIONS = [
  { value: 'mine' as const, label: 'Created by me' },
  { value: 'shared' as const, label: 'Shared with me' },
]

function OwnershipFilterPopover({
  value,
  onChange,
}: {
  value: Set<'mine' | 'shared'>
  onChange: (v: Set<'mine' | 'shared'>) => void
}) {
  function toggle(opt: 'mine' | 'shared') {
    const next = new Set(value)
    if (next.has(opt)) next.delete(opt)
    else next.add(opt)
    onChange(next)
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
            {value.size > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {value.size}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-[320px] p-0">
        <div className="px-5 pb-3 pt-4">
          <h3 className="text-sm font-semibold">Show records</h3>
        </div>
        <div className="px-5 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-sm font-medium">Owner</span>
            <div className="flex flex-1 flex-wrap gap-1.5">
              {OWNERSHIP_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className={cn(
                    'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                    value.has(opt.value)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-foreground hover:border-primary hover:text-primary',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end border-t px-5 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(new Set())}
            disabled={value.size === 0}
            className="gap-2 text-sm font-medium"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </PopoverContent>
    </Popover>
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

type GroupTab = 'my-groups' | 'assigned'

function GroupsIndex() {
  useSetBreadcrumbs([{ label: 'Student Groups', href: '/groups' }])
  const navigate = useNavigate()

  const [tab, setTab] = useState<GroupTab>('my-groups')
  const [groups, setGroups] = useState<Array<StudentGroup>>(MOCK_GROUPS)
  const [mySearch, setMySearch] = useState('')
  const [ownershipFilter, setOwnershipFilter] = useState<
    Set<'mine' | 'shared'>
  >(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteMode, setDeleteMode] = useState<
    'delete-for-self' | 'delete-for-everyone'
  >('delete-for-self')
  const [assignedSearch, setAssignedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<
    Set<Exclude<GroupTypeFilterOption, 'regular'>>
  >(new Set())

  const filteredCombinedGroups = useMemo(() => {
    const mine = groups
      .filter((g) => g.createdBy.email === CURRENT_USER_EMAIL)
      .map((g) => ({ ...g, _source: 'mine' as const }))
    const shared = MOCK_SHARED_GROUPS.map((g) => ({
      ...g,
      _source: 'shared' as const,
    }))
    const combined =
      ownershipFilter.size === 1 && ownershipFilter.has('mine')
        ? mine
        : ownershipFilter.size === 1 && ownershipFilter.has('shared')
          ? shared
          : [...mine, ...shared]
    const sorted = [...combined].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    if (!mySearch) return sorted
    const q = mySearch.toLowerCase()
    return sorted.filter((g) => g.name.toLowerCase().includes(q))
  }, [groups, mySearch, ownershipFilter])

  const filteredAssignedGroups = useMemo(
    () =>
      TEACHER_STRUCTURED_GROUPS.filter((g) => {
        const matchesSearch =
          !assignedSearch ||
          g.name.toLowerCase().includes(assignedSearch.toLowerCase())
        const matchesType =
          typeFilter.size === 0 || typeFilter.has(g.structuredType)
        return matchesSearch && matchesType
      }),
    [assignedSearch, typeFilter],
  )

  const filteredGroupIds = filteredCombinedGroups.map((g) => g.id)
  const allSelectedInView =
    filteredGroupIds.length > 0 &&
    filteredGroupIds.every((id) => selectedIds.has(id))
  const someSelectedInView =
    filteredGroupIds.some((id) => selectedIds.has(id)) && !allSelectedInView
  const selectedGroups = filteredCombinedGroups.filter((g) =>
    selectedIds.has(g.id),
  )
  // Two-option dialog when user is owner or editor of any selected group
  const hasElevatedAccess = selectedGroups.some(
    (g) =>
      g._source === 'mine' ||
      (
        g as typeof g & { sharedWith?: Array<{ email: string; role: string }> }
      ).sharedWith?.find((s) => s.email === CURRENT_USER_EMAIL)?.role ===
        'editor',
  )

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
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-900">
                Concept
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Organise students into reusable groups for announcements, forms,
              and reports.
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

      {/* ── Toolbar: segmented tabs + search + filter (matches Posts) ─────── */}
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-4 px-6 pb-0">
          <div className="flex shrink-0 rounded-full bg-muted p-1 gap-1">
            <SegmentedTab
              active={tab === 'my-groups'}
              onClick={() => setTab('my-groups')}
            >
              My Groups
            </SegmentedTab>
            <SegmentedTab
              active={tab === 'assigned'}
              onClick={() => setTab('assigned')}
            >
              Assigned Groups
            </SegmentedTab>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search groups…"
                value={tab === 'my-groups' ? mySearch : assignedSearch}
                onChange={(e) =>
                  tab === 'my-groups'
                    ? setMySearch(e.target.value)
                    : setAssignedSearch(e.target.value)
                }
                className="w-[240px] pl-9"
              />
            </div>
            {tab === 'my-groups' && (
              <OwnershipFilterPopover
                value={ownershipFilter}
                onChange={setOwnershipFilter}
              />
            )}
            {tab === 'assigned' && (
              <TypeFilterPopover value={typeFilter} onChange={setTypeFilter} />
            )}
          </div>
        </div>

        {/* ── My Groups table ─────────────────────────────────────────────── */}
        {tab === 'my-groups' && (
          <div className="max-w-full overflow-x-auto bg-background">
            {filteredCombinedGroups.length === 0 ? (
              <div className="flex flex-col items-center py-16">
                <EmptyState
                  title={
                    mySearch || ownershipFilter.size > 0
                      ? 'No groups found'
                      : 'No groups yet'
                  }
                  description={
                    mySearch || ownershipFilter.size > 0
                      ? 'Try adjusting your search or filter.'
                      : 'Create a group to reuse student lists across announcements, forms, and reports.'
                  }
                />
                {!mySearch && ownershipFilter.size === 0 && (
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
                    <TableHead className="pl-5 w-[44px]">
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
                    <TableHead className="pl-2">Name</TableHead>
                    <TableHead className="w-24">Students</TableHead>
                    <TableHead className="w-24">Type</TableHead>
                    <TableHead className="w-32">Last updated</TableHead>
                    <TableHead className="w-36">Created by</TableHead>
                    <TableHead className="w-[48px] pr-2" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCombinedGroups.map((group) => {
                    const isShared = group._source === 'shared'
                    const sharedRole = isShared
                      ? group.sharedWith.find(
                          (s) => s.email === CURRENT_USER_EMAIL,
                        )?.role
                      : undefined
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
                          className="pl-5 w-[44px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(group.id)}
                            aria-label={`Select ${group.name}`}
                          />
                        </TableCell>
                        <TableCell className="overflow-hidden whitespace-normal pl-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate font-medium">
                                {group.name}
                              </span>
                              {isShared && (
                                <Badge
                                  variant="outline"
                                  className="shrink-0 py-0 text-xs text-muted-foreground"
                                >
                                  {sharedRole === 'editor'
                                    ? 'Editor'
                                    : 'Viewer'}
                                </Badge>
                              )}
                              {!isShared && group.visibility === 'school' && (
                                <Badge
                                  variant="outline"
                                  className="shrink-0 py-0 text-xs"
                                >
                                  School-wide
                                </Badge>
                              )}
                            </div>
                            {group.listType === 'live' && group.criteria && (
                              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                {group.criteria}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Users className="h-3.5 w-3.5 shrink-0" />
                            {group.members.length}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="py-0 text-xs">
                            {group.listType === 'live' ? 'Criteria' : 'Custom'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {group.listType === 'live'
                            ? 'Auto'
                            : formatRelativeDate(group.updatedAt)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {group.createdBy.email === CURRENT_USER_EMAIL
                            ? 'Me'
                            : stripSalutation(group.createdBy.name)}
                        </TableCell>
                        <TableCell
                          className="w-[48px] pr-2 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!isShared ? (
                            // Owner: full dropdown
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
                          ) : sharedRole === 'editor' ? (
                            // Shared editor: Edit + Make a copy
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
                                  onClick={() => {
                                    const { _source: _, ...groupData } = group
                                    const copy = {
                                      ...groupData,
                                      id: `cg-${Date.now()}`,
                                      name: `${group.name} (copy)`,
                                      createdBy: {
                                        name: 'Mrs Tan Mei Lin',
                                        email: CURRENT_USER_EMAIL,
                                      },
                                      sharedWith: [],
                                      createdAt: new Date().toISOString(),
                                      updatedAt: new Date().toISOString(),
                                      lastUsedAt: undefined,
                                    }
                                    MOCK_GROUPS.push(copy)
                                    setGroups([...MOCK_GROUPS])
                                    toast.success('Copy created')
                                  }}
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  Make a copy
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}

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
        {tab === 'assigned' && (
          <>
            <div className="px-6">
              <Alert className="border-blue-200 bg-blue-50/60 text-blue-900">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-800">
                  Membership updates automatically based on selected criteria.
                  Contact your school administrator to make changes.
                </AlertDescription>
              </Alert>
            </div>

            <div className="max-w-full overflow-x-auto bg-background">
              {filteredAssignedGroups.length === 0 ? (
                <div className="flex flex-col items-center py-16">
                  <EmptyState
                    title={
                      assignedSearch || typeFilter.size > 0
                        ? 'No groups found'
                        : 'No groups assigned'
                    }
                    description={
                      assignedSearch || typeFilter.size > 0
                        ? 'Try adjusting your search or filters.'
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
                      <TableHead className="w-28">Type</TableHead>
                      <TableHead className="w-[48px] pr-2" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignedGroups.map((group) => (
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
                        <TableCell>
                          <Badge variant="outline" className="py-0 text-xs">
                            {getStructuredTypeLabel(group.structuredType)}
                          </Badge>
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
                        : 'border-slate-300',
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
