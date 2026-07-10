import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'

import type { Term } from '@/types/report'
import type { SortConfig, SortDirection } from '@/types/student'
import type { CycleState, CycleStudentStatus } from '@/lib/hdp-cycle-store'
import type { SiblingReportState } from '@/data/mock-report-classes'
import type { ColumnConfig } from '@/components/students/column-visibility-popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ColumnHeaderMenu } from '@/components/students/column-header-menu'
import { hasAllResults } from '@/data/mock-cockpit-submissions'

// Light student-status table for the reporting-cycle hub. Deliberately not the
// 571-line report-row-shaped ReportTable (secondary still needs that unchanged) —
// this reads status from the cycle store only, never from seeded mock statuses
// (sibling-class rows are the one exception: display-only seeded states).

export type { CycleStudentStatus } from '@/lib/hdp-cycle-store'

/**
 * Derive a student's cycle status. With `pipeline` (P1-A only) the six-state
 * story runs: School Cockpit results gate the start, and school-leader review
 * sits between writing and sending.
 */
function statusFor(
  cycle: CycleState | null,
  studentId: string,
  pipeline = false,
): CycleStudentStatus {
  const draft = cycle?.perStudent[studentId]
  if (!pipeline) {
    if (!draft) return 'not_started'
    if (draft.sentAt) return 'sent'
    if (draft.ready) return 'ready'
    if (draft.comments || draft.parentMessage) return 'draft'
    return 'not_started'
  }
  if (draft?.sentAt) return 'sent'
  if (draft?.reviewStatus === 'approved') return 'approved'
  if (draft?.reviewStatus === 'in_review') return 'in_review'
  if (draft && (draft.comments || draft.parentMessage)) return 'draft'
  if (!hasAllResults(studentId)) return 'awaiting_results'
  return 'pending_comments'
}

const STATUS_LABEL: Record<CycleStudentStatus, string> = {
  not_started: 'Not started',
  draft: 'Draft',
  ready: 'Ready',
  sent: 'Sent to parents',
  awaiting_results: 'Awaiting results',
  pending_comments: 'Pending comments',
  in_review: 'Pending approval',
  approved: 'Approved',
}

// Badge palette follows the Posts/legacy tables: lime = done-positive
// (Approved, like Posted), amber = queued (Pending approval, like Scheduled),
// blue = delivered (Sent, like the legacy parent-status pill), muted = in
// progress, outlined = waiting on someone else.
const STATUS_CLASS: Record<CycleStudentStatus, string> = {
  not_started: '',
  draft: 'bg-muted text-muted-foreground hover:bg-muted',
  ready: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  sent: 'bg-twblue-3 text-twblue-11 hover:bg-twblue-3',
  awaiting_results: '',
  pending_comments: 'bg-muted text-muted-foreground hover:bg-muted',
  in_review: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  approved: 'bg-lime-3 text-lime-11 hover:bg-lime-3',
}

const OUTLINED_STATUSES = new Set<CycleStudentStatus>([
  'not_started',
  'awaiting_results',
])

// ── Checkpoint view (pipeline mode): one cell per stage of the flow ──

export interface StudentCheckpoints {
  results: 'in' | 'awaiting'
  comments: 'none' | 'draft' | 'done'
  approval: 'none' | 'pending' | 'approved'
  parents: 'none' | 'scheduled' | 'sent' | 'acknowledged'
}

/** Checkpoints for a pupil whose progress lives in the cycle store (P1-A). */
export function checkpointsFor(
  cycle: CycleState | null,
  studentId: string,
): StudentCheckpoints {
  const draft = cycle?.perStudent[studentId]
  // A submitted comment is no longer "draft" — it's part of the report under
  // (or past) review.
  const submitted =
    draft?.reviewStatus !== undefined || draft?.sentAt !== undefined
  return {
    results: hasAllResults(studentId) ? 'in' : 'awaiting',
    comments: submitted
      ? 'done'
      : draft && (draft.comments || draft.parentMessage)
        ? 'draft'
        : 'none',
    approval:
      draft?.reviewStatus === 'approved' || draft?.sentAt
        ? 'approved'
        : draft?.reviewStatus === 'in_review'
          ? 'pending'
          : 'none',
    parents: draft?.ackAt
      ? 'acknowledged'
      : draft?.sentAt
        ? 'sent'
        : draft?.scheduledSendAt
          ? 'scheduled'
          : 'none',
  }
}

