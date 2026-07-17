import * as React from 'react'
import { toast } from 'sonner'
import { TrendLine } from './trend-line'
import type { AssessmentKind, TrendDirection } from '@/types/hdp'
import { CURRENT_CYCLE } from '@/data/hdp'
import {
  loadMarks,
  loadReportBooks,
  saveMarkEntry,
  seedIfEmpty,
  syncAcademicResults,
} from '@/lib/hdp-store'
import { trendForSubject } from '@/lib/hdp-trends'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface MarksGridProps {
  studentId: string
  studentName: string
}

// The Marks section of /reports/drafts/$studentId — one editable row per
// subject (WA1/WA2/Exam this semester), an inline trend sparkline + word per
// row, and a "Sync academic results" action that snapshots the current
// semester's averages into the student's report book (hdp-store's
// syncAcademicResults). This is Prototype A tooling — not flag-gated (only
// the report book's rendering of the resulting trends/Change column is,
// behind reports-hdp-future).
export function MarksGrid({ studentId, studentName }: MarksGridProps) {
  const [mounted, setMounted] = React.useState(false)
  const [entries, setEntries] = React.useState(() => loadMarks(studentId))
  const [saveState, setSaveState] = React.useState<'idle' | 'saved'>('idle')
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [syncedAt, setSyncedAt] = React.useState<string | undefined>(undefined)
  // The per-cell inputs are uncontrolled (defaultValue) — bump this key to
  // remount the table after a sync fills empty cells, so they show up.
  const [gridKey, setGridKey] = React.useState(0)

  const refresh = React.useCallback(() => {
    setEntries(loadMarks(studentId))
    setSyncedAt(
      loadReportBooks().find((b) => b.studentId === studentId)?.marksSyncedAt,
    )
  }, [studentId])

  React.useEffect(() => {
    seedIfEmpty()
    setMounted(true)
    refresh()
  }, [refresh])

  const hasBook = mounted
    ? loadReportBooks().some((b) => b.studentId === studentId)
    : false

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
    return entry ? String(entry.score) : ''
  }

  function handleBlur(
    subject: string,
    assessment: AssessmentKind,
    raw: string,
  ) {
    const trimmed = raw.trim()
    if (trimmed.length === 0) return
    const score = Number(trimmed)
    if (!Number.isFinite(score)) return
    saveMarkEntry(studentId, {
      subject,
      schoolYear: CURRENT_CYCLE.schoolYear,
      semester: CURRENT_CYCLE.semester,
      assessment,
      score,
    })
    setEntries(loadMarks(studentId))
    setSaveState('saved')
  }

  /** Demo helper: syncing pulls the "official" record, so any assessment the
   *  teacher hasn't keyed yet comes back filled — plausible dummy scores
   *  derived from the subject's WA1 (deterministic, so repeat syncs and
   *  reloads agree). */
  function fillEmptyMarks() {
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
      // Small per-subject offset from the name so subjects don't all move
      // in lockstep.
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

  function handleSyncConfirm() {
    fillEmptyMarks()
    syncAcademicResults(studentId)
    setConfirmOpen(false)
    setGridKey((k) => k + 1)
    refresh()
    toast.success(`Synced ${studentName}'s academic results`)
  }

  if (!mounted) {
    return <div aria-hidden className="h-24" />
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Marks</h2>
        <span aria-live="polite" className="text-muted-foreground text-xs">
          {saveState === 'saved' ? 'Saved' : ''}
        </span>
      </div>

      <div
        key={gridKey}
        className="border-border min-w-0 max-w-full overflow-x-auto rounded-lg border"
      >
        <Table>
          <TableCaption className="sr-only">
            Marks entry for {studentName}, semester {CURRENT_CYCLE.semester},{' '}
            {CURRENT_CYCLE.schoolYear}
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
                  {ASSESSMENTS.map((a) => {
                    const inputId = `mark-${studentId}-${subject}-${a.key}`
                    return (
                      <TableCell key={a.key} className="text-right">
                        <Label htmlFor={inputId} className="sr-only">
                          {subject} {a.label}
                        </Label>
                        <Input
                          id={inputId}
                          inputMode="numeric"
                          defaultValue={valueFor(subject, a.key)}
                          onChange={() => setSaveState('idle')}
                          onBlur={(e) =>
                            handleBlur(subject, a.key, e.target.value)
                          }
                          className="h-8 w-16 text-right tabular-nums"
                        />
                      </TableCell>
                    )
                  })}
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

      <div className="flex flex-col items-start gap-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!hasBook}
          title={hasBook ? undefined : 'No report book yet for this student'}
          onClick={() => setConfirmOpen(true)}
        >
          Sync academic results
        </Button>
        {syncedAt && (
          <p className="text-muted-foreground text-xs tabular-nums">
            Synced {formatDate(syncedAt)}
          </p>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sync academic results?</AlertDialogTitle>
            <AlertDialogDescription>
              This writes {studentName}'s current marks into their report book.
              Comments are synced separately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSyncConfirm}>
              Sync
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
