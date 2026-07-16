import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { SyncStatusState } from '@/components/hdp/sync-status'
import type { HdpDraft } from '@/types/hdp'
import { SyncStatus } from '@/components/hdp/sync-status'
import { EmptyState } from '@/components/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getStudentById, mockStudents } from '@/data/mock-students'
import { CURRENT_TEACHER } from '@/data/hdp'
import { TIMETABLE } from '@/data/timetable'
import {
  findDraft,
  loadDrafts,
  markSynced,
  seedIfEmpty,
  tagsForStudent,
  tagsForStudentVisible,
  unsyncedConfirmedDrafts,
} from '@/lib/hdp-store'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'

export const Route = createFileRoute('/reports/drafts/')({
  component: DraftsIndexPage,
})

const SYNC_LATENCY_MS = 1000

function kindLabel(draft: HdpDraft): string {
  return draft.kind === 'overall'
    ? 'Overall remark'
    : `Subject — ${draft.subject}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// The Drafting hub (plan 035) — Draft Studio's worklist plus the former
// Review & Sync page's confirm queue (sync status strip, confirmed-drafts
// table, ingest download), moved here above the worklist. Both sections'
// store calls and copy are unchanged from their originating pages.
function DraftsIndexPage() {
  const enabled = useFeatureFlag('reports-hdp')

  useSetBreadcrumbs([
    { label: 'Reports', href: '/reports' },
    { label: 'Draft Studio', href: '/reports/drafts' },
  ])

  const [mounted, setMounted] = React.useState(false)
  const [drafts, setDrafts] = React.useState<Array<HdpDraft>>([])

  const refresh = React.useCallback(() => {
    seedIfEmpty()
    setDrafts(
      loadDrafts().filter(
        (d) => d.authorId === CURRENT_TEACHER.id && d.status === 'confirmed',
      ),
    )
  }, [])

  React.useEffect(() => {
    seedIfEmpty()
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

  // Form class first, as neighbouring classes — same order as /reports/students.
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
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Draft Studio</h1>
        <p className="text-muted-foreground text-sm">
          Turn tags into evidence-grounded report comments.
        </p>
      </div>

      {mounted && <SyncStatus state={syncState} onSyncNow={handleSyncNow} />}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Confirmed drafts</h2>
        {mounted && drafts.length === 0 ? (
          <EmptyState
            title="Nothing to review yet"
            description="Confirmed drafts appear here before they go into report books."
          />
        ) : (
          mounted && (
            <div className="border-border min-w-0 max-w-full overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead className="text-right">Sentences</TableHead>
                    <TableHead>Confirmed</TableHead>
                    <TableHead className="sr-only">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drafts.map((draft) => (
                    <TableRow key={draft.id}>
                      <TableCell className="font-medium">
                        {getStudentById(draft.studentId)?.name ??
                          draft.studentId}
                      </TableCell>
                      <TableCell>{kindLabel(draft)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {draft.claims.length}
                      </TableCell>
                      <TableCell>
                        {draft.confirmedAt
                          ? formatDate(draft.confirmedAt)
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to="/reports/drafts/$studentId"
                          params={{ studentId: draft.studentId }}
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        )}
      </div>

      <div className="border-border border-t pt-4">
        <Button variant="ghost" size="sm" onClick={handleDownloadIngestFile}>
          Download ingest file
        </Button>
      </div>

      {mounted && (
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
              <ClassWorklist classId={classId} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </main>
  )
}

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

function statusLabel(status: 'none' | 'draft' | 'confirmed'): string {
  if (status === 'confirmed') return 'Confirmed'
  if (status === 'draft') return 'Draft'
  return 'None'
}

function ClassWorklist({ classId }: { classId: string }) {
  const students = mockStudents.filter((s) => s.class === classId)
  const { kind, subject } = draftKindForClass(classId)

  return (
    <div className="border-border min-w-0 max-w-full overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Evidence this cycle</TableHead>
            <TableHead>Draft status</TableHead>
            <TableHead className="sr-only">Action</TableHead>
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
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {evidenceCount}
                </TableCell>
                <TableCell>{statusLabel(status)}</TableCell>
                <TableCell className="text-right">
                  <Link
                    to="/reports/drafts/$studentId"
                    params={{ studentId: student.id }}
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    Draft
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
