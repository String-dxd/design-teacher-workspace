import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// One delete dialog for every Posts surface (list bulk-delete and the post
// detail page) — the two used to carry diverging copies of this markup.
// Posted posts offer "remove from my list" vs "delete for everyone" (with a
// type-DELETE confirmation); drafts and scheduled posts delete outright.

export type DeletePostMode = 'remove-from-list' | 'delete-for-everyone'

interface DeletePostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Posts in the selection already sent to parents. */
  postedCount: number
  /** Draft / scheduled posts in the selection. */
  draftCount: number
  onConfirm: (mode: DeletePostMode) => void
}

export function DeletePostDialog({
  open,
  onOpenChange,
  postedCount,
  draftCount,
  onConfirm,
}: DeletePostDialogProps) {
  const [mode, setMode] = useState<DeletePostMode>('remove-from-list')
  const [confirmText, setConfirmText] = useState('')

  // Fresh choices each time the dialog opens.
  useEffect(() => {
    if (open) {
      setMode('remove-from-list')
      setConfirmText('')
    }
  }, [open])

  const total = postedCount + draftCount
  const hasPosted = postedCount > 0
  const needsTypedConfirm = hasPosted && mode === 'delete-for-everyone'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Delete {total > 1 ? `${total} posts` : 'post'}?
          </DialogTitle>
          {!hasPosted ? (
            <DialogDescription>
              We’ll permanently delete{' '}
              {total > 1 ? 'these posts' : 'this post'}. This cannot be
              undone.
            </DialogDescription>
          ) : (
            <DialogDescription>
              {draftCount > 0 && (
                <span>
                  We’ll permanently delete {draftCount}{' '}
                  {draftCount > 1 ? 'posts' : 'post'} (draft / scheduled).{' '}
                </span>
              )}
              {draftCount > 0
                ? `For the ${postedCount} published ${postedCount > 1 ? 'posts' : 'post'}, choose what to do:`
                : 'This post has already been sent to parents. What would you like to do?'}
            </DialogDescription>
          )}
        </DialogHeader>

        {hasPosted && (
          <div className="space-y-2 py-1">
            {/* Option: Remove from my list */}
            <button
              type="button"
              onClick={() => {
                setMode('remove-from-list')
                setConfirmText('')
              }}
              className={cn(
                'w-full rounded-md border p-3.5 text-left transition-colors',
                mode === 'remove-from-list'
                  ? 'border-primary bg-primary/[0.04]'
                  : 'border-border hover:bg-muted',
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                    mode === 'remove-from-list'
                      ? 'border-primary bg-primary'
                      : 'border-input',
                  )}
                >
                  {mode === 'remove-from-list' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  )}
                </span>
                <div>
                  <p className="text-sm font-medium">Remove from my list</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Parents can still see{' '}
                    {postedCount > 1 ? 'these posts' : 'this post'}. It only
                    disappears from your view.
                  </p>
                </div>
              </div>
            </button>

            {/* Option: Delete for everyone */}
            <button
              type="button"
              onClick={() => setMode('delete-for-everyone')}
              className={cn(
                'w-full rounded-md border p-3.5 text-left transition-colors',
                mode === 'delete-for-everyone'
                  ? 'border-destructive bg-destructive/[0.04]'
                  : 'border-border hover:bg-muted',
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                    mode === 'delete-for-everyone'
                      ? 'border-destructive bg-destructive'
                      : 'border-input',
                  )}
                >
                  {mode === 'delete-for-everyone' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  )}
                </span>
                <div>
                  <p className="text-sm font-medium text-destructive">
                    Delete for everyone
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    We’ll remove{' '}
                    {postedCount > 1 ? 'these posts' : 'this post'} from the
                    Parents Gateway app. Parents will no longer see{' '}
                    {postedCount > 1 ? 'them' : 'it'}. This cannot be undone.
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Type DELETE confirmation — only for "Delete for everyone" */}
        {needsTypedConfirm && (
          <div className="space-y-1.5 pt-1">
            <p className="text-xs text-muted-foreground">
              Type{' '}
              <span className="font-mono font-semibold text-destructive">
                DELETE
              </span>{' '}
              to confirm.
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="font-mono uppercase"
              autoComplete="off"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={
              !hasPosted || mode === 'delete-for-everyone'
                ? 'destructive'
                : 'default'
            }
            disabled={
              needsTypedConfirm &&
              confirmText.trim().toUpperCase() !== 'DELETE'
            }
            onClick={() => onConfirm(mode)}
          >
            {!hasPosted
              ? `Delete ${total > 1 ? `${total} posts` : 'post'}`
              : mode === 'remove-from-list'
                ? 'Remove from my list'
                : 'Delete for everyone'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
