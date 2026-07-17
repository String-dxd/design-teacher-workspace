import * as React from 'react'
import { TagPill } from './tag-pill'
import type { HdpTag, TagContext } from '@/types/hdp'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  /** Draft-studio selection mode (Prototype B): when both are given, the
   *  item leads with a checkbox — the river itself is the curation surface,
   *  there is no separate insights list. */
  selected?: boolean
  onSelectedChange?: () => void
}

// One entry in a student's river — the temporal anchor lives on the group
// header the river renders above each week's items ("Week of 7 Jul"), not
// on the item itself. Meta line (author + disposition + context), the
// quoted note, an evidence chip, and Edit/Delete when this tag is still
// within its 24h editable window.
export function StreamItem({
  tag,
  authorName,
  editable,
  onEdit,
  onDelete,
  selected,
  onSelectedChange,
}: StreamItemProps) {
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)
  const selectable = onSelectedChange !== undefined

  return (
    <li
      className={
        selectable
          ? 'grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 py-3.5'
          : 'grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3.5'
      }
    >
      {selectable && (
        <Checkbox
          checked={selected ?? false}
          onCheckedChange={onSelectedChange}
          aria-label={`Include this observation by ${authorName} in the draft`}
          className="mt-0.5"
        />
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="text-sm font-medium">{authorName}</span>
          <TagPill disposition={tag.disposition} />
          <span className="text-muted-foreground text-xs">
            {CONTEXT_LABELS[tag.context]}
          </span>
        </div>
        {tag.note && (
          <p className="text-foreground/80 line-clamp-3 text-sm">
            “{tag.note}”
          </p>
        )}
        {tag.evidenceIds.length > 0 && (
          <span className="bg-muted text-muted-foreground inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs">
            Evidence attached
          </span>
        )}
      </div>
      {editable && (onEdit || onDelete) ? (
        <div className="flex shrink-0 items-start gap-1">
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
      ) : (
        <span aria-hidden />
      )}

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
