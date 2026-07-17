import * as React from 'react'
import { format } from 'date-fns'
import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronRight, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { CycleStages } from './cycle-stages'
import { SyncStatus } from './sync-status'
import { CoverageBroadcastPanel } from './coverage-broadcast-panel'
import { BroadcastRequestsPanel } from './broadcast-requests-panel'
import { ReleaseManager } from './release-manager'
import { useTagQueue } from './tag-queue-context'
import type { SyncStatusState } from './sync-status'
import type { HdpDraft } from '@/types/hdp'
import { AttendanceRing } from '@/components/reports/attendance-ring'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getStudentById, mockStudents } from '@/data/mock-students'
import { CURRENT_CYCLE, CURRENT_TEACHER } from '@/data/hdp'
import { TIMETABLE } from '@/data/timetable'
import {
  coverageForClass,
  findDraft,
  loadBroadcasts,
  loadDrafts,
  loadReportBooks,
  markSynced,
  seedIfEmpty,
  tagsForStudent,
  tagsForStudentVisible,
  unsyncedConfirmedDrafts,
} from '@/lib/hdp-store'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'

export type ReportsTab = 'students' | 'drafting' | 'send' | 'requests'

const SYNC_LATENCY_MS = 1000

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface HdpReportsHomeProps {
  tab: ReportsTab
  onTabChange: (tab: ReportsTab) => void
}