/** Checkpoints for a sibling-class pupil, derived from a seeded status. */
export function checkpointsFromStatus(
  status: CycleStudentStatus,
  acknowledged = false,
): StudentCheckpoints {
  switch (status) {
    case 'awaiting_results':
      return {
        results: 'awaiting',
        comments: 'none',
        approval: 'none',
        parents: 'none',
      }
    case 'not_started':
    case 'pending_comments':
      return {
        results: 'in',
        comments: 'none',
        approval: 'none',
        parents: 'none',
      }
    case 'draft':
      return {
        results: 'in',
        comments: 'draft',
        approval: 'none',
        parents: 'none',
      }
    // Legacy 'ready' pre-dates the review pipeline — treat as submitted.
    case 'ready':
    case 'in_review':
      return {
        results: 'in',
        comments: 'done',
        approval: 'pending',
        parents: 'none',
      }
    case 'approved':
      return {
        results: 'in',
        comments: 'done',
        approval: 'approved',
        parents: 'none',
      }
    case 'sent':
      return {
        results: 'in',
        comments: 'done',
        approval: 'approved',
        parents: acknowledged ? 'acknowledged' : 'sent',
      }
  }
}

// Checkpoint-cell palette: lime = done-positive, amber = queued with someone,
// muted = in progress, blue = delivered; a quiet em-dash for not-yet.
const LIME = 'bg-lime-3 text-lime-11 hover:bg-lime-3'
const AMBER = 'bg-amber-100 text-amber-800 hover:bg-amber-100'
const MUTED = 'bg-muted text-muted-foreground hover:bg-muted'
const BLUE = 'bg-twblue-3 text-twblue-11 hover:bg-twblue-3'

// Rank of each checkpoint field's states, least → most progressed — powers
// the sortable headers (Student Insights table style) without changing the
// underlying StudentCheckpoints semantics.
const RESULTS_RANK: Record<StudentCheckpoints['results'], number> = {
  awaiting: 0,
  in: 1,
}
const COMMENTS_RANK: Record<StudentCheckpoints['comments'], number> = {
  none: 0,
  draft: 1,
  done: 2,
}
const APPROVAL_RANK: Record<StudentCheckpoints['approval'], number> = {
  none: 0,
  pending: 1,
  approved: 2,
}
const PARENTS_RANK: Record<StudentCheckpoints['parents'], number> = {
  none: 0,
  scheduled: 1,
  sent: 2,
  acknowledged: 3,
}

export type CheckpointSortField =
  | 'results'
  | 'comments'
  | 'approval'
  | 'parents'

export function checkpointRank(
  field: CheckpointSortField,
  cp: StudentCheckpoints,
): number {
  switch (field) {
    case 'results':
      return RESULTS_RANK[cp.results]
    case 'comments':
      return COMMENTS_RANK[cp.comments]
    case 'approval':
      return APPROVAL_RANK[cp.approval]
    case 'parents':
      return PARENTS_RANK[cp.parents]
  }
}

// Sortable-header column defs — reuses the Student Insights table's own
// ColumnHeaderMenu (`components/students/column-header-menu.tsx`) so this
// table's headers look and behave identically. No column here is filterable,
// so the popover shows only the sort options.
const NAME_COLUMN: ColumnConfig = {
  id: 'name',
  label: 'Name',
  visible: true,
  sortable: true,
}
const CLASS_COLUMN: ColumnConfig = {
  id: 'class',
  label: 'Class',
  visible: true,
  sortable: true,
}
// SC Results is deliberately not a displayed column — the School Cockpit
// gate still drives the Action button (see RowAction's resultsAwaiting),
// it's just no longer surfaced as its own status cell.
const COMMENTS_COLUMN: ColumnConfig = {
  id: 'comments',
  label: 'Comment Status',
  visible: true,
  sortable: true,
}
const APPROVAL_COLUMN: ColumnConfig = {
  id: 'approval',
  label: 'Review Status',
  visible: true,
  sortable: true,
}
const PARENTS_COLUMN: ColumnConfig = {
  id: 'parents',
  label: 'Parent Response',
  visible: true,
  sortable: true,
}
const EMPTY_FILTER_FIELDS = new Set<string>()

interface CheckpointRow {
  student: CycleTableStudent
  status: CycleStudentStatus
  cp: StudentCheckpoints
}

