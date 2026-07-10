import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { excerpt } from '@/components/reports/cycle-student-table'

// Bulk "submit for review" — the deliberate step after a teacher has drafted
// every student's comment: a checklist (not a plain count-confirm) so a
// straggler with an unfinished draft can be unchecked before submitting the
// batch to school leaders.

export interface SubmitForReviewCandidate {
  id: string
  name: string
  comments: string
}

interface SubmitForReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidates: Array<SubmitForReviewCandidate>
  onConfirm: (selectedIds: Array<string>) => void
}

export function SubmitForReviewDialog({
  open,
  onOpenChange,
  candidates,
  onConfirm,
}: SubmitForReviewDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Default every candidate to checked each time the dialog opens. candidates
  // is deliberately not a dependency — only reset on open, not on every
  // roster recompute while the dialog is already showing.
  useEffect(() => {
    if (open) setSelected(new Set(candidates.map((c) => c.id)))
  }, [open])

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit for review</DialogTitle>
          <DialogDescription>
            Send these drafted reports to school leaders for approval. Uncheck
            anyone whose comment isn’t ready yet.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {candidates.map((c) => (
            <label
              key={c.id}
              className="hover:bg-muted/50 flex items-start gap-3 rounded-lg px-2 py-2"
            >
              <Checkbox
                checked={selected.has(c.id)}
                onCheckedChange={(checked) => toggle(c.id, checked === true)}
                className="mt-0.5"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{c.name}</span>
                <span className="text-muted-foreground block truncate text-xs">
                  {excerpt(c.comments, 80) || 'No comment text'}
                </span>
              </span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={selected.size === 0}
            onClick={() => onConfirm([...selected])}
          >
            Submit {selected.size} for review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
