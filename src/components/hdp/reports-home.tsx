import * as React from 'react'
import { format } from 'date-fns'
import { useNavigate } from '@tanstack/react-router'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { formatDate } from '@/lib/format'
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
  React.useEffect(() => {
    seedIfEmpty()
    setMounted(true)
  }, [])

  // Requests moved to a second-level tab under Drafting (maintainer
  // direct-edit feedback) — old /reports?tab=requests links land there.
  const effectiveTab = tab === 'requests' ? 'drafting' : tab

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
            Add observation
          </Button>
        </div>
      </div>

      <Tabs
        value={effectiveTab}
        onValueChange={(value) => onTabChange(value as ReportsTab)}
        className="mt-4"
      >
        <div className="border-border border-b px-6 pb-4">
          <TabsList>
            <TabsTrigger value="students">My students</TabsTrigger>
            <TabsTrigger value="drafting">Drafting</TabsTrigger>
            <TabsTrigger value="send">Release</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="students">
          {mounted && <MyStudentsPanel onTabChange={onTabChange} />}
        </TabsContent>
        <TabsContent value="drafting">
          {mounted && (
            <DraftingPanel
              initialSubTab={tab === 'requests' ? 'requests' : undefined}
            />
          )}
        </TabsContent>
        <TabsContent value="send" className="px-6 py-6">
          {mounted && <ReleaseManager />}
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ── My students ─────────────────────────────────────────────────────── */

/** One row of a summary card's breakdown — value in a fixed tabular column
 *  so the labels align, clickable rows revealing their chevron on hover. */
