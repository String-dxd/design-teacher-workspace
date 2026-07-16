import * as React from 'react'
import { getISOWeek } from 'date-fns'
import { TagPill } from './tag-pill'
import type { HdpTag, TagContext } from '@/types/hdp'
import { Button } from '@/components/ui/button'
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

const CONTEXT_LABELS: Record<TagContext, string> = {
  lesson: 'during lesson',
  marking: 'while marking',
  cca: 'CCA',
  'form-time': 'form time',
  other: 'other',
}

const DISPOSITION_LABELS: Record<HdpTag['disposition'], string> = {
  perseverance: 'Perseverance',
  curiosity: 'Curiosity',
  collaboration: 'Collaboration',
  'self-direction': 'Self-direction',
}

interface StreamItemProps {
  tag: HdpTag
  authorName: string
  editable: boolean
  onEdit?: () => void
  onDelete?: () => void
}

// One entry in a student's river. Left column: a bare week marker (not tied
// to reporting progress — a lightweight temporal anchor, ISO week number of
// createdAt, since the fixture has no term-start calendar to derive a
// term-relative week from). Right column: author + context meta, the quoted
// note, an evidence chip, and Edit/Delete when this tag is still within its
// 24h editable window.
export function StreamItem({
  tag,
  authorName,
  editable,
  onEdit,
  onDelete,
}: StreamItemProps) {
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)
  const createdAt = new Date(tag.createdAt)
  const weekLabel = `W${getISOWeek(createdAt)}`

  return (
    <li className="grid grid-cols-[34px_1fr] gap-3 py-3">
      <time
        dateTime={tag.createdAt}
        className="text-muted-foreground pt-0.5 text-xs tabular-nums"
      >
        {weekLabel}
      </time>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="text-sm font-semibold">{authorName}</span>
          <TagPill disposition={tag.disposition} />
          <span className="text-muted-foreground text-xs">
            · {CONTEXT_LABELS[tag.context]}
          </span>
        </div>
        {tag.note && (
          <p className="text-muted-foreground line-clamp-3 text-sm">
            “{tag.note}”
          </p>
        )}
        {tag.evidenceIds.length > 0 && (
          <span className="bg-muted text-muted-foreground inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs">
            Evidence attached
          </span>
        )}
        {editable && (onEdit || onDelete) && (
          <div className="-ml-2 flex gap-1">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit}>
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingDelete(true)}
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tag?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes this observation (
              {DISPOSITION_LABELS[tag.disposition]}). This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmingDelete(false)
                onDelete?.()
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}
