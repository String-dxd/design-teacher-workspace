import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Link,
  createFileRoute,
  useNavigate,
  useSearch,
} from '@tanstack/react-router'
import { ArrowLeft, ChevronDown, ChevronRight, Search, X } from 'lucide-react'

import { toast } from 'sonner'
import type { StudentGroup } from '@/types/student-group'

import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { MOCK_GROUPS, getGroupById } from '@/data/mock-groups'
import {
  ALL_PICKER_STUDENTS,
  CCA_GROUPS,
  CLASS_GROUPS,
  LEVEL_GROUPS,
  TEACHING_GROUPS,
} from '@/data/mock-student-groups'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/groups/new')({
  component: GroupsNew,
  validateSearch: (search: Record<string, unknown>) => ({
    editGroupId:
      typeof search.editGroupId === 'string' ? search.editGroupId : undefined,
  }),
})

// ─── Types ────────────────────────────────────────────────────────────────────

type BrowseTab = 'class' | 'level' | 'cca' | 'teaching'

type PickerStudent = {
  id: string
  name: string
  class: string
  level: number
  nric: string
  indexNumber: number
}

type PickerGroup = {
  id: string
  label: string
  students: Array<PickerStudent>
}

// ─── Build student registry ───────────────────────────────────────────────────

const studentsByName = new Map(ALL_PICKER_STUDENTS.map((s) => [s.name, s]))

function parseClassLabel(label: string): [number, string] {
  const m = label.match(/^(\d+)\s+(.+)/)
  return m ? [Number(m[1]), m[2]] : [99, label]
}

// ─── Per-tab group lists ──────────────────────────────────────────────────────

const CLASS_TAB_GROUPS: Array<PickerGroup> = CLASS_GROUPS.map((g) => ({
  id: g.id,
  label: g.label,
  students: (g.memberDetails ?? [])
    .map((d) => studentsByName.get(d.name))
    .filter((s): s is PickerStudent => s !== undefined)
    .sort((a, b) => a.indexNumber - b.indexNumber),
})).sort((a, b) => {
  const [al, an] = parseClassLabel(a.label)
  const [bl, bn] = parseClassLabel(b.label)
  return al !== bl ? al - bl : an.localeCompare(bn)
})

const LEVEL_TAB_GROUPS: Array<PickerGroup> = LEVEL_GROUPS.map((g) => ({
  id: g.id,
  label: g.label,
  students: (g.memberNames ?? [])
    .map((name) => studentsByName.get(name))
    .filter((s): s is PickerStudent => s !== undefined),
}))

const CCA_TAB_GROUPS: Array<PickerGroup> = CCA_GROUPS.map((g) => ({
  id: g.id,
  label: g.label,
  students: (g.memberNames ?? [])
    .map((name) => studentsByName.get(name))
    .filter((s): s is PickerStudent => s !== undefined),
}))

const TEACHING_TAB_GROUPS: Array<PickerGroup> = TEACHING_GROUPS.map((g) => ({
  id: g.id,
  label: g.label,
  students: (g.memberDetails ?? [])
    .map((d) => studentsByName.get(d.name))
    .filter((s): s is PickerStudent => s !== undefined)
    .sort((a, b) => a.indexNumber - b.indexNumber),
}))

const BROWSE_TABS: Array<{ id: BrowseTab; label: string }> = [
  { id: 'class', label: 'Class' },
  { id: 'level', label: 'Level' },
  { id: 'cca', label: 'CCA' },
  { id: 'teaching', label: 'Teaching Group' },
]

// ─── Component ────────────────────────────────────────────────────────────────

