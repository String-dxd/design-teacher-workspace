import { Link } from '@tanstack/react-router'

import type { Term } from '@/types/report'
import type { CycleState } from '@/lib/hdp-cycle-store'
import type { Student } from '@/types/student'
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
import { hasAllResults } from '@/data/mock-cockpit-submissions'

// Light student-status table for the reporting-cycle hub. Deliberately not the
// 571-line report-row-shaped ReportTable (secondary still needs that unchanged) —
// this reads status from the cycle store only, never from seeded mock statuses.

export type CycleStudentStatus =
  // Legacy 4-state story (all classes except P1-A)
  | 'not_started'
  | 'draft'
  | 'ready'
  | 'sent'
  // P1-A pipeline states
  | 'awaiting_results'
  | 'pending_comments'
  | 'in_review'
  | 'approved'

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

function excerpt(html: string, max = 60): string {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export interface CycleStudentTableProps {
  students: Array<Student>
  cycle: CycleState | null
  classId: string
  term: Term
  /** P1-A only: six-state pipeline (results gate + leader review). */
  pipeline?: boolean
}

export function CycleStudentTable({
  students,
  cycle,
  classId,
  term,
  pipeline = false,
}: CycleStudentTableProps) {
  return (
    <Table>
      <TableHeader className="border-b bg-background">
        <TableRow className="border-0 hover:bg-transparent">
          <TableHead>Student</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Comments</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => {
          const status = statusFor(cycle, student.id, pipeline)
          const draft = cycle?.perStudent[student.id]
          return (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.name}</TableCell>
              <TableCell>
                <Badge
                  variant={OUTLINED_STATUSES.has(status) ? 'outline' : 'default'}
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
                {status === 'awaiting_results' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    title="Waiting on results from School Cockpit"
                  >
                    Write
                  </Button>
                ) : (
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
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export { statusFor }