function SummaryStat({
  value,
  label,
  onClick,
}: {
  value: number
  label: string
  onClick?: () => void
}) {
  const body = (
    <>
      <span className="w-6 shrink-0 text-right font-semibold tabular-nums">
        {value}
      </span>
      <span className="text-muted-foreground flex items-center gap-0.5">
        {label}
        {onClick && (
          <ChevronRight
            className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        )}
      </span>
    </>
  )
  if (!onClick) {
    return <div className="flex items-baseline gap-2.5 py-0.5">{body}</div>
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="group focus-visible:ring-ring/50 -mx-1.5 flex items-baseline gap-2.5 rounded-md px-1.5 py-0.5 text-left outline-none focus-visible:ring-[3px] hover:[&>span:last-child]:text-foreground"
    >
      {body}
    </button>
  )
}

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
          uses the product accent, never a traffic-light judgement colour).
          One joined card, divided: the two halves are stages of the same
          cycle, not separate widgets. */}
      <div className="px-6 py-6">
        <div className="border-border divide-border grid divide-y rounded-lg border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <section className="flex flex-col gap-4 p-5">
            <h2 className="text-sm font-medium">
              Reviewed this term
              <span className="text-muted-foreground font-normal">
                {' '}
                · {formClassId}
              </span>
            </h2>
            <div className="flex items-center gap-5">
              <AttendanceRing
                percentage={coveragePct}
                size={72}
                strokeWidth={6}
                color="var(--primary)"
                label={`${snapshot.covered}/${snapshot.total}`}
              />
              <div className="flex flex-col gap-1 text-sm">
                <SummaryStat value={snapshot.covered} label="Reviewed" />
                <SummaryStat
                  value={notReviewed}
                  label="Nothing noted yet"
                  onClick={() => onTabChange('drafting')}
                />
                {snapshot.reviewedNil > 0 && (
                  <SummaryStat
                    value={snapshot.reviewedNil}
                    label="Reviewed — nothing stood out"
                  />
                )}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4 p-5">
            <h2 className="text-sm font-medium">Sent to parents</h2>
            <div className="flex items-center gap-5">
              <AttendanceRing
                percentage={sentPct}
                size={72}
                strokeWidth={6}
                color="var(--primary)"
                label={`${shared}/${classSize}`}
              />
              <div className="flex flex-col gap-1 text-sm">
                <SummaryStat
                  value={confirmedOverall}
                  label={`Remarks confirmed (${myDrafts.length} drafts)`}
                  onClick={() => onTabChange('drafting')}
                />
                <SummaryStat
                  value={shared}
                  label="Shared with parents"
                  onClick={() => onTabChange('send')}
                />
                <SummaryStat value={acknowledged} label="Acknowledged" />
              </div>
            </div>
          </section>
        </div>
      </div>

      <Tabs defaultValue={classIds[0]}>
        <div className="px-6 pb-3">
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
            <TableHead className="w-[200px]">Latest observation</TableHead>
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
            const latest = visibleTags.reduce<string | undefined>(
              (acc, t) => (!acc || t.createdAt > acc ? t.createdAt : acc),
              undefined,
            )
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
                  {latest ? formatDate(latest) : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {visibleTags.length > 0 ? (
                    visibleTags.length
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
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

function DraftingPanel({ initialSubTab }: { initialSubTab?: 'requests' }) {
  const [drafts, setDrafts] = React.useState<Array<HdpDraft>>([])
  const [requestsCount, setRequestsCount] = React.useState(0)
  const [gapsOpen, setGapsOpen] = React.useState(false)
  const [subTab, setSubTab] = React.useState<string>(
    initialSubTab ?? CURRENT_TEACHER.formClassId,
  )

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

  // Gaps = form-class students with nothing noted yet this term.
  const gapsSnapshot = coverageForClass(CURRENT_TEACHER.formClassId)
  const gapCount = gapsSnapshot.total - gapsSnapshot.covered

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
      `Sent ${idsToSync.length} comment${idsToSync.length === 1 ? '' : 's'} to School Cockpit`,
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
      {gapCount > 0 && (
        <div className="bg-muted/40 border-border mx-6 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
          <p className="text-sm">
            <span className="font-medium tabular-nums">
              {gapCount} gap{gapCount === 1 ? '' : 's'} found
            </span>{' '}
            <span className="text-muted-foreground">
              — students in {CURRENT_TEACHER.formClassId} with nothing noted yet
              this term.
            </span>
          </p>
          <Button variant="outline" size="sm" onClick={() => setGapsOpen(true)}>
            Fill gaps
          </Button>
        </div>
      )}

      <div
        className={`flex flex-wrap items-center justify-between gap-3 px-6 ${gapCount > 0 ? '' : 'pt-6'}`}
      >
        <SyncStatus state={syncState} onSyncNow={handleSyncNow} />
        <Button variant="ghost" size="sm" onClick={handleDownloadIngestFile}>
          Download ingest file
        </Button>
      </div>

      <Tabs value={subTab} onValueChange={(v) => setSubTab(v as string)}>
        <div className="px-6 pb-3">
          <TabsList>
            {classIds.map((classId) => (
              <TabsTrigger key={classId} value={classId}>
                {classId}
              </TabsTrigger>
            ))}
            <TabsTrigger value="requests">
              {requestsCount > 0 ? `Requests (${requestsCount})` : 'Requests'}
            </TabsTrigger>
          </TabsList>
        </div>
        {classIds.map((classId) => (
          <TabsContent key={classId} value={classId}>
            <ClassWorklist classId={classId} />
          </TabsContent>
        ))}
        <TabsContent value="requests" className="px-6 py-4">
          <BroadcastRequestsPanel onCountChange={setRequestsCount} />
        </TabsContent>
      </Tabs>

      {/* Fill gaps lives in a dialog off the banner (maintainer direct-edit
          feedback) — the coverage diagnostic, ask-colleagues composer, and
          replies, unchanged inside. */}
      <Dialog open={gapsOpen} onOpenChange={setGapsOpen}>
        <DialogContent className="flex max-h-[85vh] w-full flex-col overflow-y-auto sm:w-[640px] sm:max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Fill gaps</DialogTitle>
          </DialogHeader>
          <CoverageBroadcastPanel />
        </DialogContent>
      </Dialog>
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
