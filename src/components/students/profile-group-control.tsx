import { useState } from 'react'
import { LayoutGrid, Pencil, Plus, Trash2 } from 'lucide-react'

import { ProfileGroupModal } from './profile-group-modal'
import type { ProfileGroup } from '@/types/profile-group'
import { useProfileGroups } from '@/lib/profile-group-storage'
import { cn } from '@/lib/utils'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ProfileGroupControlProps {
  className?: string
  /** When true, also renders a "Reset" link that clears the applied group */
  showReset?: boolean
}

export function ProfileGroupControl({
  className,
  showReset = true,
}: ProfileGroupControlProps) {
  const { groups, appliedId, appliedGroup, save, remove, apply } =
    useProfileGroups()

  const savedGroups = groups.filter((g) => !g.isUnsaved)
  const appliedIsUnsaved = appliedGroup?.isUnsaved === true

  const [menuOpen, setMenuOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProfileGroup | undefined>(undefined)
  const [deleteCandidate, setDeleteCandidate] = useState<ProfileGroup | null>(
    null,
  )

  const openCreate = () => {
    setEditing(undefined)
    setModalOpen(true)
    setMenuOpen(false)
  }

  const openEdit = (group: ProfileGroup) => {
    setEditing(group)
    setModalOpen(true)
    setMenuOpen(false)
  }

  const handleSave = (group: ProfileGroup) => {
    save(group)
    apply(group.id)
  }

  const handleApply = (group: ProfileGroup) => {
    // Apply without naming — store as a transient "Unsaved" applied group only
    // when the user explicitly clicks Apply on a brand-new (unsaved) group.
    // Persisting under a stable id allows the profile card to evaluate against
    // the same buckets/criteria.
    save(group)
    apply(group.id)
  }

  const handleSelectGroup = (id: string) => {
    apply(appliedId === id ? null : id)
    setMenuOpen(false)
  }

  const confirmDelete = () => {
    if (deleteCandidate) {
      remove(deleteCandidate.id)
      setDeleteCandidate(null)
    }
  }

  return (
    <>
      <div className={cn('flex items-center gap-2', className)}>
        {showReset && appliedId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => apply(null)}
            className="text-sm text-muted-foreground"
          >
            Reset
          </Button>
        )}
        {savedGroups.length === 0 || appliedIsUnsaved ? (
          <Button
            variant="outline"
            size="sm"
            className={cn('gap-2 rounded-full', appliedId && 'border-blue-500')}
            onClick={() => {
              if (appliedIsUnsaved && appliedGroup) {
                openEdit(appliedGroup)
              } else {
                openCreate()
              }
            }}
          >
            <LayoutGrid className="h-4 w-4" />
            Group
            {appliedId && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                1
              </span>
            )}
          </Button>
        ) : (
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'gap-2 rounded-full',
                    appliedId && 'border-blue-500',
                  )}
                  aria-expanded={menuOpen}
                />
              }
            >
              <LayoutGrid className="h-4 w-4" />
              Group
              {appliedId && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  1
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-1">
              <div className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Saved groups
              </div>
              {savedGroups.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  No saved groups yet
                </p>
              )}
              {savedGroups.map((g) => {
                const isApplied = appliedId === g.id
                return (
                  <div
                    key={g.id}
                    className={cn(
                      'group/row flex items-center gap-1 rounded-xl px-2 py-1.5 text-sm hover:bg-accent',
                      isApplied && 'bg-accent/60',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectGroup(g.id)}
                      className="flex-1 truncate text-left"
                    >
                      {g.name}
                    </button>
                    <button
                      type="button"
                      aria-label={`Edit ${g.name}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        openEdit(g)
                      }}
                      className="rounded p-1 text-muted-foreground opacity-0 hover:text-foreground group-hover/row:opacity-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${g.name}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteCandidate(g)
                        setMenuOpen(false)
                      }}
                      className="rounded p-1 text-muted-foreground opacity-0 hover:text-destructive group-hover/row:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {isApplied && (
                      <span className="ml-1 text-xs text-blue-600">✓</span>
                    )}
                  </div>
                )
              })}
              <div className="my-1 border-t border-border/60" />
              <button
                type="button"
                onClick={openCreate}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-accent"
              >
                <Plus className="h-4 w-4" />
                Create new group
              </button>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <ProfileGroupModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialGroup={editing}
        onSave={handleSave}
        onApply={handleApply}
      />

      <AlertDialog
        open={!!deleteCandidate}
        onOpenChange={(o) => {
          if (!o) setDeleteCandidate(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete group?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCandidate ? (
                <>
                  This will permanently remove{' '}
                  <span className="font-medium">{deleteCandidate.name}</span>{' '}
                  and its criteria.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
