import * as React from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { mockStudents } from '@/data/mock-students'
import { CURRENT_TEACHER } from '@/data/hdp'
import {
  findDraft,
  loadReportBooks,
  tagsForStudentVisible,
} from '@/lib/hdp-store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface StudentSwitcherProps {
  currentStudentId: string
}

function statusLine(studentId: string): string {
  const evidenceCount = tagsForStudentVisible(
    studentId,
    CURRENT_TEACHER.id,
    true,
  ).length
  const draft = findDraft(studentId, 'overall')
  const draftLabel = draft
    ? draft.status === 'confirmed'
      ? 'Confirmed'
      : 'Drafting'
    : 'No draft'
  const marksSynced = Boolean(
    loadReportBooks().find((b) => b.studentId === studentId)?.marksSyncedAt,
  )
  return `${evidenceCount} evidence · ${draftLabel} · ${marksSynced ? 'Marks synced' : 'Marks not synced'}`
}

// The left rail of /reports/drafts/$studentId — the form-class roster, so
// switching students never loses autosaved work (each row is a plain
// <Link>; draft-studio.tsx reloads its per-student state from the store
// whenever `studentId` changes). Collapses to a top select below 1024px.
export function StudentSwitcher({ currentStudentId }: StudentSwitcherProps) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const navigate = useNavigate()

  const students = mockStudents.filter(
    (s) => s.class === CURRENT_TEACHER.formClassId,
  )

  return (
    <>
      <div className="lg:hidden">
        <Select
          value={currentStudentId}
          onValueChange={(value) => {
            if (!value) return
            void navigate({
              to: '/reports/drafts/$studentId',
              params: { studentId: value },
            })
          }}
        >
          <SelectTrigger aria-label="Student" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <nav
        aria-label="Form class students"
        className="hidden lg:block lg:w-64 lg:shrink-0"
      >
        <ol className="flex flex-col gap-1">
          {students.map((s) => {
            const isCurrent = s.id === currentStudentId
            return (
              <li key={s.id}>
                <Link
                  to="/reports/drafts/$studentId"
                  params={{ studentId: s.id }}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={cn(
                    'flex flex-col gap-0.5 rounded-md px-3 py-2 text-sm transition-colors',
                    isCurrent
                      ? 'bg-muted text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted/50',
                  )}
                >
                  <span>{s.name}</span>
                  {mounted && (
                    <span className="text-xs tabular-nums">
                      {statusLine(s.id)}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
