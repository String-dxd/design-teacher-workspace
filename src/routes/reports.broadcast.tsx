import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import type { CanBroadcastResult } from '@/lib/hdp-store'
import type { BroadcastRequest, DispositionId, HdpTag } from '@/types/hdp'
import { BroadcastComposer } from '@/components/hdp/broadcast-composer'
import { BroadcastResponderCard } from '@/components/hdp/broadcast-responder-card'
import { CoverageBar } from '@/components/hdp/coverage-bar'
import { DispositionChip } from '@/components/hdp/disposition-chip'
import {
  canBroadcast,
  coverageForClass,
  loadBroadcasts,
  loadTags,
  nilsForStudent,
  respondToBroadcast,
  seedIfEmpty,
  tagsForStudent,
} from '@/lib/hdp-store'
import { getStudentById, mockStudents } from '@/data/mock-students'
import { MOCK_STAFF } from '@/data/mock-staff'
import { CURRENT_CYCLE, CURRENT_TEACHER } from '@/data/hdp'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/reports/broadcast')({
  component: BroadcastPage,
})

function staffName(id: string): string {
  return MOCK_STAFF.find((s) => s.id === id)?.name ?? 'Unknown teacher'
}

/** Reviewed = ≥1 active tag this cycle OR an explicit nil this term — the
 *  same rule coverageForClass uses, applied per-student so the diagnostic
 *  table can list exactly which students are NOT reviewed. */
function isReviewed(studentId: string): boolean {
  const hasActiveTag = tagsForStudent(studentId).some(
    (t) =>
      t.lifecycle === 'active' &&
      t.schoolYear === CURRENT_CYCLE.schoolYear &&
      CURRENT_CYCLE.terms.includes(t.term),
  )
  return hasActiveTag || nilsForStudent(studentId).length > 0
}

interface PendingRequest {
  broadcast: BroadcastRequest
  studentId: string
}

