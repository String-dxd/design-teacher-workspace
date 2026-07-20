import * as React from 'react'
import { XIcon } from 'lucide-react'
import type { CanBroadcastResult } from '@/lib/hdp-store'
import { BROADCAST_COOLDOWN_DAYS, createBroadcast } from '@/lib/hdp-store'
import { formatDate } from '@/lib/format'
import { CURRENT_TEACHER, HDP_COLLEAGUES } from '@/data/hdp'
import { teachersForStudents } from '@/data/timetable'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const DEFAULT_MESSAGE =
  "Anything stood out about these students this term? Two taps is plenty — 'Nothing stood out' is a real answer."

function staffName(id: string): string {
  return HDP_COLLEAGUES.find((c) => c.id === id)?.name ?? 'Unknown teacher'
}

interface TeacherOption {
  id: string
  name: string
}

interface BroadcastComposerProps {
  formClassId: string
  selectedStudentIds: Array<string>
  blocked: CanBroadcastResult
  /** createdAt of the class's most recent broadcast — drives the cooldown
   *  explanation's "sent {date}" / "after {date+7d}" copy for BOTH block
   *  reasons (an outstanding request is, definitionally, also the most
   *  recent one). Undefined only when the class has no broadcast history,
   *  in which case `blocked.ok` is always true and this is never read. */
  lastBroadcastCreatedAt?: string
  onSent: () => void
}

// Region 2 of /reports/broadcast (plan 031, Step 2). Three mutually
// exclusive states: blocked (cooldown/outstanding explanation, no form),
// idle (no students selected yet), and the live compose form — which itself
// replaces itself with a success panel once a request is sent, per the
// A11Y-11 "context replacement" rule (focus moves to the panel's heading,
// no toast — the whole region changed meaning, not a transient status).
export function BroadcastComposer({
  formClassId,
  selectedStudentIds,
  blocked,
  lastBroadcastCreatedAt,
  onSent,
}: BroadcastComposerProps) {
  const selectionKey = selectedStudentIds.slice().sort().join(',')
  const prevSelectionKeyRef = React.useRef(selectionKey)

  const [recipientIds, setRecipientIds] = React.useState<Array<string>>(() =>
    teachersForStudents(selectedStudentIds),
  )
  const [message, setMessage] = React.useState(DEFAULT_MESSAGE)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [sentCount, setSentCount] = React.useState<number | null>(null)

  const successHeadingRef = React.useRef<HTMLHeadingElement>(null)

  React.useEffect(() => {
    if (prevSelectionKeyRef.current !== selectionKey) {
      prevSelectionKeyRef.current = selectionKey
      setRecipientIds(teachersForStudents(selectedStudentIds))
    }
  }, [selectionKey, selectedStudentIds])

  React.useEffect(() => {
    if (sentCount !== null) {
      successHeadingRef.current?.focus()
    }
  }, [sentCount])

  if (sentCount !== null) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-lg border border-border p-6 text-center">
        <h2
          ref={successHeadingRef}
          tabIndex={-1}
          className="text-sm font-medium outline-none"
        >
          Request sent to {sentCount} teacher{sentCount === 1 ? '' : 's'}
        </h2>
        <p className="text-muted-foreground text-sm">
          You'll see replies here.
        </p>
      </div>
    )
  }

  if (!blocked.ok) {
    const sentDate = lastBroadcastCreatedAt
      ? formatDate(lastBroadcastCreatedAt, { year: false })
      : undefined
    const cooldownDate = lastBroadcastCreatedAt
      ? formatDate(
          new Date(
            new Date(lastBroadcastCreatedAt).getTime() +
              BROADCAST_COOLDOWN_DAYS * 24 * 60 * 60 * 1000,
          ).toISOString(),
          { year: false },
        )
      : undefined
    return (
      <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
        <p className="text-sm">
          One request is already out for {formClassId}
          {sentDate ? ` (sent ${sentDate})` : ''}. You can send another
          {cooldownDate ? ` after ${cooldownDate}` : ' once it is resolved'}.
        </p>
      </div>
    )
  }

  if (selectedStudentIds.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Select students above to compose a request.
      </p>
    )
  }

  const candidateColleagues: Array<TeacherOption> = HDP_COLLEAGUES.filter(
    (c) => !recipientIds.includes(c.id),
  )

  function removeRecipient(id: string) {
    setRecipientIds((prev) => prev.filter((r) => r !== id))
  }

  function addRecipient(id: string) {
    setRecipientIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  function handleConfirmSend() {
    createBroadcast({
      formClassId,
      requesterId: CURRENT_TEACHER.id,
      studentIds: selectedStudentIds,
      recipientIds,
      message,
    })
    setConfirmOpen(false)
    setSentCount(recipientIds.length)
    onSent()
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-border p-4">
      <div className="flex flex-col gap-2">
        <Label>Send to</Label>
        <div className="flex flex-wrap gap-2">
          {recipientIds.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No teachers are timetabled to these students yet — add one below.
            </p>
          )}
          {recipientIds.map((id) => (
            <span
              key={id}
              className="bg-muted-foreground/10 flex h-7 items-center gap-1 rounded-4xl pr-1 pl-3 text-xs font-medium"
            >
              {staffName(id)}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${staffName(id)}`}
                onClick={() => removeRecipient(id)}
              >
                <XIcon />
              </Button>
            </span>
          ))}
        </div>
        {candidateColleagues.length > 0 && (
          <Combobox
            items={candidateColleagues}
            value={null as TeacherOption | null}
            onValueChange={(item: TeacherOption | null) => {
              if (item) addRecipient(item.id)
            }}
            itemToStringLabel={(item: TeacherOption | null) => item?.name ?? ''}
            isItemEqualToValue={(
              a: TeacherOption | null,
              b: TeacherOption | null,
            ) => a?.id === b?.id}
          >
            <ComboboxInput
              placeholder="Add teacher"
              aria-label="Add teacher"
              className="w-56"
            />
            <ComboboxContent>
              <ComboboxEmpty>No teachers found.</ComboboxEmpty>
              <ComboboxList>
                {(item: TeacherOption) => (
                  <ComboboxItem key={item.id} value={item}>
                    {item.name}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="broadcast-message">Message</Label>
        <Textarea
          id="broadcast-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={recipientIds.length === 0}
          title={
            recipientIds.length === 0
              ? 'Add at least one teacher first'
              : undefined
          }
          onClick={() => setConfirmOpen(true)}
        >
          Send request
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send this request?</AlertDialogTitle>
            <AlertDialogDescription>
              This asks {recipientIds.length} teacher
              {recipientIds.length === 1 ? '' : 's'} about{' '}
              {selectedStudentIds.length} student
              {selectedStudentIds.length === 1 ? '' : 's'}. They can reply with
              an observation or "Nothing stood out". You can send one request
              per class every {BROADCAST_COOLDOWN_DAYS} days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSend}>
              Send request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
