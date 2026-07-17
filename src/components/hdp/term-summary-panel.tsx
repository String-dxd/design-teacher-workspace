import * as React from 'react'
import { Link } from '@tanstack/react-router'
import type { ClassSummary } from '@/lib/hdp-store'
import type { TagContext } from '@/types/hdp'
import { PatternCard } from '@/components/hdp/pattern-card'
import { useTagQueue } from '@/components/hdp/tag-queue-context'
import { getStudentById } from '@/data/mock-students'
import { MOCK_STAFF } from '@/data/mock-staff'
import { CURRENT_TEACHER } from '@/data/hdp'
import {
  confirmPattern,
  dismissPattern,
  seedIfEmpty,
  summaryForTeacher,
} from '@/lib/hdp-store'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'

const CONTEXT_LABELS: Record<TagContext, string> = {
  lesson: 'during lesson',
  marking: 'while marking',
  cca: 'CCA',
  'form-time': 'form time',
  other: 'other',
}

function staffName(id: string): string {
  return MOCK_STAFF.find((s) => s.id === id)?.name ?? 'Unknown teacher'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
  })
}

// Extracted from reports.summary.tsx (plan 035) — the "My students" hub's
// Summary tab. Moved wholesale: same store calls, same copy.
export function TermSummaryPanel() {
  const { openTagQueue } = useTagQueue()

  const [mounted, setMounted] = React.useState(false)
  const [classes, setClasses] = React.useState<Array<ClassSummary>>([])

  const refresh = React.useCallback(() => {
    seedIfEmpty()
    setClasses(summaryForTeacher(CURRENT_TEACHER.id))
  }, [])

  React.useEffect(() => {
    setMounted(true)
    refresh()
  }, [refresh])

  const totalTags = classes.reduce((sum, c) => sum + c.tagCount, 0)

  return (
    <div className="flex flex-col gap-8">
      <p className="text-muted-foreground text-sm">
        Term 3 · what you've noticed so far
      </p>

      {mounted && totalTags === 0 ? (
        <EmptyState
          title="Nothing tagged yet this term"
          description="Your Term Summary fills up as you tag moments worth remembering."
          action={
            <Button onClick={() => openTagQueue({ entryPoint: 'topbar' })}>
              Add observation
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-8 divide-y divide-border [&>*:not(:first-child)]:pt-8">
          {classes.map((classSummary) => (
            <ClassSection
              key={classSummary.classId}
              summary={classSummary}
              onPatternChange={refresh}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ClassSection({
  summary,
  onPatternChange,
}: {
  summary: ClassSummary
  onPatternChange: () => void
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{summary.classId}</h2>
        <p className="text-muted-foreground text-sm tabular-nums">
          {summary.tagCount} observation{summary.tagCount === 1 ? '' : 's'} this
          term · {summary.studentCount} student
          {summary.studentCount === 1 ? '' : 's'}
        </p>
      </div>

      {summary.mostNoted.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Worth revisiting</h3>
          <ul className="flex flex-col gap-2">
            {summary.mostNoted.map((entry) => {
              const student = getStudentById(entry.studentId)
              return (
                <li
                  key={entry.studentId}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <Link
                    to="/reports/students/$studentId"
                    params={{ studentId: entry.studentId }}
                    className="font-medium hover:underline"
                  >
                    {student?.name ?? 'Unknown student'}
                  </Link>
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    {entry.tagCount} tag{entry.tagCount === 1 ? '' : 's'}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {summary.recentQuotes.length > 0 && (
        <div className="flex flex-col gap-3">
          {summary.recentQuotes.map((quote) => {
            const student = getStudentById(quote.studentId)
            return (
              <blockquote
                key={quote.tagId}
                className="border-muted text-muted-foreground border-l-2 pl-3 text-sm"
              >
                “{quote.note}”
                <footer className="mt-1 text-xs">
                  — {staffName(quote.authorId)}, {student?.name ?? 'a student'}{' '}
                  · {CONTEXT_LABELS[quote.context]} ·{' '}
                  {formatDate(quote.createdAt)}
                </footer>
              </blockquote>
            )
          })}
        </div>
      )}

      {summary.candidatePatterns.length > 0 && (
        <div className="flex flex-col gap-2">
          {summary.candidatePatterns.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              onConfirm={() => {
                confirmPattern(pattern.id, CURRENT_TEACHER.id)
                onPatternChange()
              }}
              onDismiss={() => {
                dismissPattern(pattern.id)
                onPatternChange()
              }}
            />
          ))}
        </div>
      )}

      {summary.isFormClass && (summary.thinRecordCount ?? 0) > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            {summary.thinRecordCount} student
            {summary.thinRecordCount === 1 ? '' : 's'} with nothing noted yet
          </span>
          <Button
            variant="ghost"
            size="sm"
            render={<Link to="/reports" search={{ tab: 'drafting' }} />}
          >
            Ask colleagues
          </Button>
        </div>
      )}
    </section>
  )
}
