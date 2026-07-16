import { StreamItem } from './stream-item'
import type { DraftClaim, HdpTag } from '@/types/hdp'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface SourceTagProps {
  source?: DraftClaim['source']
  edited?: boolean
  /** The underlying tag this source traces to, for the popover's lineage
   *  view — resolved by the caller (draft-studio.tsx already holds the
   *  student's river). Absent only if the tag can't be found, which the
   *  popover renders honestly rather than fabricating. */
  tag?: HdpTag
  authorName?: string
}

// Inline chip after a claim's text. Two variants: `source` (a real tag
// backs this sentence — click opens the "Based on:" lineage popover) and
// `mine` (a teacher-written sentence with no source — "your addition",
// no popover, nothing to trace). There is deliberately no third variant and
// no prop that lets a caller attach a source without a real tag (P3).
export function SourceTag({ source, edited, tag, authorName }: SourceTagProps) {
  const baseClassName = 'text-xs font-medium rounded px-1.5 whitespace-nowrap'

  if (!source) {
    return (
      <span className={cn(baseClassName, 'bg-muted text-muted-foreground')}>
        your addition
      </span>
    )
  }

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          baseClassName,
          'text-primary bg-primary/10 focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
        )}
      >
        {source.label}
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <PopoverHeader>
          <PopoverTitle>Based on:</PopoverTitle>
        </PopoverHeader>
        {tag ? (
          <ol>
            <StreamItem
              tag={tag}
              authorName={authorName ?? 'Unknown teacher'}
              editable={false}
            />
          </ol>
        ) : (
          <p className="text-muted-foreground text-sm">
            This tag is no longer available.
          </p>
        )}
        {edited && (
          <p className="text-muted-foreground text-xs">
            Sentence edited by you
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
