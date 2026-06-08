import { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Filter,
  Settings2,
  Trash2,
} from 'lucide-react'

import type { FilterField, SortConfig, SortDirection } from '@/types/student'
import type { ColumnConfig } from './column-visibility-popover'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { TableHead } from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ColumnHeaderMenuProps {
  column: ColumnConfig
  currentSort: SortConfig | null
  activeFilterFields: Set<FilterField>
  onSort: (field: string, direction: SortDirection) => void
  onClearSort: () => void
  onAddQuickFilter: (field: FilterField) => void
  onClearFilter: (field: FilterField) => void
  className?: string
  isSticky?: boolean
  stickyLeft?: string
  /** Show shadow on right edge (for last sticky column) */
  showStickyShadow?: boolean
  /** When provided, adds a "Select subjects..." item below sort options */
  onConfigureSubjects?: () => void
  /** Whether a custom subject selection is currently active */
  hasCustomSubjects?: boolean
  /** Called when user confirms deletion of an imported column */
  onDelete?: () => void
}

export function ColumnHeaderMenu({
  column,
  currentSort,
  activeFilterFields,
  onSort,
  onClearSort,
  onAddQuickFilter,
  onClearFilter,
  className,
  isSticky,
  stickyLeft,
  showStickyShadow,
  onConfigureSubjects,
  hasCustomSubjects,
  onDelete,
}: ColumnHeaderMenuProps) {
  const [open, setOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const isSortedBy = currentSort?.field === column.id
  const sortDirection = isSortedBy ? currentSort.direction : null
  const hasActiveFilter =
    column.filterField && activeFilterFields.has(column.filterField)

  const stickyShadow = showStickyShadow
    ? 'shadow-[inset_0_1px_0_var(--color-border),inset_0_-1px_0_var(--color-border),2px_0_5px_-2px_rgba(0,0,0,0.1)]'
    : 'shadow-[inset_0_1px_0_var(--color-border),inset_0_-1px_0_var(--color-border)]'

  const displaySource = column.source

  // Non-interactive columns render as plain TableHead
  if (!column.sortable && !column.filterable) {
    return (
      <TableHead
        className={cn(
          className,
          isSticky && 'sticky z-20 bg-white',
          stickyShadow,
        )}
        style={stickyLeft ? { left: stickyLeft } : undefined}
      >
        {column.label}
      </TableHead>
    )
  }

  return (
    <>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete imported column?</DialogTitle>
            <DialogDescription>
              This will remove this column and the data in it
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Keep column
            </Button>
            <Button
              className="bg-[var(--color-twblue-9,#0064ff)] text-white hover:bg-[var(--color-twblue-10,#0057e0)]"
              onClick={() => {
                setDeleteDialogOpen(false)
                onDelete?.()
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <TableHead
        className={cn(
          className,
          isSticky && 'sticky z-20 bg-white',
          stickyShadow,
        )}
        style={stickyLeft ? { left: stickyLeft } : undefined}
      >
        <Popover open={open} onOpenChange={setOpen}>
          <Tooltip>
            <TooltipTrigger
              render={
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className={cn(
                        'flex items-center gap-1 rounded-md px-2 py-1 -ml-2 transition-colors whitespace-nowrap',
                        'hover:bg-accent hover:text-accent-foreground cursor-pointer',
                        (isSortedBy || hasActiveFilter) && 'text-primary',
                      )}
                    >
                      <span>{column.label}</span>
                      <span className="shrink-0">
                        {isSortedBy ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : hasActiveFilter ? (
                          <Filter className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </span>
                    </button>
                  }
                />
              }
            />
            <TooltipContent>{column.label}</TooltipContent>
          </Tooltip>
          <PopoverContent align="start" className="w-52 gap-1 p-3">
            {/* Sort options */}
            {column.sortable && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (isSortedBy && sortDirection === 'asc') onClearSort()
                    else onSort(column.id, 'asc')
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--slate-5)]',
                    isSortedBy &&
                      sortDirection === 'asc' &&
                      'bg-[var(--slate-5)]',
                  )}
                >
                  <ArrowUp className="h-4 w-4 text-[var(--slate-11)]" />
                  Sort ascending
                  {isSortedBy && sortDirection === 'asc' && (
                    <Check className="ml-auto h-4 w-4 text-[var(--slate-11)]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isSortedBy && sortDirection === 'desc') onClearSort()
                    else onSort(column.id, 'desc')
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--slate-5)]',
                    isSortedBy &&
                      sortDirection === 'desc' &&
                      'bg-[var(--slate-5)]',
                  )}
                >
                  <ArrowDown className="h-4 w-4 text-[var(--slate-11)]" />
                  Sort descending
                  {isSortedBy && sortDirection === 'desc' && (
                    <Check className="ml-auto h-4 w-4 text-[var(--slate-11)]" />
                  )}
                </button>
              </>
            )}

            {/* Configure subjects (only for overallPercentage column) */}
            {onConfigureSubjects && (
              <>
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  onClick={() => {
                    onConfigureSubjects()
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--slate-5)]"
                >
                  <Settings2 className="h-4 w-4 text-[var(--slate-11)]" />
                  Select subjects...
                </button>
              </>
            )}

            {/* Delete (imported columns only) */}
            {column.imported && onDelete && (
              <>
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setDeleteDialogOpen(true)
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-[var(--slate-5)]"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            )}

            {/* Source / last updated footer */}
            {(displaySource || column.lastUpdated) && (
              <>
                <div className="my-1 h-px bg-border" />
                <div className="px-3 py-1 space-y-1.5">
                  {displaySource && (
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        Source:
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {displaySource}
                      </p>
                    </div>
                  )}
                  {column.lastUpdated && (
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {column.dateLabel ??
                          (column.imported ? 'Last uploaded:' : 'Last synced:')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {column.lastUpdated}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </PopoverContent>
        </Popover>
      </TableHead>
    </>
  )
}