function BroadcastPage() {
  const enabled = useFeatureFlag('reports-hdp')

  useSetBreadcrumbs([
    { label: 'Reports', href: '/reports' },
    { label: 'Coverage & Broadcast', href: '/reports/broadcast' },
  ])

  const [mounted, setMounted] = React.useState(false)
  const [selectedIds, setSelectedIds] = React.useState<Array<string>>([])
  const [blocked, setBlocked] = React.useState<CanBroadcastResult>({
    ok: true,
  })
  const [lastBroadcastCreatedAt, setLastBroadcastCreatedAt] = React.useState<
    string | undefined
  >(undefined)
  const [replyBroadcast, setReplyBroadcast] =
    React.useState<BroadcastRequest | null>(null)
  const [pendingForYou, setPendingForYou] = React.useState<
    Array<PendingRequest>
  >([])
  const [tags, setTags] = React.useState<Array<HdpTag>>([])

  const formClassId = CURRENT_TEACHER.formClassId

  const refresh = React.useCallback(() => {
    seedIfEmpty()
    setBlocked(canBroadcast(formClassId))
    setTags(loadTags())

    const forClass = loadBroadcasts().filter(
      (b) => b.formClassId === formClassId,
    )
    const latest =
      forClass.length > 0
        ? forClass.reduce((a, b) =>
            new Date(b.createdAt) > new Date(a.createdAt) ? b : a,
          )
        : undefined
    setLastBroadcastCreatedAt(latest?.createdAt)
    setReplyBroadcast(latest ?? null)

    // Every (broadcast, student) pair where CURRENT_TEACHER is a recipient,
    // for any broadcast that still has at least one unanswered pair for her.
    // Rows the row itself already answered stay in the list and render
    // collapsed ("Responded (…)") rather than disappearing — the broadcast
    // only drops out of "Requests for you" once she's answered every pair.
    const requests: Array<PendingRequest> = []
    for (const broadcast of loadBroadcasts()) {
      if (!broadcast.recipientIds.includes(CURRENT_TEACHER.id)) continue
      const hasOpenPair = broadcast.studentIds.some(
        (studentId) =>
          !broadcast.responses.some(
            (r) =>
              r.recipientId === CURRENT_TEACHER.id && r.studentId === studentId,
          ),
      )
      if (!hasOpenPair) continue
      for (const studentId of broadcast.studentIds) {
        requests.push({ broadcast, studentId })
      }
    }
    setPendingForYou(requests)
  }, [formClassId])

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

  const thinRecordStudents = mockStudents.filter(
    (s) => s.class === formClassId && !isReviewed(s.id),
  )
  const allSelected =
    thinRecordStudents.length > 0 &&
    thinRecordStudents.every((s) => selectedIds.includes(s.id))
  const someSelected = selectedIds.length > 0 && !allSelected

  function toggleStudent(studentId: string) {
    setSelectedIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    )
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? [] : thinRecordStudents.map((s) => s.id))
  }

  const snapshot = mounted ? coverageForClass(formClassId) : null
  const openRepliesCount = pendingForYou.filter(
    ({ broadcast, studentId }) =>
      !broadcast.responses.some(
        (r) =>
          r.recipientId === CURRENT_TEACHER.id && r.studentId === studentId,
      ),
  ).length

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Coverage & Broadcast</h1>
        <p className="text-muted-foreground text-sm">
          See who has thin records in {formClassId} and ask colleagues to help.
        </p>
        {mounted && openRepliesCount > 0 && (
          <p className="text-sm">
            {openRepliesCount} request{openRepliesCount === 1 ? '' : 's'} for
            you ·{' '}
            <a href="#requests-for-you" className="underline">
              jump down
            </a>
          </p>
        )}
      </div>

      {/* Region 1 — coverage diagnostic (this page's focal region). Renders
          only for the current teacher's own form class (P7). */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">My class — {formClassId}</h2>
          {snapshot ? (
            <CoverageBar snapshot={snapshot} />
          ) : (
            <div className="bg-muted h-2 w-full rounded-full" aria-hidden />
          )}
        </div>

        {mounted && thinRecordStudents.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Every student in {formClassId} is reviewed this term.
          </p>
        ) : (
          <div className="max-w-full overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                      disabled={thinRecordStudents.length === 0}
                    />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Tags this term</TableHead>
                  <TableHead>Last reviewed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {thinRecordStudents.map((student) => {
                  const tagCount = tags.filter(
                    (t) =>
                      t.studentId === student.id && t.lifecycle === 'active',
                  ).length
                  const nils = nilsForStudent(student.id)
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(student.id)}
                          onCheckedChange={() => toggleStudent(student.id)}
                          aria-labelledby={`broadcast-student-${student.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          id={`broadcast-student-${student.id}`}
                          to="/reports/students/$studentId"
                          params={{ studentId: student.id }}
                          className="font-medium hover:underline"
                        >
                          {student.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {tagCount}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {nils.length > 0
                          ? `Reviewed — nothing noted (${staffName(nils[0].recipientId)})`
                          : '—'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Region 2 — composer. */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Ask colleagues</h2>
        <BroadcastComposer
          formClassId={formClassId}
          selectedStudentIds={selectedIds}
          blocked={blocked}
          lastBroadcastCreatedAt={lastBroadcastCreatedAt}
          onSent={() => {
            setSelectedIds([])
            refresh()
          }}
        />
      </section>

      {/* Region 3 — replies (requester view). Only this route reads
          loadBroadcasts response content — no other view surfaces it. */}
      {replyBroadcast && replyBroadcast.responses.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Replies</h2>
          <ul className="flex flex-col divide-y divide-border">
            {replyBroadcast.responses.map((response, index) => {
              const result = response.result
              const tag =
                result.kind === 'tag'
                  ? tags.find((t) => t.id === result.tagId)
                  : undefined
              return (
                <BroadcastResponderCard
                  key={`${response.recipientId}-${response.studentId}-${index}`}
                  response={response}
                  responderName={staffName(response.recipientId)}
                  studentName={
                    getStudentById(response.studentId)?.name ??
                    'Unknown student'
                  }
                  tag={tag}
                />
              )
            })}
          </ul>
        </section>
      )}

      {/* Region 4 — "Requests for you", always last (the mock responder
          inbox). Only renders when CURRENT_TEACHER is a recipient of an
          open broadcast — the prototype's honest stand-in for a real
          notification inbox. */}
      {mounted && pendingForYou.length > 0 && (
        <section id="requests-for-you" className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium">Requests for you</h2>
            <p className="text-muted-foreground text-sm">
              Requests from form teachers land here.
            </p>
          </div>
          <ul className="flex flex-col divide-y divide-border">
            {pendingForYou.map(({ broadcast, studentId }) => (
              <RequestForYouRow
                key={`${broadcast.id}-${studentId}`}
                broadcast={broadcast}
                studentId={studentId}
                onResponded={refresh}
              />
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

const DISPOSITIONS: Array<{ id: DispositionId; label: string }> = [
  { id: 'perseverance', label: 'Perseverance' },
  { id: 'curiosity', label: 'Curiosity' },
  { id: 'collaboration', label: 'Collaboration' },
  { id: 'self-direction', label: 'Self-direction' },
]

function responseLabel(
  response: BroadcastRequest['responses'][number],
): string {
  if (response.result.kind === 'nothing-stood-out') return 'Nothing stood out'
  const tag = loadTags().find(
    (t) => response.result.kind === 'tag' && t.id === response.result.tagId,
  )
  return tag
    ? (DISPOSITIONS.find((d) => d.id === tag.disposition)?.label ?? 'Tagged')
    : 'Tagged'
}

function RequestForYouRow({
  broadcast,
  studentId,
  onResponded,
}: {
  broadcast: BroadcastRequest
  studentId: string
  onResponded: () => void
}) {
  const [disposition, setDisposition] = React.useState<DispositionId | null>(
    null,
  )
  const [nil, setNil] = React.useState(false)
  const [note, setNote] = React.useState('')

  const student = getStudentById(studentId)
  const requesterName = staffName(broadcast.requesterId)

  // Prefer what's actually stored — survives a refresh/reload, unlike a
  // component-local "just responded" flag.
  const existingResponse = broadcast.responses.find(
    (r) => r.recipientId === CURRENT_TEACHER.id && r.studentId === studentId,
  )

  function selectDisposition(id: DispositionId) {
    setNil(false)
    setDisposition((prev) => (prev === id ? null : id))
  }

  function selectNil() {
    setDisposition(null)
    setNil((prev) => !prev)
  }

  function handleSend() {
    if (nil) {
      respondToBroadcast(broadcast.id, CURRENT_TEACHER.id, studentId, {
        kind: 'nothing-stood-out',
      })
    } else if (disposition) {
      respondToBroadcast(broadcast.id, CURRENT_TEACHER.id, studentId, {
        kind: 'tag',
        tagInput: {
          studentId,
          authorId: CURRENT_TEACHER.id,
          disposition,
          context: 'other',
          note: note.trim() || undefined,
          entryPoint: 'topbar',
        },
      })
    }
    onResponded()
  }

  if (existingResponse) {
    return (
      <li className="py-3 text-sm">
        {student?.name ?? 'Unknown student'} — Responded (
        {responseLabel(existingResponse)})
      </li>
    )
  }

  return (
    <li className="flex flex-col gap-3 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium">
          {student?.name ?? 'Unknown student'}
        </span>
        <span className="text-muted-foreground text-xs">
          Asked by {requesterName}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {DISPOSITIONS.map((d) => (
          <DispositionChip
            key={d.id}
            label={d.label}
            selected={disposition === d.id}
            onClick={() => selectDisposition(d.id)}
          />
        ))}
        <button
          type="button"
          aria-pressed={nil}
          onClick={selectNil}
          className={cn(
            'h-11 sm:h-auto rounded-full border border-dashed px-3 py-1.5 text-xs font-medium motion-safe:transition-colors',
            nil
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          Nothing stood out
        </button>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`note-${broadcast.id}-${studentId}`}>
          Note (optional)
        </Label>
        <Textarea
          id={`note-${broadcast.id}-${studentId}`}
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 140))}
          rows={2}
          disabled={nil}
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!disposition && !nil}
          onClick={handleSend}
        >
          Send
        </Button>
      </div>
    </li>
  )
}
