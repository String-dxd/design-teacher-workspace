import * as React from 'react'
import { Link } from '@tanstack/react-router'
import type { CanBroadcastResult } from '@/lib/hdp-store'
import type { BroadcastRequest, HdpTag } from '@/types/hdp'
import { BroadcastComposer } from '@/components/hdp/broadcast-composer'
import { BroadcastResponderCard } from '@/components/hdp/broadcast-responder-card'
import { CoverageBar } from '@/components/hdp/coverage-bar'
import {
  canBroadcast,
  coverageForClass,
  loadBroadcasts,
  loadTags,
  nilsForStudent,
  seedIfEmpty,
  tagsForStudent,
} from '@/lib/hdp-store'
import { getStudentById, mockStudents } from '@/data/mock-students'
import { MOCK_STAFF } from '@/data/mock-staff'
import { CURRENT_CYCLE, CURRENT_TEACHER } from '@/data/hdp'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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

// Extracted from reports.broadcast.tsx (plan 035) — the "My students" hub's
// Gaps tab: requester journey only (coverage diagnostic → composer →
// replies). The responder-facing "Requests for you" section (Region 4) moved
// to broadcast-requests-panel.tsx / the Requests tab instead — the in-page
// jump-down pointer between them is gone now that they're separate tabs.
export function CoverageBroadcastPanel() {
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
  }, [formClassId])

  React.useEffect(() => {
    setMounted(true)
    refresh()
  }, [refresh])

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

  return (
    <div className="flex flex-col gap-10">
      <p className="text-muted-foreground text-sm">
        See who has thin records in {formClassId} and ask colleagues to help.
      </p>

      {/* Region 1 — coverage diagnostic (this tab's focal region). Renders
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
          <div className="min-w-0 max-w-full overflow-x-auto rounded-lg border border-border">
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

      {/* Region 3 — replies (requester view). Only this view reads
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
    </div>
  )
}