// The Reports home — one flat page in the Posts pattern (maintainer
// feedback 2026-07-17): page header with the primary "Tag student" action
// (the FAB is gone), pill tabs for the main views, full-bleed tables.
// My students (default) leads with ring summary cards for status + gaps.
export function HdpReportsHome({ tab, onTabChange }: HdpReportsHomeProps) {
  useSetBreadcrumbs([{ label: 'Reports', href: '/reports' }])
  const { openTagQueue } = useTagQueue()

  const [mounted, setMounted] = React.useState(false)
  const [requestsCount, setRequestsCount] = React.useState(0)
  React.useEffect(() => {
    seedIfEmpty()
    setMounted(true)
  }, [])

  const windowOpens = format(new Date(CURRENT_CYCLE.windowOpensAt), 'd MMM')
  const releases = format(new Date(CURRENT_CYCLE.releaseAt), 'd MMM')

  return (
    <div className="flex flex-col">
      <div className="shrink-0 pt-6">
        <div className="flex items-start justify-between gap-4 px-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold">Reports</h1>
              <CycleStages stage={CURRENT_CYCLE.stage} />
            </div>
            <p className="text-muted-foreground text-sm">
              Turn everyday observations into report books for parents. Semester{' '}
              {CURRENT_CYCLE.semester}, {CURRENT_CYCLE.schoolYear} · Window{' '}
              {windowOpens} – {releases}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => openTagQueue({ entryPoint: 'topbar' })}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Tag student
          </Button>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => onTabChange(value as ReportsTab)}
        className="mt-4"
      >
        <div className="border-border border-b px-6 pb-4">
          <TabsList>
            <TabsTrigger value="students">My students</TabsTrigger>
            <TabsTrigger value="drafting">Drafting</TabsTrigger>
            <TabsTrigger value="send">Send to parents</TabsTrigger>
            <TabsTrigger value="requests">
              {requestsCount > 0 ? `Requests (${requestsCount})` : 'Requests'}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="students">
          {mounted && <MyStudentsPanel onTabChange={onTabChange} />}
        </TabsContent>
        <TabsContent value="drafting">
          {mounted && <DraftingPanel />}
        </TabsContent>
        <TabsContent value="send" className="px-6 py-6">
          {mounted && <ReleaseManager />}
        </TabsContent>
        <TabsContent value="requests" className="px-6 py-6">
          {mounted && (
            <BroadcastRequestsPanel onCountChange={setRequestsCount} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ── My students ─────────────────────────────────────────────────────── */

function MyStudentsPanel({
  onTabChange,
}: {
  onTabChange: (tab: ReportsTab) => void
}) {
  const fullRiver = useFeatureFlag('reports-river-visibility')
  const formClassId = CURRENT_TEACHER.formClassId
  const classIds = [formClassId, ...CURRENT_TEACHER.teachingClasses]

  const snapshot = coverageForClass(formClassId)
  const books = loadReportBooks()
  const myDrafts = loadDrafts().filter((d) => d.authorId === CURRENT_TEACHER.id)
  const confirmedOverall = mockStudents.filter(
    (s) =>
      s.class === formClassId &&
      findDraft(s.id, 'overall')?.status === 'confirmed',
  ).length
  const classSize = mockStudents.filter((s) => s.class === formClassId).length
  const shared = books.filter((b) => b.sharedAt).length
  const acknowledged = books.filter((b) => b.acknowledgement).length
  const notReviewed = snapshot.total - snapshot.covered
  const coveragePct =
    snapshot.total > 0 ? (snapshot.covered / snapshot.total) * 100 : 0
  const sentPct = classSize > 0 ? (shared / classSize) * 100 : 0

  return (
    <div className="flex flex-col">
      {/* Status + gaps at a glance — rings are progress, rows are the
          diagnostic breakdown (P7: coverage stays a diagnostic, so the ring
          uses the product accent, never a traffic-light judgement colour). */}
      <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
        <section className="border-border flex flex-col gap-4 rounded-lg border p-5">
          <h2 className="text-sm font-medium">
            Reviewed this term — {formClassId}
          </h2>
          <div className="flex items-center gap-6">
            <AttendanceRing
              percentage={coveragePct}
              size={96}
              strokeWidth={8}
              color="var(--primary)"
              label={`${snapshot.covered}/${snapshot.total}`}
            />
            <dl className="flex flex-col gap-1.5 text-sm">
              <div className="flex items-baseline gap-2">
                <dt className="font-semibold tabular-nums">
                  {snapshot.covered}
                </dt>
                <dd className="text-muted-foreground">Reviewed</dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="font-semibold tabular-nums">{notReviewed}</dt>
                <dd className="text-muted-foreground">
                  <Link
                    to="/reports"
                    search={{ tab: 'students' }}
                    hash="gaps"
                    className="hover:text-foreground inline-flex items-center gap-0.5 hover:underline"
                  >
                    Nothing noted yet
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </dd>
              </div>
              {snapshot.reviewedNil > 0 && (
                <div className="flex items-baseline gap-2">
                  <dt className="font-semibold tabular-nums">
                    {snapshot.reviewedNil}
                  </dt>
                  <dd className="text-muted-foreground">
                    Reviewed — nothing stood out
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        <section className="border-border flex flex-col gap-4 rounded-lg border p-5">
          <h2 className="text-sm font-medium">Sent to parents</h2>
          <div className="flex items-center gap-6">
            <AttendanceRing
              percentage={sentPct}
              size={96}
              strokeWidth={8}
              color="var(--primary)"
              label={`${shared}/${classSize}`}
            />
            <dl className="flex flex-col gap-1.5 text-sm">
              <div className="flex items-baseline gap-2">
                <dt className="font-semibold tabular-nums">
                  {confirmedOverall}
                </dt>
                <dd className="text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => onTabChange('drafting')}
                    className="hover:text-foreground inline-flex items-center gap-0.5 hover:underline"
                  >
                    Remarks confirmed ({myDrafts.length} drafts)
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="font-semibold tabular-nums">{shared}</dt>
                <dd className="text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => onTabChange('send')}
                    className="hover:text-foreground inline-flex items-center gap-0.5 hover:underline"
                  >
                    Shared with parents
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="font-semibold tabular-nums">{acknowledged}</dt>
                <dd className="text-muted-foreground">Acknowledged</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      <Tabs defaultValue={classIds[0]}>
        <div className="px-6">
          <TabsList>
            {classIds.map((classId) => (
              <TabsTrigger key={classId} value={classId}>
                {classId}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {classIds.map((classId) => (
          <TabsContent key={classId} value={classId}>
            <ClassRoster classId={classId} fullRiver={fullRiver} />
          </TabsContent>
        ))}
      </Tabs>

      <section id="gaps" className="border-border mt-8 border-t px-6 py-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Fill gaps</h2>
          <CoverageBroadcastPanel />
        </div>
      </section>
    </div>
  )
}

function ClassRoster({
  classId,
  fullRiver,
}: {
  classId: string
  fullRiver: boolean
}) {
  const navigate = useNavigate()
  const students = mockStudents.filter((s) => s.class === classId)
  const broadcasts = loadBroadcasts()

  return (
    <div className="bg-background max-w-full overflow-x-auto">
      <Table tableClassName="w-full">
        <TableHeader className="bg-background border-b">
          <TableRow className="border-0 hover:bg-transparent">
            <TableHead className="pl-6">Name</TableHead>
            <TableHead className="w-[120px]">Class</TableHead>
            <TableHead className="w-[160px] text-right">
              Tags this term
            </TableHead>
            <TableHead className="w-[56px] pr-6" />
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
              <TableRow
                key={student.id}
                className="cursor-pointer"
                onClick={() =>
                  navigate({
                    to: '/reports/students/$studentId',
                    params: { studentId: student.id },
                  })
                }
              >
                <TableCell className="pl-6">
                  <span className="font-medium">{student.name}</span>
                  {nilOnly && (
                    <p className="text-muted-foreground text-xs">
                      Reviewed — nothing noted
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {student.class}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {visibleTags.length}
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <ChevronRight
                    className="text-muted-foreground ml-auto h-4 w-4"
                    aria-hidden
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

/* ── Drafting ────────────────────────────────────────────────────────── */

/** The kind this teacher drafts for a given class: the overall remark for
 *  their own form class, a subject comment for classes they teach
 *  academically (the subject comes from the timetable). */
function draftKindForClass(classId: string): {
  kind: 'subject' | 'overall'
  subject?: string
} {
  if (classId === CURRENT_TEACHER.formClassId) return { kind: 'overall' }
  const subject = TIMETABLE.find(
    (t) => t.teacherId === CURRENT_TEACHER.id && t.classId === classId,
  )?.subject
  return { kind: 'subject', subject }
}

function StatusCell({ status }: { status: 'none' | 'draft' | 'confirmed' }) {
  if (status === 'confirmed') {
    return (
      <Badge className="bg-lime-3 text-lime-11 hover:bg-lime-3">
        Confirmed
      </Badge>
    )
  }
  if (status === 'draft') {
    return (
      <Badge className="bg-muted text-muted-foreground hover:bg-muted">
        Draft
      </Badge>
    )
  }
  return <span className="text-muted-foreground text-sm">—</span>
}

function DraftingPanel() {
  const [drafts, setDrafts] = React.useState<Array<HdpDraft>>([])

  const refresh = React.useCallback(() => {
    setDrafts(
      loadDrafts().filter(
        (d) => d.authorId === CURRENT_TEACHER.id && d.status === 'confirmed',
      ),
    )
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const classIds = [
    CURRENT_TEACHER.formClassId,
    ...CURRENT_TEACHER.teachingClasses,
  ]

  const unsynced = drafts.filter((d) => !d.syncedAt)
  const synced = drafts.filter((d) => d.syncedAt)

  let syncState: SyncStatusState
  if (drafts.length === 0) {
    syncState = { kind: 'none' }
  } else if (unsynced.length > 0) {
    syncState = { kind: 'stale', unsyncedCount: unsynced.length }
  } else {
    const mostRecentSyncedAt = synced.reduce<string>((latest, d) => {
      return d.syncedAt && d.syncedAt > latest ? d.syncedAt : latest
    }, synced[0]?.syncedAt ?? new Date().toISOString())
    const studentCount = new Set(synced.map((d) => d.studentId)).size
    syncState = {
      kind: 'synced',
      at: mostRecentSyncedAt,
      studentCount,
    }
  }

  async function handleSyncNow() {
    const idsToSync = unsyncedConfirmedDrafts()
      .filter((d) => d.authorId === CURRENT_TEACHER.id)
      .map((d) => d.id)
    await new Promise((resolve) => setTimeout(resolve, SYNC_LATENCY_MS))
    markSynced(idsToSync)
    refresh()
    toast.success(
      `Synced ${idsToSync.length} change${idsToSync.length === 1 ? '' : 's'}`,
    )
  }

  function handleDownloadIngestFile() {
    const confirmedDrafts = loadDrafts().filter(
      (d) => d.authorId === CURRENT_TEACHER.id && d.status === 'confirmed',
    )
    const payload = {
      generatedAt: new Date().toISOString(),
      schoolYear: '2026',
      drafts: confirmedDrafts.map((d) => ({
        studentId: d.studentId,
        studentName: getStudentById(d.studentId)?.name,
        kind: d.kind,
        subject: d.subject,
        claims: d.claims,
        confirmedAt: d.confirmedAt,
      })),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    link.href = url
    link.download = `hdp-ingest-${date}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6">
        <SyncStatus state={syncState} onSyncNow={handleSyncNow} />
        <Button variant="ghost" size="sm" onClick={handleDownloadIngestFile}>
          Download ingest file
        </Button>
      </div>

      <Tabs defaultValue={classIds[0]}>
        <div className="px-6">
          <TabsList>
            {classIds.map((classId) => (
              <TabsTrigger key={classId} value={classId}>
                {classId}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {classIds.map((classId) => (
          <TabsContent key={classId} value={classId}>
            <ClassWorklist classId={classId} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function ClassWorklist({ classId }: { classId: string }) {
  const navigate = useNavigate()
  const students = mockStudents.filter((s) => s.class === classId)
  const { kind, subject } = draftKindForClass(classId)

  return (
    <div className="bg-background max-w-full overflow-x-auto">
      <Table tableClassName="w-full">
        <TableHeader className="bg-background border-b">
          <TableRow className="border-0 hover:bg-transparent">
            <TableHead className="pl-6">Name</TableHead>
            <TableHead className="w-[180px] text-right">
              Evidence this cycle
            </TableHead>
            <TableHead className="w-[140px]">Status</TableHead>
            <TableHead className="w-[140px]">Confirmed</TableHead>
            <TableHead className="w-[56px] pr-6" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            const evidenceCount =
              kind === 'overall'
                ? tagsForStudentVisible(student.id, CURRENT_TEACHER.id, true)
                    .length
                : tagsForStudent(student.id).filter(
                    (t) =>
                      t.authorId === CURRENT_TEACHER.id &&
                      t.lifecycle === 'active',
                  ).length
            const draft = findDraft(student.id, kind, subject)
            const status = draft ? draft.status : 'none'

            return (
              <TableRow
                key={student.id}
                className="cursor-pointer"
                onClick={() =>
                  navigate({
                    to: '/reports/drafts/$studentId',
                    params: { studentId: student.id },
                  })
                }
              >
                <TableCell className="pl-6 font-medium">
                  {student.name}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {evidenceCount}
                </TableCell>
                <TableCell>
                  <StatusCell status={status} />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {draft?.confirmedAt ? formatDate(draft.confirmedAt) : '—'}
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <ChevronRight
                    className="text-muted-foreground ml-auto h-4 w-4"
                    aria-hidden
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
