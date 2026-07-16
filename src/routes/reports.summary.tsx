import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
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
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { EmptyState } from '@/components/empty-state'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/reports/summary')({
  component: SummaryPage,
})

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

function SummaryPage() {
  const enabled = useFeatureFlag('reports-hdp')
  const { openTagQueue } = useTagQueue()

  useSetBreadcrumbs([
    { label: 'Reports', href: '/reports' },
    { label: 'Term Summary', href: '/reports/summary' },
  ])

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

  if (!enabled) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Reports is off</h1>
        <p className="text-muted-foreground text-sm">
          Turn on “HDP Reports module” to use this page.
        </p>
        <Link
          to="/flags"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Open feature flags
        </Link>
      </main>
    )
  }

  const totalTags = classes.reduce((sum, c) => sum + c.tagCount, 0)

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Term Summary</h1>
        <p className="text-muted-foreground text-sm">
          Term 3 · what you've noticed so far
        </p>
      </div>

      {mounted && totalTags === 0 ? (
        <EmptyState
          title="Nothing tagged yet this term"
          description="Your Term Summary fills up as you tag moments worth remembering."
          action={
            <Button onClick={() => openTagQueue({ entryPoint: 'topbar' })}>
              Tag a student
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
    </main>
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
          {/* /reports/broadcast doesn't exist yet (plan 031) — kept as a
              non-navigating, honestly-labelled action rather than a dead
              link, same convention as reports-home.tsx / student-river.tsx. */}
          <Button
            variant="ghost"
            size="sm"
            disabled
            title="Coming with Coverage & Broadcast"
          >
            Ask colleagues
          </Button>
        </div>
      )}
    </section>
  )
}
