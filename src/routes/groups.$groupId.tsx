import { useMemo, useState } from 'react'
import {
  Link,
  createFileRoute,
  notFound,
  useNavigate,
} from '@tanstack/react-router'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Edit2,
  ExternalLink,
  Info,
  MoreHorizontal,
  Search,
  Share2,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react'

import type { GroupSharedWith, StudentGroup } from '@/types/student-group'
import type { SelectedEntity } from '@/components/comms/entity-selector'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { MOCK_GROUPS, getGroupById } from '@/data/mock-groups'
import { MOCK_STAFF, MOCK_STAFF_GROUPS } from '@/data/mock-staff'
import { StaffSelector } from '@/components/comms/staff-selector'
import { cn, stripSalutation } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/empty-state'

const CURRENT_USER_EMAIL = 'tanml@school.edu.sg'

export const Route = createFileRoute('/groups/$groupId')({
  component: GroupDetailPage,
  loader: ({ params }) => {
    const group = getGroupById(params.groupId)
    if (!group) throw notFound()
    return { group }
  },
})

const PAGE_SIZE = 10

/** Initials avatar for a staff name */
function StaffAvatar({ name, size = 8 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .slice(-2)
    .map((n) => n[0])
    .join('')
  return (
    <div
      className={cn(
        'shrink-0 flex items-center justify-center rounded-full bg-muted text-xs font-medium',
        `size-${size}`,
      )}
    >
      {initials}
    </div>
  )
}

function SharingDialog({
  group,
  open,
  onOpenChange,
  onSave,
}: {
  group: StudentGroup
  open: boolean
  onOpenChange: (isOpen: boolean) => void
  onSave: (
    visibility: 'private' | 'school',
    sharedWith: Array<GroupSharedWith>,
  ) => void
}) {
  // Seed StaffSelector value from existing sharedWith entries
  const [selectedStaff, setSelectedStaff] = useState<Array<SelectedEntity>>(
    () =>
      group.sharedWith.map((sw) => ({
        id: sw.staffId,
        label: stripSalutation(sw.name),
        type: 'individual' as const,
        count: 1,
      })),
  )

  // Role overrides per staffId — defaults to 'viewer' for newly added people
  const [staffRoles, setStaffRoles] = useState<
    Record<string, 'viewer' | 'editor'>
  >(() =>
    Object.fromEntries(group.sharedWith.map((sw) => [sw.staffId, sw.role])),
  )

  // Expand the selectedStaff entities (groups → individual staff IDs)
  const expandedStaffIds = useMemo<Array<string>>(() => {
    const ids: Array<string> = []
    const seen = new Set<string>()
    for (const entity of selectedStaff) {
      if (entity.type === 'individual') {
        if (!seen.has(entity.id)) {
          seen.add(entity.id)
          ids.push(entity.id)
        }
      } else {
        // Group — find and expand, respecting exclusions
        const grp = MOCK_STAFF_GROUPS.find((g) => g.id === entity.id)
        if (!grp) continue
        const excluded = new Set(entity.excludedMemberNames ?? [])
        for (const memberId of grp.memberIds) {
          const member = MOCK_STAFF.find((s) => s.id === memberId)
          if (!member) continue
          const memberName = stripSalutation(member.name)
          if (!excluded.has(memberName) && !seen.has(memberId)) {
            seen.add(memberId)
            ids.push(memberId)
          }
        }
      }
    }
    return ids
  }, [selectedStaff])

  function updateRole(staffId: string, role: 'viewer' | 'editor') {
    setStaffRoles((prev) => ({ ...prev, [staffId]: role }))
  }

  /** Remove an individual from the selection, even if they came from a group entity. */
  function removeStaff(staffId: string) {
    const member = MOCK_STAFF.find((s) => s.id === staffId)
    if (!member) return
    const memberName = stripSalutation(member.name)
    setSelectedStaff((prev) =>
      prev.flatMap((entity) => {
        if (entity.type === 'individual' && entity.id === staffId) {
          return [] // drop this individual
        }
        if (entity.type === 'group') {
          const grp = MOCK_STAFF_GROUPS.find((g) => g.id === entity.id)
          if (grp?.memberIds.includes(staffId)) {
            // Exclude this member from the group entity
            return [
              {
                ...entity,
                excludedMemberNames: [
                  ...(entity.excludedMemberNames ?? []),
                  memberName,
                ],
              },
            ]
          }
        }
        return [entity]
      }),
    )
  }

  // Derive final sharedWith for saving
  const derivedSharedWith: Array<GroupSharedWith> = expandedStaffIds.flatMap(
    (staffId) => {
      const s = MOCK_STAFF.find((m) => m.id === staffId)
      if (!s) return []
      return [
        {
          staffId: s.id,
          name: s.name,
          email: s.email,
          role: staffRoles[s.id] ?? 'viewer',
        },
      ]
    },
  )

  // Detect whether any changes have been made vs the saved state
  const hasChanges = useMemo(() => {
    if (derivedSharedWith.length !== group.sharedWith.length) return true
    const origMap = new Map(group.sharedWith.map((sw) => [sw.staffId, sw.role]))
    return derivedSharedWith.some((sw) => origMap.get(sw.staffId) !== sw.role)
  }, [derivedSharedWith, group.sharedWith])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-md flex-col gap-0 p-0">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Share this group</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col">
          {/* Staff selector — only auto-opens dropdown when list is empty */}
          <div className="px-5 pt-4">
            <StaffSelector
              key={String(open)}
              value={selectedStaff}
              onChange={setSelectedStaff}
              hideChips
              autoOpen={expandedStaffIds.length === 0}
            />
          </div>

          {/* People with access — role management for each expanded individual */}
          <div className="max-h-72 overflow-y-auto px-5 pb-4 pt-4">
            {expandedStaffIds.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Users className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    No one added yet
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Search above to add staff
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  People with access
                </p>
                <div className="space-y-0.5">
                  {derivedSharedWith.map((sw) => {
                    const staffMeta = MOCK_STAFF.find(
                      (s) => s.id === sw.staffId,
                    )
                    const sublabel = [
                      staffMeta?.formClass && `Form ${staffMeta.formClass}`,
                      sw.email,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                    return (
                      <div
                        key={sw.staffId}
                        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/30"
                      >
                        <StaffAvatar name={sw.name} size={7} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {sw.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {sublabel}
                          </p>
                        </div>
                        <Select
                          value={sw.role}
                          onValueChange={(val) =>
                            updateRole(sw.staffId, val as 'viewer' | 'editor')
                          }
                        >
                          <SelectTrigger className="w-24 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                        <button
                          type="button"
                          onClick={() => removeStaff(sw.staffId)}
                          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="border-t px-5 py-4">
          {hasChanges && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
          <Button
            onClick={() => {
              if (hasChanges) onSave(group.visibility, derivedSharedWith)
              onOpenChange(false)
            }}
          >
            {hasChanges ? 'Save' : 'Done'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GroupDetailPage() {
  const { group: initialGroup } = Route.useLoaderData()
  const navigate = useNavigate()

  const [group, setGroup] = useState<StudentGroup>(initialGroup)
  const [shareOpen, setShareOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const [memberSearch, setMemberSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(group.name)

  const currentRole: 'owner' | 'editor' | 'viewer' =
    group.createdBy.email === CURRENT_USER_EMAIL
      ? 'owner'
      : group.sharedWith.find((s) => s.email === CURRENT_USER_EMAIL)?.role ===
          'editor'
        ? 'editor'
        : 'viewer'
  const canEdit = currentRole === 'owner' || currentRole === 'editor'

  useSetBreadcrumbs([
    { label: 'Student Groups', href: '/groups' },
    { label: group.name, href: `/groups/${group.id}` },
  ])

  const filteredMembers = useMemo(() => {
    if (!memberSearch) return group.members
    const q = memberSearch.toLowerCase()
    return group.members.filter((m) => m.name.toLowerCase().includes(q))
  }, [group.members, memberSearch])

  const totalPages = Math.ceil(filteredMembers.length / PAGE_SIZE)
  const pagedMembers = filteredMembers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  function handleRemoveMember(id: string) {
    setGroup((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== id),
      updatedAt: new Date().toISOString(),
    }))
  }

  function handleSaveSharing(
    visibility: 'private' | 'school',
    sharedWith: Array<GroupSharedWith>,
  ) {
    setGroup((prev) => ({
      ...prev,
      visibility,
      sharedWith,
      updatedAt: new Date().toISOString(),
    }))
  }

  function handleDelete() {
    const idx = MOCK_GROUPS.findIndex((g) => g.id === group.id)
    if (idx !== -1) MOCK_GROUPS.splice(idx, 1)
    navigate({ to: '/groups' })
  }

  function handleSaveName() {
    if (nameInput.trim()) {
      setGroup((prev) => ({
        ...prev,
        name: nameInput.trim(),
        updatedAt: new Date().toISOString(),
      }))
    }
    setEditingName(false)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-3"
          render={<Link to="/groups" />}
        >
          <ArrowLeft className="mr-1 size-4" />
          Student Groups
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="text-2xl font-semibold h-auto py-1 px-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName()
                      if (e.key === 'Escape') setEditingName(false)
                    }}
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSaveName}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingName(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-semibold truncate">
                    {group.name}
                  </h1>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setNameInput(group.name)
                        setEditingName(true)
                      }}
                    >
                      <Edit2 className="size-4" />
                    </Button>
                  )}
                </>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{group.members.length} students</Badge>
              <Badge
                variant="outline"
                className={cn(
                  group.visibility === 'school'
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600',
                )}
              >
                {group.visibility === 'school' ? 'School-wide' : 'Private'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="size-4" />
              Share
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link to="/groups/new" />}>
                  <Copy className="mr-2 size-4" />
                  Duplicate group
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const headers = ['#', 'Name', 'Class', 'NRIC']
                    const rows = group.members.map((m, i) => [
                      String(i + 1),
                      m.name,
                      m.class,
                      m.nric ?? '',
                    ])
                    const csv = [headers, ...rows]
                      .map((r) => r.map((c) => `"${c}"`).join(','))
                      .join('\n')
                    const blob = new Blob([csv], { type: 'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${group.name}.csv`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                >
                  <Download className="mr-2 size-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {group.description && (
        <p className="text-sm text-muted-foreground">{group.description}</p>
      )}

      <Separator />

      {/* Live group criteria banner */}
      {group.listType === 'live' && (
        <Alert className="border-blue-200 bg-blue-50/60 text-blue-900">
          <Info className="size-4 text-blue-500" />
          <AlertDescription className="text-blue-800">
            Membership updates automatically based on selected criteria.{' '}
            {group.criteriaSourceHref && (
              <Link
                to={group.criteriaSourceHref as '/students'}
                className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-blue-700"
              >
                Manage in source
                <ExternalLink className="size-3" />
              </Link>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Members section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Students{' '}
            <span className="text-muted-foreground font-normal">
              ({group.members.length})
            </span>
          </h2>
          <div className="flex items-center gap-2">
            {canEdit && group.listType !== 'live' && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                render={
                  <Link to="/groups/new" search={{ editGroupId: group.id }} />
                }
              >
                <UserPlus className="size-4" />
                Add students
              </Button>
            )}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={memberSearch}
                onChange={(e) => {
                  setMemberSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <EmptyState
            title="No students found"
            description="Try a different search term."
          />
        ) : (
          <>
            <div className="rounded-lg border overflow-hidden">
              <Table tableClassName="table-fixed w-full">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-24">Class</TableHead>
                    <TableHead className="w-36">NRIC</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedMembers.map((member, i) => (
                    <TableRow key={member.id} className="group/row">
                      <TableCell className="text-muted-foreground text-xs">
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          to="/students/$id"
                          params={{ id: member.id }}
                          className="hover:underline"
                        >
                          {member.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {member.class}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">
                        {member.nric ?? '—'}
                      </TableCell>
                      <TableCell>
                        {canEdit && group.listType !== 'live' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 opacity-0 group-hover/row:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                            onClick={() => {
                              if (currentRole === 'owner') {
                                handleRemoveMember(member.id)
                              } else {
                                setPendingRemoveId(member.id)
                              }
                            }}
                          >
                            <UserMinus className="size-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filteredMembers.length)} of{' '}
                  {filteredMembers.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="px-2 text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sharing dialog */}
      <SharingDialog
        group={group}
        open={shareOpen}
        onOpenChange={setShareOpen}
        onSave={handleSaveSharing}
      />

      {/* Editor remove confirmation */}
      <AlertDialog
        open={!!pendingRemoveId}
        onOpenChange={(open) => !open && setPendingRemoveId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from shared group?</AlertDialogTitle>
            <AlertDialogDescription>
              Removing{' '}
              <strong>
                {group.members.find((m) => m.id === pendingRemoveId)?.name}
              </strong>{' '}
              will affect {group.sharedWith.length} other collaborator
              {group.sharedWith.length !== 1 ? 's' : ''} with access to this
              group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingRemoveId) {
                  handleRemoveMember(pendingRemoveId)
                  setPendingRemoveId(null)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete group?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{group.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
