import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  BookOpen,
  CircleCheck,
  Eye,
  Megaphone,
  PenLine,
  Send,
  Tag,
  Users,
} from 'lucide-react'
import { CycleStages } from './cycle-stages'
import { CoverageBar } from './coverage-bar'
import { ToolCard } from './tool-card'
import type { CoverageSnapshot } from '@/types/hdp'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { CURRENT_CYCLE, CURRENT_TEACHER } from '@/data/hdp'
import { coverageForClass, seedIfEmpty } from '@/lib/hdp-store'

// Routes for every tool below (/reports/tag, /reports/summary,
// /reports/students/$studentId, /reports/broadcast, /reports/drafts,
// /reports/review) don't exist yet — plans 029–033 build them one at a
// time. To keep this plan self-contained and the home honest (no dead
// links), every card renders locked with "Coming in this prototype" until
// its own plan flips it to a live Link; Release Manager and Renderings
// Preview are out of scope for this prototype entirely and stay "Coming
// later".
const TOOL_GROUPS: Array<{
  heading: string
  tools: Array<{
    icon: typeof Tag
    name: string
    description: string
    state: string
  }>
}> = [
  {
    heading: 'Capture',
    tools: [
      {
        icon: Tag,
        name: 'Tag Queue',
        description: 'Every tag you and colleagues have made, searchable.',
        state: 'Coming in this prototype', // plan 029
      },
      {
        icon: BookOpen,
        name: 'Term Summary',
        description: "Each student's tags for the term, grouped and read-only.",
        state: 'Coming in this prototype', // plan 030
      },
      {
        icon: Users,
        name: 'Students',
        description: 'Every student in your classes, with their river.',
        state: 'Coming in this prototype', // plan 030
      },
      {
        icon: Megaphone,
        name: 'Coverage & Broadcast',
        description: 'See who has thin records and ask colleagues to help.',
        state: 'Coming in this prototype', // plan 031
      },
    ],
  },
  {
    heading: 'Draft',
    tools: [
      {
        icon: PenLine,
        name: 'Draft Studio',
        description: 'Turn tags into evidence-grounded report comments.',
        state: 'Coming in this prototype', // plan 032
      },
      {
        icon: CircleCheck,
        name: 'Review & Sync',
        description: 'Confirm drafts and sync them into the report book.',
        state: 'Coming in this prototype', // plan 032
      },
    ],
  },
  {
    heading: 'Release',
    tools: [
      {
        icon: Send,
        name: 'Release Manager',
        description: 'Share finished report books with parents.',
        state: 'Coming later',
      },
      {
        icon: Eye,
        name: 'Renderings Preview',
        description: 'Preview how a report book looks to a parent.',
        state: 'Coming later',
      },
    ],
  },
]

export function HdpReportsHome() {
  useSetBreadcrumbs([{ label: 'Reports', href: '/reports' }])

  const [snapshot, setSnapshot] = useState<CoverageSnapshot | null>(null)

  // Render the coverage bar only after mount — a deterministic SSR-safe
  // initial render with no hydration mismatch (repo's plan-018 rule: never
  // read the store during render).
  useEffect(() => {
    seedIfEmpty()
    setSnapshot(coverageForClass(CURRENT_TEACHER.formClassId))
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
          (P7 — no leadership or cross-class coverage view, ever). */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">My class</h2>
        {snapshot ? (
          <CoverageBar snapshot={snapshot} />
        ) : (
          <div className="bg-muted h-2 w-full rounded-full" aria-hidden />
        )}
        {/* /reports/broadcast doesn't exist yet (plan 031) — kept as
            non-navigating text rather than a dead link. */}
        <span className="text-muted-foreground text-xs">
          Review gaps — coming with Coverage & Broadcast
        </span>
      </div>

      <div className="flex flex-col gap-8">
        {TOOL_GROUPS.map((group) => (
          <section key={group.heading} className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">{group.heading}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.tools.map((tool) => (
                <ToolCard
                  key={tool.name}
                  icon={tool.icon}
                  name={tool.name}
                  description={tool.description}
                  state={tool.state}
                  locked
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
