import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'

import type { ReportBlock } from '@/types/report'
import type { SectionDef } from '@/data/report-layouts'
import { P1_SECTION_DEFS } from '@/data/report-layouts'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

// Section toggle/reorder list — extracted from the old split-view builder so it can
// be shared by Stage 1 (Layout) without a per-section view/viz switcher. Sections
// are text-only now; no chartable-view concept left in the layout model.

export interface SectionLayoutEditorProps {
  blocks: Array<ReportBlock>
  onToggle: (key: string) => void
  onMove: (index: number, dir: -1 | 1) => void
}

export function SectionLayoutEditor({
  blocks,
  onToggle,
  onMove,
}: SectionLayoutEditorProps) {
  const orderedBlocks = [...blocks].sort((a, b) => a.order - b.order)
  const defById = new Map<string, SectionDef>(
    P1_SECTION_DEFS.map((d) => [d.key, d]),
  )

  return (
    <ul className="flex flex-col gap-2">
      {orderedBlocks.map((b, i) => {
        const def = defById.get(b.key)
        if (!def) return null
        const naAtP1 = def.applicableAtP1 === false
        return (
          <li
            key={b.key}
            className={cn(
              'rounded-lg border px-3 py-2.5',
              b.enabled ? 'bg-card' : 'bg-muted/30',
            )}
          >
            <div className="flex items-center gap-2">
              <GripVertical
                aria-hidden
                className="text-muted-foreground/60 size-4 shrink-0"
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
                  disabled={i === 0}
                  onClick={() => onMove(i, -1)}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move ${def.label} down`}
                  disabled={i === orderedBlocks.length - 1}
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
