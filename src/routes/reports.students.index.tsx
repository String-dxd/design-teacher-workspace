import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { mockStudents } from '@/data/mock-students'
import { CURRENT_TEACHER } from '@/data/hdp'
import {
  loadBroadcasts,
  seedIfEmpty,
  tagsForStudentVisible,
} from '@/lib/hdp-store'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { TermSummaryPanel } from '@/components/hdp/term-summary-panel'
import { CoverageBroadcastPanel } from '@/components/hdp/coverage-broadcast-panel'
import { BroadcastRequestsPanel } from '@/components/hdp/broadcast-requests-panel'

type StudentsTab = 'roster' | 'summary' | 'gaps' | 'requests'

interface StudentsSearch {
  tab: StudentsTab
}

export const Route = createFileRoute('/reports/students/')({
  component: StudentsIndexPage,
  validateSearch: (search: Record<string, unknown>): StudentsSearch => ({
    tab:
      search.tab === 'summary' ||
      search.tab === 'gaps' ||
      search.tab === 'requests'
        ? search.tab
        : 'roster',
  }),
})

// The "My students" hub (plan 035) — consolidates the former Students,
// Term Summary, and Coverage & Broadcast pages into tabs on one destination.
// Roster stays exactly as it was (unchanged); Summary and Gaps are the
// former pages' content, moved into presentational panels; Requests is the
// broadcast page's former responder-facing region (Region 4), split out on
// its own tab per maintainer feedback 2026-07-16.
function StudentsIndexPage() {
  const enabled = useFeatureFlag('reports-hdp')
  const fullRiver = useFeatureFlag('reports-river-visibility')
  const { tab } = Route.useSearch()
  const navigate = Route.useNavigate()

  useSetBreadcrumbs([
    { label: 'Reports', href: '/reports' },
    { label: 'My students', href: '/reports/students' },
  ])

  const [mounted, setMounted] = React.useState(false)
  const [requestsCount, setRequestsCount] = React.useState(0)
  React.useEffect(() => {
    seedIfEmpty()
    setMounted(true)
  }, [])

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

  // Form class first, as neighbouring classes.
  const classIds = [
    CURRENT_TEACHER.formClassId,
    ...CURRENT_TEACHER.teachingClasses,
  ]

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">My students</h1>
        <p className="text-muted-foreground text-sm">
          Know your class, prep for PTM, fill gaps.
        </p>
      </div>

      {mounted && (
        <Tabs
          value={tab}
          onValueChange={(value) =>
            navigate({
              search: (prev) => ({ ...prev, tab: value as StudentsTab }),
            })
          }
        >
          <TabsList>
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="gaps">Gaps</TabsTrigger>
            <TabsTrigger value="requests">
              {requestsCount > 0 ? `Requests (${requestsCount})` : 'Requests'}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="roster">
            <Tabs defaultValue={classIds[0]}>
              <TabsList>
                {classIds.map((classId) => (
                  <TabsTrigger key={classId} value={classId}>
                    {classId}
                  </TabsTrigger>
                ))}
              </TabsList>
              {classIds.map((classId) => (
                <TabsContent key={classId} value={classId}>
                  <ClassRoster classId={classId} fullRiver={fullRiver} />
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
          <TabsContent value="summary">
            <TermSummaryPanel />
          </TabsContent>
          <TabsContent value="gaps">
            <CoverageBroadcastPanel />
          </TabsContent>
          <TabsContent value="requests">
            <BroadcastRequestsPanel onCountChange={setRequestsCount} />
          </TabsContent>
        </Tabs>
      )}
    </main>
  )
}

function ClassRoster({
  classId,
  fullRiver,
}: {
  classId: string
  fullRiver: boolean
}) {
  const students = mockStudents.filter((s) => s.class === classId)
  const broadcasts = loadBroadcasts()

  return (
    <div className="border-border min-w-0 max-w-full overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Class</TableHead>
            <TableHead className="text-right">Tags this term</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            const visibleTags = tagsForStudentVisible(
              student.id,
              CURRENT_TEACHER.id,
              fullRiver,
            )
            const hasNil = broadcasts.some((b) =>
              b.responses.some(
                (r) =>
                  r.studentId === student.id &&
                  r.result.kind === 'nothing-stood-out',
              ),
            )
            const nilOnly = visibleTags.length === 0 && hasNil
            return (
              <TableRow key={student.id}>
                <TableCell>
                  <Link
                    to="/reports/students/$studentId"
                    params={{ studentId: student.id }}
                    className="font-medium hover:underline"
                  >
                    {student.name}
                  </Link>
                  {nilOnly && (
                    <p className="text-muted-foreground text-xs">
                      Reviewed — nothing noted
                    </p>
                  )}
                </TableCell>
                <TableCell>{student.class}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {visibleTags.length}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
