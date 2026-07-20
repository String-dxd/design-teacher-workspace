import * as React from 'react'
import { TrendLine } from './trend-line'
import type { AssessmentKind, TrendDirection } from '@/types/hdp'
import { CURRENT_CYCLE } from '@/data/hdp'
import {
  loadMarks,
  loadReportBooks,
  saveMarkEntry,
  seedIfEmpty,
} from '@/lib/hdp-store'
import { trendForSubject } from '@/lib/hdp-trends'
import { formatDate } from '@/lib/format'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const ASSESSMENTS: Array<{ key: AssessmentKind; label: string }> = [
  { key: 'wa1', label: 'WA1' },
  { key: 'wa2', label: 'WA2' },
  { key: 'exam', label: 'Exam' },
]

const DIRECTION_WORDS: Record<TrendDirection, string> = {
  climbing: 'Climbing',
  steady: 'Steady',
  recovering: 'Recovering',
  easing: 'Easing',
}

interface MarksGridProps {
  studentId: string
  studentName: string
}

// The Marks section of /reports/drafts/$studentId — read-only reference.
// Marks are entered and owned by School Cockpit; this tool only pulls them
// (walkthrough decision 2026-07-17: scores appear pre-filled and
// uneditable — comments go back to Cockpit, markings never do). On mount
// any cells the fixture hasn't keyed are back-filled with the same
// deterministic dummy scores the old sync action used, so the grid always
// demos as "already pulled".
export function MarksGrid({ studentId, studentName }: MarksGridProps) {
  const [mounted, setMounted] = React.useState(false)
  const [entries, setEntries] = React.useState(() => loadMarks(studentId))
  const [pulledAt, setPulledAt] = React.useState<string | undefined>(undefined)

  React.useEffect(() => {
    seedIfEmpty()
    // Read-only surface: back-fill any cells the fixture didn't key so the
    // grid always demos as "already pulled", but never write to the report
    // book here. The parent Results table derives from the seeded grades, so
    // syncing on mount only rewrote a book the teacher was merely viewing
    // (and left ReportStory showing a numeric grade beside a letter one).
    fillEmptyMarks(studentId)
    setEntries(loadMarks(studentId))
    setPulledAt(
      loadReportBooks().find((b) => b.studentId === studentId)?.marksSyncedAt,
    )
    setMounted(true)
  }, [studentId])

  const subjects = React.useMemo(
    () => Array.from(new Set(entries.map((e) => e.subject))),
    [entries],
  )

  function valueFor(subject: string, assessment: AssessmentKind): string {
    const entry = entries.find(
      (e) =>
        e.subject === subject &&
        e.schoolYear === CURRENT_CYCLE.schoolYear &&
        e.semester === CURRENT_CYCLE.semester &&
        e.assessment === assessment,
    )
    return entry ? String(entry.score) : '—'
  }

  if (!mounted) {
    return <div aria-hidden className="h-24" />
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium">Marks</h2>
        <p className="text-muted-foreground text-xs tabular-nums">
          From School Cockpit
          {pulledAt ? ` · Updated ${formatDate(pulledAt)}` : ''}
        </p>
      </div>

      <div className="border-border min-w-0 max-w-full overflow-x-auto rounded-lg border">
        <Table>
          <TableCaption className="sr-only">
            Marks for {studentName}, semester {CURRENT_CYCLE.semester},{' '}
            {CURRENT_CYCLE.schoolYear} — read-only, pulled from School Cockpit
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              {ASSESSMENTS.map((a) => (
                <TableHead key={a.key} className="text-right">
                  {a.label}
                </TableHead>
              ))}
              <TableHead className="sr-only">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((subject) => {
              const { direction, points } = trendForSubject(entries, subject)
              return (
                <TableRow key={subject}>
                  <TableCell className="font-medium">{subject}</TableCell>
                  {ASSESSMENTS.map((a) => (
                    <TableCell key={a.key} className="text-right tabular-nums">
                      {valueFor(subject, a.key)}
                    </TableCell>
                  ))}
                  <TableCell>
                    {points.length >= 2 && (
                      <div className="flex items-center gap-2">
                        <TrendLine points={points} />
                        <span className="text-sm font-medium whitespace-nowrap">
                          {DIRECTION_WORDS[direction]}
                        </span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <p className="text-muted-foreground text-xs">
        Marks are entered in School Cockpit and pulled here for reference — they
        can't be edited in this tool.
      </p>
    </section>
  )
}

/** Demo helper: the "official record" always has every assessment, so any
 *  cell the fixture hasn't keyed comes back filled — plausible dummy scores
 *  derived from the subject's WA1 (deterministic, so repeat loads agree). */
function fillEmptyMarks(studentId: string) {
  const current = loadMarks(studentId)
  const allSubjects = Array.from(new Set(current.map((e) => e.subject)))
  for (const subject of allSubjects) {
    const wa1 = current.find(
      (e) =>
        e.subject === subject &&
        e.schoolYear === CURRENT_CYCLE.schoolYear &&
        e.semester === CURRENT_CYCLE.semester &&
        e.assessment === 'wa1',
    )
    const base = wa1?.score ?? 60
    const drift = (subject.length * 3 + studentId.length) % 7
    const dummy: Record<AssessmentKind, number> = {
      wa1: base,
      wa2: Math.min(95, Math.max(35, base + drift - 2)),
      exam: Math.min(95, Math.max(35, base + 4 - (drift % 5))),
    }
    for (const a of ASSESSMENTS) {
      const exists = current.some(
        (e) =>
          e.subject === subject &&
          e.schoolYear === CURRENT_CYCLE.schoolYear &&
          e.semester === CURRENT_CYCLE.semester &&
          e.assessment === a.key,
      )
      if (!exists) {
        saveMarkEntry(studentId, {
          subject,
          schoolYear: CURRENT_CYCLE.schoolYear,
          semester: CURRENT_CYCLE.semester,
          assessment: a.key,
          score: dummy[a.key],
        })
      }
    }
  }
}