function GroupsNew() {
  const { editGroupId } = useSearch({ from: '/groups/new' })
  const editGroup = editGroupId ? getGroupById(editGroupId) : undefined
  const isEditing = !!editGroup

  useSetBreadcrumbs([
    { label: 'Student Groups', href: '/groups' },
    { label: isEditing ? editGroup.name : 'New Group', href: '/groups/new' },
  ])

  const navigate = useNavigate()

  // Pre-select existing members when editing
  const initialIds = useMemo(() => {
    if (!editGroup) return new Set<string>()
    const nameToId = new Map(ALL_PICKER_STUDENTS.map((s) => [s.name, s.id]))
    return new Set(
      editGroup.members
        .map((m) => nameToId.get(m.name) ?? m.id)
        .filter(Boolean),
    )
  }, [editGroup])

  // Form state
  const [groupName, setGroupName] = useState(editGroup?.name ?? '')
  const [groupDescription, setGroupDescription] = useState(
    editGroup?.description ?? '',
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(initialIds)

  // Picker state
  const [activeTab, setActiveTab] = useState<BrowseTab>('class')
  const [search, setSearch] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Undo state
  const [undoIds, setUndoIds] = useState<Array<string>>([])
  const [showUndo, setShowUndo] = useState(false)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalSelected = selectedIds.size
  const canSave = groupName.trim().length > 0 && totalSelected > 0

  // Selected students sorted by class → index
  const selectedStudents = useMemo(
    () =>
      ALL_PICKER_STUDENTS.filter((s) => selectedIds.has(s.id)).sort(
        (a, b) =>
          a.class.localeCompare(b.class) || a.indexNumber - b.indexNumber,
      ),
    [selectedIds],
  )

  // Group selected students by class for the review panel
  const selectedByClass = useMemo(() => {
    const map = new Map<string, Array<PickerStudent>>()
    for (const s of selectedStudents) {
      if (!map.has(s.class)) map.set(s.class, [])
      map.get(s.class)!.push(s)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [selectedStudents])

  // Current tab groups
  const tabGroups = useMemo((): Array<PickerGroup> => {
    switch (activeTab) {
      case 'class':
        return CLASS_TAB_GROUPS
      case 'level':
        return LEVEL_TAB_GROUPS
      case 'cca':
        return CCA_TAB_GROUPS
      case 'teaching':
        return TEACHING_TAB_GROUPS
    }
  }, [activeTab])

  // Search filter — deduplicate students across groups so the same person
  // never appears more than once in results (relevant for Teaching / CCA tabs
  // where groups overlap heavily).
  const filteredGroups = useMemo((): Array<PickerGroup> => {
    if (!search.trim()) return tabGroups
    const q = search.toLowerCase()
    const seenIds = new Set<string>()
    return tabGroups
      .map((g) => ({
        ...g,
        students: g.students.filter((s) => {
          const matches =
            s.name.toLowerCase().includes(q) ||
            s.nric.toLowerCase().includes(q) ||
            s.class.toLowerCase().includes(q)
          if (!matches || seenIds.has(s.id)) return false
          seenIds.add(s.id)
          return true
        }),
      }))
      .filter((g) => g.students.length > 0)
  }, [tabGroups, search])

  // Auto-expand groups when searching
  const effectiveExpandedIds = useMemo(() => {
    if (search.trim()) return new Set(filteredGroups.map((g) => g.id))
    return expandedIds
  }, [search, filteredGroups, expandedIds])

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    }
  }, [])

  function triggerUndo(removedIds: Array<string>) {
    if (removedIds.length === 0) return
    setUndoIds(removedIds)
    setShowUndo(true)
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    undoTimerRef.current = setTimeout(() => {
      setShowUndo(false)
      setUndoIds([])
    }, 6000)
  }

  function handleUndo() {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      undoIds.forEach((id) => next.add(id))
      return next
    })
    setShowUndo(false)
    setUndoIds([])
  }

  function getGroupState(group: PickerGroup): 'all' | 'some' | 'none' {
    if (group.students.length === 0) return 'none'
    const n = group.students.filter((s) => selectedIds.has(s.id)).length
    if (n === 0) return 'none'
    return n === group.students.length ? 'all' : 'some'
  }

  function toggleGroup(group: PickerGroup) {
    const state = getGroupState(group)
    if (state === 'all') {
      const removed = group.students.map((s) => s.id)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        removed.forEach((id) => next.delete(id))
        return next
      })
      triggerUndo(removed)
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        group.students.forEach((s) => next.add(s.id))
        return next
      })
    }
  }

  function toggleStudent(id: string) {
    const wasSelected = selectedIds.has(id)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    if (wasSelected) triggerUndo([id])
  }

  function removeFromPanel(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    triggerUndo([id])
  }

  function toggleExpand(groupId: string) {
    if (search.trim()) return
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(groupId) ? next.delete(groupId) : next.add(groupId)
      return next
    })
  }

  function handleSave() {
    if (!canSave) return
    if (isEditing && editGroup) {
      // Update existing group in-place
      const idx = MOCK_GROUPS.findIndex((g) => g.id === editGroup.id)
      if (idx !== -1) {
        MOCK_GROUPS[idx] = {
          ...MOCK_GROUPS[idx],
          name: groupName.trim(),
          description: groupDescription.trim() || undefined,
          members: selectedStudents.map((s) => ({
            id: s.id,
            name: s.name,
            class: s.class,
            nric: s.nric,
            indexNumber: s.indexNumber,
          })),
          updatedAt: new Date().toISOString(),
        }
      }
      toast.success('Group updated')
      navigate({ to: '/groups/$groupId', params: { groupId: editGroup.id } })
    } else {
      const newGroup: StudentGroup = {
        id: `cg-${Date.now()}`,
        kind: 'regular',
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        members: selectedStudents.map((s) => ({
          id: s.id,
          name: s.name,
          class: s.class,
          nric: s.nric,
          indexNumber: s.indexNumber,
        })),
        staffInCharge: [],
        visibility: 'private',
        sharedWith: [],
        createdBy: { name: 'Mrs Tan Mei Lin', email: 'tanml@school.edu.sg' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      MOCK_GROUPS.push(newGroup)
      toast.success('Group created')
      navigate({ to: '/groups/$groupId', params: { groupId: newGroup.id } })
    }
  }

  const showClass =
    activeTab === 'level' || activeTab === 'cca' || activeTab === 'teaching'

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* ── Sticky header (mirrors announcements.new.tsx) ────────────────────── */}
      <div className="sticky top-0 z-10 bg-white">
        <div className="flex items-center gap-3 border-b px-6 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            render={<Link to="/groups" />}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="flex-1 text-base font-semibold">
            {isEditing ? editGroup.name : 'New Group'}
          </h1>
          <Button
            variant="ghost"
            size="sm"
            render={
              isEditing ? (
                <Link
                  to="/groups/$groupId"
                  params={{ groupId: editGroup.id }}
                />
              ) : (
                <Link to="/groups" />
              )
            }
          >
            Cancel
          </Button>
          <Button size="sm" disabled={!canSave} onClick={handleSave}>
            {isEditing ? 'Update Group' : 'Save Group'}
          </Button>
        </div>
      </div>

      {/* ── Body: two-column grid (mirrors announcements preview layout) ───────── */}
      <div className="mx-auto w-full px-6 py-8 max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          {/* ── Left: form sections ────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Group details */}
            <section className="rounded-xl border bg-white p-6">
              <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Group details
              </h2>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="group-name">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {groupName.length}/60
                    </span>
                  </div>
                  <Input
                    id="group-name"
                    placeholder="e.g. Drama Festival Cast"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value.slice(0, 60))}
                    maxLength={60}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="group-desc">
                      Description{' '}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {groupDescription.length}/200
                    </span>
                  </div>
                  <Textarea
                    id="group-desc"
                    placeholder="e.g. Students selected for the school Drama Festival 2025"
                    value={groupDescription}
                    onChange={(e) =>
                      setGroupDescription(e.target.value.slice(0, 200))
                    }
                    maxLength={200}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>
            </section>

            {/* Select members */}
            <section className="rounded-xl border bg-white overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Select students
                </h2>
              </div>

              {/* Search */}
              <div className="px-4 py-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, NRIC or class…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 text-sm w-full"
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b overflow-x-auto">
                {BROWSE_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id)
                      setSearch('')
                    }}
                    className={cn(
                      'shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                      activeTab === tab.id
                        ? 'border-foreground text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Group + student list */}
              <div className="max-h-[480px] overflow-y-auto divide-y">
                {filteredGroups.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No students match your search.
                  </p>
                ) : (
                  filteredGroups.map((group) => {
                    const state = getGroupState(group)
                    const isExpanded = effectiveExpandedIds.has(group.id)
                    const selectedInGroup = group.students.filter((s) =>
                      selectedIds.has(s.id),
                    ).length

                    return (
                      <div key={group.id}>
                        {/* Group row */}
                        <div
                          className={cn(
                            'flex items-center gap-3 px-4 py-2.5 transition-colors',
                            state !== 'none'
                              ? 'bg-blue-50/50'
                              : 'hover:bg-muted/30',
                          )}
                        >
                          <Checkbox
                            checked={state === 'all'}
                            indeterminate={state === 'some'}
                            onCheckedChange={() => toggleGroup(group)}
                          />
                          <button
                            type="button"
                            className="flex flex-1 items-center gap-2 text-left min-w-0"
                            onClick={() => toggleExpand(group.id)}
                          >
                            <span className="flex-1 text-sm font-medium truncate">
                              {group.label}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {state === 'some' ? (
                                <>
                                  <span className="text-blue-600 font-medium">
                                    {selectedInGroup}
                                  </span>
                                  /{group.students.length} students
                                </>
                              ) : (
                                <>
                                  {group.students.length}{' '}
                                  {group.students.length === 1
                                    ? 'student'
                                    : 'students'}
                                </>
                              )}
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                            )}
                          </button>
                        </div>

                        {/* Student rows */}
                        {isExpanded && (
                          <div className="border-b border-slate-100 bg-slate-50/60 px-4 pb-3 pt-2.5">
                            {/* Sub-header — mirrors entity-selector "N students" label */}
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {group.students.length}{' '}
                              {group.students.length === 1
                                ? 'student'
                                : 'students'}
                            </p>
                            <ol>
                              {group.students.map((student) => {
                                const isSelected = selectedIds.has(student.id)
                                return (
                                  <li key={student.id}>
                                    <label
                                      className={cn(
                                        'flex w-full cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs transition-colors',
                                        isSelected
                                          ? 'text-slate-700 hover:bg-blue-50'
                                          : 'text-slate-700 hover:bg-slate-100',
                                      )}
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() =>
                                          toggleStudent(student.id)
                                        }
                                      />
                                      {/* Index — running number within group */}
                                      <span className="w-6 shrink-0 text-right text-[10px] tabular-nums text-slate-400">
                                        #{student.indexNumber}
                                      </span>
                                      {/* Name + class pill for non-class tabs */}
                                      <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
                                        <span className="truncate">
                                          {student.name}
                                        </span>
                                        {showClass && (
                                          <span className="shrink-0 rounded bg-slate-200 px-1 py-px text-[9px] font-medium text-slate-500">
                                            {student.class}
                                          </span>
                                        )}
                                      </span>
                                      {/* NRIC — font-mono matching entity selector */}
                                      <span className="shrink-0 font-mono text-[10px] text-slate-400">
                                        {student.nric}
                                      </span>
                                    </label>
                                  </li>
                                )
                              })}
                            </ol>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </section>
          </div>

          {/* ── Right: selected students review panel ──────────────────────── */}
          <div className="sticky top-[57px] rounded-xl border bg-white overflow-hidden">
            {/* Panel header */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {totalSelected === 0
                    ? 'No students selected'
                    : `${totalSelected} selected`}
                </p>
                {totalSelected > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    across {selectedByClass.length} class
                    {selectedByClass.length !== 1 ? 'es' : ''}
                  </p>
                )}
              </div>
              {totalSelected > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const removed = [...selectedIds]
                    setSelectedIds(new Set())
                    triggerUndo(removed)
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Undo banner */}
            {showUndo && (
              <div className="px-4 py-2.5 bg-amber-50 border-b flex items-center justify-between gap-2">
                <span className="text-xs text-amber-800">
                  {undoIds.length === 1
                    ? '1 student removed'
                    : `${undoIds.length} students removed`}
                </span>
                <button
                  type="button"
                  onClick={handleUndo}
                  className="text-xs font-semibold text-amber-900 hover:underline"
                >
                  Undo
                </button>
              </div>
            )}

            {/* Student list */}
            <div className="max-h-[420px] overflow-y-auto">
              {totalSelected === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    Select students from the list on the left.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {selectedByClass.map(([cls, students]) => (
                    <div key={cls}>
                      <div className="px-4 py-2 bg-muted/30 flex items-center gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">
                          {cls}
                        </span>
                        <span className="text-xs text-muted-foreground/60">
                          · {students.length}
                        </span>
                      </div>
                      {students.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center gap-2 px-4 py-1.5 hover:bg-muted/20 group"
                        >
                          <span className="flex-1 text-sm truncate">
                            {s.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromPanel(s.id)}
                            className="shrink-0 size-5 rounded flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-all"
                            aria-label={`Remove ${s.name}`}
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save */}
            <div className="px-4 py-3 border-t">
              <Button
                className="w-full"
                disabled={!canSave}
                onClick={handleSave}
              >
                {isEditing ? 'Update Group' : 'Save Group'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
