import * as React from 'react'
import type { BroadcastRequest, DispositionId } from '@/types/hdp'
import { DispositionChip } from '@/components/hdp/disposition-chip'
import { EmptyState } from '@/components/empty-state'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getStudentById } from '@/data/mock-students'
import { MOCK_STAFF } from '@/data/mock-staff'
import { CURRENT_TEACHER } from '@/data/hdp'
import {
  loadBroadcasts,
  loadTags,
  respondToBroadcast,
  seedIfEmpty,
} from '@/lib/hdp-store'

function staffName(id: string): string {
  return MOCK_STAFF.find((s) => s.id === id)?.name ?? 'Unknown teacher'
}

export interface PendingRequest {
  broadcast: BroadcastRequest
  studentId: string
}

// Every (broadcast, student) pair where teacherId is a recipient, for any
// broadcast that still has at least one unanswered pair for them. Rows the
// teacher has already answered stay in the list and render collapsed
// ("Responded (…)") rather than disappearing — the broadcast only drops out
// once every pair is answered. Exported so the Students hub page can derive
// the "Requests (n)" tab-label count without duplicating this scan.
export function pendingRequestsForTeacher(
  teacherId: string,
): Array<PendingRequest> {
  const requests: Array<PendingRequest> = []
  for (const broadcast of loadBroadcasts()) {
    if (!broadcast.recipientIds.includes(teacherId)) continue
    const hasOpenPair = broadcast.studentIds.some(
      (studentId) =>
        !broadcast.responses.some(
          (r) => r.recipientId === teacherId && r.studentId === studentId,
        ),
    )
    if (!hasOpenPair) continue
    for (const studentId of broadcast.studentIds) {
      requests.push({ broadcast, studentId })
    }
  }
  return requests
}

export function openRequestCount(
  requests: Array<PendingRequest>,
  teacherId: string,
): number {
  return requests.filter(
    ({ broadcast, studentId }) =>
      !broadcast.responses.some(
        (r) => r.recipientId === teacherId && r.studentId === studentId,
      ),
  ).length
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

// Extracted from reports.broadcast.tsx (plan 035) — the "My students" hub's
// Requests tab: the responder-facing "Requests for you" section (Region 4).
// Subtitle copy stays identical. Only renders when CURRENT_TEACHER is a
// recipient of an open broadcast — the prototype's honest stand-in for a
// real notification inbox.
export function BroadcastRequestsPanel({
  onCountChange,
}: {
  onCountChange?: (count: number) => void
}) {
  const [mounted, setMounted] = React.useState(false)
  const [pendingForYou, setPendingForYou] = React.useState<
    Array<PendingRequest>
  >([])

  const refresh = React.useCallback(() => {
    seedIfEmpty()
    const requests = pendingRequestsForTeacher(CURRENT_TEACHER.id)
    setPendingForYou(requests)
    onCountChange?.(openRequestCount(requests, CURRENT_TEACHER.id))
  }, [onCountChange])

  React.useEffect(() => {
    setMounted(true)
    refresh()
  }, [refresh])

  if (!mounted) return <div aria-hidden className="h-24" />

  return (
    <section id="requests-for-you" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium">Requests for you</h2>
        <p className="text-muted-foreground text-sm">
          Requests from form teachers land here.
        </p>
      </div>
      {pendingForYou.length === 0 ? (
        <EmptyState
          title="No requests right now"
          description="Requests from form teachers land here when they ask for help with a thin record."
        />
      ) : (
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
      )}
    </section>
  )
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
