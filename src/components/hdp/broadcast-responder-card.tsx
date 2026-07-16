import { StreamItem } from './stream-item'
import type { BroadcastResponse, HdpTag } from '@/types/hdp'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
  })
}

interface BroadcastResponderCardProps {
  response: BroadcastResponse
  responderName: string
  studentName: string
  /** Set only when response.result.kind === 'tag' — the tag it references. */
  tag?: HdpTag
}

// One row in the requester's "Replies" region (reports.broadcast.tsx):
// who answered, about which student, and what they said — either the tag
// they made (rendered via the same StreamItem the river uses) or an
// explicit "Nothing stood out" nil, sized like the composer's disposition
// chips but dashed-border and non-interactive (it's a record, not a toggle).
export function BroadcastResponderCard({
  response,
  responderName,
  studentName,
  tag,
}: BroadcastResponderCardProps) {
  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{studentName}</span>
        <span className="text-muted-foreground text-xs">{responderName}</span>
      </div>
      {response.result.kind === 'tag' && tag ? (
        <ol className="flex flex-col divide-y divide-border">
          <StreamItem tag={tag} authorName={responderName} editable={false} />
        </ol>
      ) : (
        <div className="flex flex-col gap-1">
          <span className="border-border text-muted-foreground w-fit rounded-full border border-dashed px-3 py-1.5 text-xs font-medium">
            Nothing stood out
          </span>
          <p className="text-muted-foreground text-xs">
            Marks {studentName} reviewed — nothing noted ({responderName},{' '}
            {formatDate(response.respondedAt)})
          </p>
        </div>
      )}
    </li>
  )
}
