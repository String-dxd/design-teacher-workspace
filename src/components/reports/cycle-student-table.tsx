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

// Light student-status table for the reporting-cycle hub. Deliberately not the
// 571-line report-row-shaped ReportTable (secondary still needs that unchanged) —
// this reads status from the cycle store only, never from seeded mock statuses.

export type CycleStudentStatus = 'not_started' | 'draft' | 'ready' | 'sent'

function statusFor(
  cycle: CycleState | null,
  studentId: string,
): CycleStudentStatus {
  const draft = cycle?.perStudent[studentId]
  if (!draft) return 'not_started'
  if (draft.sentAt) return 'sent'
  if (draft.ready) return 'ready'
  if (draft.comments || draft.parentMessage) return 'draft'
  return 'not_started'
}

const STATUS_LABEL: Record<CycleStudentStatus, string> = {
  not_started: 'Not started',
  draft: 'Draft',
  ready: 'Ready',
  sent: 'Sent',
}

// Badge palette follows the Posts table: Sent = lime (like Posted),
// Ready = amber (like Scheduled), Draft = muted, Not started = outlined.
const STATUS_CLASS: Record<CycleStudentStatus, string> = {
  not_started: '',
  draft: 'bg-muted text-muted-foreground hover:bg-muted',
  ready: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  sent: 'bg-lime-3 text-lime-11 hover:bg-lime-3',
}

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
}

export function CycleStudentTable({
  students,
  cycle,
  classId,
  term,
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
          const status = statusFor(cycle, student.id)
          const draft = cycle?.perStudent[student.id]
          return (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.name}</TableCell>
              <TableCell>
                <Badge
                  variant={status === 'not_started' ? 'outline' : 'default'}
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
  )
}

export { statusFor }
