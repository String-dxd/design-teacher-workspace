import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { PenLine, Send, Users } from 'lucide-react'
import { CycleStages } from './cycle-stages'
import { CoverageBar } from './coverage-bar'
import { ToolCard } from './tool-card'
import type { CoverageSnapshot } from '@/types/hdp'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { CURRENT_CYCLE, CURRENT_TEACHER } from '@/data/hdp'
import {
  coverageForClass,
  loadDrafts,
  loadReportBooks,
  seedIfEmpty,
  summaryForTeacher,
} from '@/lib/hdp-store'

interface StudentsCardData {
  studentCount: number
  tagCount: number
  thinRecordCount: number
}

interface DraftsCardData {
  total: number
  confirmed: number
  unsynced: number
}

interface ReleaseCardData {
  shared: number
  acknowledged: number
}

function studentsDescription(data: StudentsCardData | null): string {
  if (!data) return 'Know your class, prep for PTM, fill gaps.'
  const parts = [
    `${data.studentCount} student${data.studentCount === 1 ? '' : 's'}`,
    `${data.tagCount} observation${data.tagCount === 1 ? '' : 's'}`,
  ]
  if (data.thinRecordCount > 0) {
    parts.push(`${data.thinRecordCount} with nothing noted yet`)
  }
  return parts.join(' · ')
}

function draftsDescription(data: DraftsCardData | null): string {
  if (!data) return 'Turn evidence into confirmed comments.'
  return [
    `${data.total} draft${data.total === 1 ? '' : 's'}`,
    `${data.confirmed} confirmed`,
    `${data.unsynced} not yet synced`,
  ].join(' · ')
}

function releaseDescription(data: ReleaseCardData | null): string {
  if (!data) return 'Share finished report books with parents.'
  return [`${data.shared} shared`, `${data.acknowledged} acknowledged`].join(
    ' · ',
  )
}

// The Reports home (plan 035) — three journey destinations replacing the
// former 8 tool cards: My students (roster/summary/gaps), Drafting (worklist
// + confirm queue), Send to parents (Release Manager as-is). Capture stays
// ambient — the FAB is the door; the Tag Queue page only gets a quiet text
// link here, near the coverage strip.
export function HdpReportsHome() {
  useSetBreadcrumbs([{ label: 'Reports', href: '/reports' }])

  const [snapshot, setSnapshot] = useState<CoverageSnapshot | null>(null)
  const [studentsCard, setStudentsCard] = useState<StudentsCardData | null>(
    null,
  )
  const [draftsCard, setDraftsCard] = useState<DraftsCardData | null>(null)
  const [releaseCard, setReleaseCard] = useState<ReleaseCardData | null>(null)

  // Render the coverage bar and live counts only after mount — a
  // deterministic SSR-safe initial render with no hydration mismatch
  // (repo's plan-018 rule: never read the store during render).
  useEffect(() => {
    seedIfEmpty()
    setSnapshot(coverageForClass(CURRENT_TEACHER.formClassId))

    const classSummaries = summaryForTeacher(CURRENT_TEACHER.id)
    const formClassSummary = classSummaries.find((c) => c.isFormClass)
    if (formClassSummary) {
      setStudentsCard({
        studentCount: formClassSummary.studentCount,
        tagCount: formClassSummary.tagCount,
        thinRecordCount: formClassSummary.thinRecordCount ?? 0,
      })
    }

    const myDrafts = loadDrafts().filter(
      (d) => d.authorId === CURRENT_TEACHER.id,
    )
    const confirmedDrafts = myDrafts.filter((d) => d.status === 'confirmed')
    const unsyncedDrafts = confirmedDrafts.filter((d) => !d.syncedAt)
    setDraftsCard({
      total: myDrafts.length,
      confirmed: confirmedDrafts.length,
      unsynced: unsyncedDrafts.length,
    })

    const books = loadReportBooks()
    setReleaseCard({
      shared: books.filter((b) => b.sharedAt).length,
      acknowledged: books.filter((b) => b.acknowledgement).length,
    })
  }, [])

  const windowOpens = format(new Date(CURRENT_CYCLE.windowOpensAt), 'd MMM')
  const releases = format(new Date(CURRENT_CYCLE.releaseAt), 'd MMM')

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-muted-foreground text-sm">
          Semester {CURRENT_CYCLE.semester}, {CURRENT_CYCLE.schoolYear} · Window{' '}
          {windowOpens} – {releases}
        </p>
        <CycleStages stage={CURRENT_CYCLE.stage} />
      </div>

      {/* Coverage renders only for the current teacher's own form class
          (P7 — no leadership or cross-class coverage view, ever). Capture
          stays ambient — the FAB is the door; this is a quiet text link. */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">My class</h2>
        {snapshot ? (
          <CoverageBar snapshot={snapshot} />
        ) : (
          <div className="bg-muted h-2 w-full rounded-full" aria-hidden />
        )}
        <Link
          to="/reports/tag"
          className="text-muted-foreground text-xs hover:underline"
        >
          Tag a student
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ToolCard
          icon={Users}
          name="My students"
          description={studentsDescription(studentsCard)}
          state="Always available"
          href="/reports/students"
          iconClassName="bg-twblue-3 text-twblue-11"
        />
        <ToolCard
          icon={PenLine}
          name="Drafting"
          description={draftsDescription(draftsCard)}
          state="Open — reporting window is open"
          href="/reports/drafts"
          iconClassName="bg-violet-3 text-violet-11"
        />
        <ToolCard
          icon={Send}
          name="Send to parents"
          description={releaseDescription(releaseCard)}
          state="Share report books"
          href="/reports/release"
          iconClassName="bg-lime-3 text-lime-11"
        />
      </div>
    </main>
  )
}