function compareRows(
  a: CheckpointRow,
  b: CheckpointRow,
  sort: SortConfig,
): number {
  let cmp: number
  if (sort.field === 'name') {
    cmp = a.student.name.localeCompare(b.student.name)
  } else if (sort.field === 'class') {
    cmp = a.student.class.localeCompare(b.student.class)
  } else {
    const field = sort.field as CheckpointSortField
    cmp = checkpointRank(field, a.cp) - checkpointRank(field, b.cp)
  }
  return sort.direction === 'asc' ? cmp : -cmp
}

function CheckpointCell({
  label,
  tone,
}: {
  label?: string
  tone?: 'lime' | 'amber' | 'muted' | 'blue' | 'outline'
}) {
  if (!label) {
    return (
      <TableCell>
        <span aria-hidden className="text-muted-foreground">
          —
        </span>
        <span className="sr-only">Not yet</span>
      </TableCell>
    )
  }
  const toneClass =
    tone === 'lime'
      ? LIME
      : tone === 'amber'
        ? AMBER
        : tone === 'blue'
          ? BLUE
          : tone === 'muted'
            ? MUTED
            : ''
  return (
    <TableCell>
      <Badge
        variant={tone === 'outline' ? 'outline' : 'default'}
        className={toneClass}
      >
        {label}
      </Badge>
    </TableCell>
  )
}

