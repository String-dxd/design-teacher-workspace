import { useState } from 'react'
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'

import type { ReportBlock } from '@/types/report'
import type { SectionDef } from '@/data/report-layouts'
import { P1_SECTION_DEFS } from '@/data/report-layouts'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

// Section toggle/reorder list for the layout stage. Reorder is drag-first (grip
// handle) with the arrow buttons kept as the keyboard-accessible path.

export interface SectionLayoutEditorProps {
  blocks: Array<ReportBlock>
  onToggle: (key: string) => void
  onMove: (index: number, dir: -1 | 1) => void
  /** Move the block with `key` to position `toIndex` (drag reorder). */
  onReorder: (key: string, toIndex: number) => void
}

export function SectionLayoutEditor({
  blocks,
  onToggle,
  onMove,
  onReorder,
}: SectionLayoutEditorProps) {
  const orderedBlocks = [...blocks].sort((a, b) => a.order - b.order)
  const defById = new Map<string, SectionDef>(
    P1_SECTION_DEFS.map((d) => [d.key, d]),
  )
  // Dragging is armed by pressing the grip so text/controls inside the card
  // don't accidentally start a drag.
  const [armedKey, setArmedKey] = useState<string | null>(null)
  const [draggingKey, setDraggingKey] = useState<string | null>(null)

  return (
    <ul className="flex flex-col gap-2">
      {orderedBlocks.map((b, i) => {
        const def = defById.get(b.key)
        if (!def) return null
        const naAtP1 = def.applicableAtP1 === false
        const isDragging = draggingKey === b.key
        // Required sections are pinned: no dragging, no arrows, and other
        // rows can't be dropped above them.
        const pinned = def.required === true
        const rowAboveIsPinned =
          i > 0 &&
          defById.get(orderedBlocks[i - 1].key)?.required === true
        return (
          <li
            key={b.key}
            draggable={!pinned && (armedKey === b.key || isDragging)}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move'
              setDraggingKey(b.key)
            }}
            onDragEnter={() => {
              if (draggingKey && draggingKey !== b.key && !pinned) {
                onReorder(draggingKey, i)
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={() => {
              setDraggingKey(null)
              setArmedKey(null)
            }}
            className={cn(
              'rounded-lg border px-3 py-2.5 transition-opacity',
              b.enabled ? 'bg-card' : 'bg-muted/30',
              isDragging && 'border-primary/40 opacity-50',
            )}
          >
            <div className="flex items-center gap-2">
              <GripVertical
                aria-hidden
                onPointerDown={() => !pinned && setArmedKey(b.key)}
                onPointerUp={() => setArmedKey(null)}
                className={cn(
                  'text-muted-foreground/60 size-4 shrink-0 touch-none',
                  pinned
                    ? 'opacity-30'
                    : isDragging
                      ? 'cursor-grabbing'
                      : 'cursor-grab',
                )}
              />
              <Checkbox
                checked={def.required ? true : b.enabled}
                disabled={def.required}
                aria-label={`Include ${def.label}`}
                onCheckedChange={() => !def.required && onToggle(b.key)}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium">
                    {def.label}
                  </span>
                  {def.required && (
                    <span className="text-muted-foreground text-[11px]">
                      Required
                    </span>
                  )}
                  {naAtP1 && (
                    <span className="text-muted-foreground text-[11px]">
                      Not applicable at P1
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground truncate text-xs">
                  {def.description}
                </p>
              </div>
              <div className="flex shrink-0 items-center">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move ${def.label} up`}
                  disabled={pinned || i === 0 || rowAboveIsPinned}
                  onClick={() => onMove(i, -1)}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move ${def.label} down`}
                  disabled={pinned || i === orderedBlocks.length - 1}
                  onClick={() => onMove(i, 1)}
                >
                  <ArrowDown className="size-4" />
                </Button>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