export function excerpt(html: string, max = 60): string {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max)}…` : text
}

/** Minimal row shape — full `Student` satisfies it, and so do seeded pupils. */
export interface CycleTableStudent {
  id: string
  name: string
  class: string
}

export interface CycleStudentTableProps {
  students: Array<CycleTableStudent>
  cycle: CycleState | null
  classId: string
  term: Term
  /** P1 pipeline view (results gate + leader review + parent ack). */
  pipeline?: boolean
  /** Level scope: show which class each pupil belongs to. */
  showClass?: boolean
  /** The signed-in teacher's form class; rows from other classes are view-only. */
  ownClassId?: string
  /** Seeded display states for sibling-class pupils (display-only rows). */
  seededStates?: Map<string, SiblingReportState>
  /** Per-row send (pipeline, approved rows). Omitting hides the send action. */
  onSendToParents?: (studentId: string) => void
}

function RowAction({
  student,
  status,
  resultsAwaiting,
  ownClass,
  term,
  onSendToParents,
}: {
  student: CycleTableStudent
  status: CycleStudentStatus
  /** School Cockpit gate — blocks writing even when a draft already exists. */
  resultsAwaiting: boolean
  ownClass: boolean
  term: Term
  onSendToParents?: (studentId: string) => void
}) {
  if (!ownClass) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        title="You're not this class's form teacher"
      >
        View only
      </Button>
    )
  }
  if (status === 'awaiting_results' || resultsAwaiting) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        title="Waiting on results from School Cockpit"
      >
        Enter comments
      </Button>
    )
  }
  if (status === 'in_review') {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        title="With school leaders for approval"
      >
        Awaiting approval
      </Button>
    )
  }
  if (status === 'approved' && onSendToParents) {
    return (
      <Button size="sm" onClick={() => onSendToParents(student.id)}>
        Send to parents
      </Button>
    )
  }
  const label =
    status === 'sent' || status === 'approved'
      ? 'View'
      : status === 'draft'
        ? 'Review & submit'
        : 'Enter comments'
  return (
    <Button
      variant="outline"
      size="sm"
      render={
        <Link
          to="/reports/cycle/write/$studentId"
          params={{ studentId: student.id }}
          search={{ classId: student.class, term }}
        />
      }
    >
      {label}
    </Button>
  )
}

export function CycleStudentTable({
  students,
  cycle,
  classId,
  term,
  pipeline = false,
  showClass = false,
  ownClassId,
  seededStates,
  onSendToParents,
}: CycleStudentTableProps) {
  const ownClass = ownClassId ?? classId
  const [sort, setSort] = useState<SortConfig | null>(null)

  const rows = useMemo(() => {
    const base: Array<CheckpointRow> = students.map((student) => {
      const seeded = seededStates?.get(student.id)
      const status = seeded?.status ?? statusFor(cycle, student.id, true)
      const cp = seeded
        ? checkpointsFromStatus(seeded.status, seeded.acknowledged)
        : checkpointsFor(cycle, student.id)
      return { student, status, cp }
    })
    if (!sort) return base
    return [...base].sort((a, b) => compareRows(a, b, sort))
  }, [students, cycle, seededStates, sort])

  if (pipeline) {
    const handleSort = (field: string, direction: SortDirection) =>
      setSort({ field, direction })
    const handleClearSort = () => setSort(null)
    const headerMenuProps = {
      currentSort: sort,
      activeFilterFields: EMPTY_FILTER_FIELDS,
      onSort: handleSort,
      onClearSort: handleClearSort,
      onAddQuickFilter: () => {},
      onClearFilter: () => {},
    }
    return (
      <div className="overflow-x-auto">
        <Table tableClassName="table-fixed w-full">
          <TableHeader className="border-b bg-background">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="sticky left-0 z-20 w-10 bg-background shadow-[inset_0_1px_0_var(--color-border),inset_0_-1px_0_var(--color-border)]">
                #
              </TableHead>
              <ColumnHeaderMenu
                column={NAME_COLUMN}
                {...headerMenuProps}
                isSticky
                stickyLeft="2.5rem"
                showStickyShadow
                className="w-[180px]"
              />
              {showClass && (
                <ColumnHeaderMenu
                  column={CLASS_COLUMN}
                  {...headerMenuProps}
                  className="w-20"
                />
              )}
              <ColumnHeaderMenu
                column={COMMENTS_COLUMN}
                {...headerMenuProps}
                className="w-[160px]"
              />
              <ColumnHeaderMenu
                column={APPROVAL_COLUMN}
                {...headerMenuProps}
                className="w-[150px]"
              />
              <ColumnHeaderMenu
                column={PARENTS_COLUMN}
                {...headerMenuProps}
                className="w-[160px]"
              />
              <TableHead className="w-[160px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ student, status, cp }, index) => (
              <TableRow key={student.id} className="group">
                <TableCell className="sticky left-0 z-10 w-10 bg-background text-muted-foreground shadow-[inset_0_-1px_0_var(--color-border)] transition-colors group-hover:bg-muted/50">
                  {index + 1}
                </TableCell>
                <TableCell
                  className="sticky z-10 w-[180px] bg-background font-medium shadow-[inset_0_-1px_0_var(--color-border),2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors group-hover:bg-muted/50"
                  style={{ left: '2.5rem' }}
                >
                  {student.name}
                </TableCell>
                {showClass && (
                  <TableCell className="text-muted-foreground">
                    {student.class}
                  </TableCell>
                )}
                {cp.comments === 'done' ? (
                  <CheckpointCell label="Submitted" tone="lime" />
                ) : cp.comments === 'draft' ? (
                  <CheckpointCell label="Draft" tone="muted" />
                ) : (
                  <CheckpointCell label="Pending" tone="outline" />
                )}
                {cp.approval === 'approved' ? (
                  <CheckpointCell label="Approved" tone="lime" />
                ) : cp.approval === 'pending' ? (
                  <CheckpointCell label="In review" tone="amber" />
                ) : (
                  <CheckpointCell label="Not sent" tone="outline" />
                )}
                {cp.parents === 'acknowledged' ? (
                  <CheckpointCell label="Acknowledged" tone="lime" />
                ) : cp.parents === 'sent' ? (
                  <CheckpointCell label="Sent" tone="blue" />
                ) : cp.parents === 'scheduled' ? (
                  <CheckpointCell label="Scheduled" tone="amber" />
                ) : (
                  <CheckpointCell label="Not sent" tone="outline" />
                )}
                <TableCell className="text-right">
                  <RowAction
                    student={student}
                    status={status}
                    resultsAwaiting={cp.results === 'awaiting'}
                    ownClass={student.class === ownClass}
                    term={term}
                    onSendToParents={onSendToParents}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table tableClassName="table-fixed w-full">
        <TableHeader className="border-b bg-background">
          <TableRow className="border-0 hover:bg-transparent">
            <TableHead>Student</TableHead>
            <TableHead className="w-[140px]">Status</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead className="w-[120px] text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            const status = statusFor(cycle, student.id, false)
            const draft = cycle?.perStudent[student.id]
            return (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      OUTLINED_STATUSES.has(status) ? 'outline' : 'default'
                    }
                    className={STATUS_CLASS[status]}
                  >
                    {STATUS_LABEL[status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {draft?.comments ? (
                    excerpt(draft.comments)
                  ) : (
                    <span className="italic">No comments yet</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <Link
                        to="/reports/cycle/write/$studentId"
                        params={{ studentId: student.id }}
                        search={{ classId, term }}
                      />
                    }
                  >
                    Write
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export { statusFor }
