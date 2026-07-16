import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react'
import { SourceTag } from './source-tag'
import type { DraftClaim, HdpTag } from '@/types/hdp'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ClaimEditorProps {
  claims: Array<DraftClaim>
  onChange: (claims: Array<DraftClaim>) => void
  /** Resolves a sourced claim's underlying tag for the SourceTag popover's
   *  "Based on:" lineage view — draft-studio.tsx already holds the
   *  student's river, so this component stays store-free. */
  resolveTag?: (
    tagId: string,
  ) => { tag: HdpTag; authorName: string } | undefined
}

// A claim-list editor: one row per sentence, a SourceTag chip after each,
// reorder/delete controls, and a ghost "Add a sentence" that always creates
// a sourceless ("your addition") claim. There is deliberately no control
// here that can attach a source to a claim — editing a sourced sentence
// keeps its source and marks `edited: true`; there's no "remove source" nor
// any way to assign one to a claim that started without it (P3).
export function ClaimEditor({
  claims,
  onChange,
  resolveTag,
}: ClaimEditorProps) {
  function updateText(index: number, text: string) {
    const next = claims.map((claim, i) => {
      if (i !== index) return claim
      // Any edit to a sourced claim keeps the source (compression/reordering
      // is allowed by the AI behaviour spec) and marks it edited — never
      // strips or reassigns the source.
      return claim.source
        ? { ...claim, text, edited: true }
        : { ...claim, text }
    })
    onChange(next)
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= claims.length) return
    const next = claims.slice()
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    onChange(next)
  }

  function remove(index: number) {
    onChange(claims.filter((_, i) => i !== index))
  }

  function addSentence() {
    onChange([...claims, { text: '' }])
  }

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-3">
        {claims.map((claim, index) => {
          const resolved = claim.source
            ? resolveTag?.(claim.source.tagId)
            : undefined
          return (
            <li key={index} className="flex items-start gap-2">
              <span
                aria-hidden
                className="text-muted-foreground mt-2 w-4 shrink-0 text-xs tabular-nums"
              >
                {index + 1}.
              </span>
              <div className="flex flex-1 flex-col gap-1.5">
                <label htmlFor={`claim-${index}`} className="sr-only">
                  Sentence {index + 1}
                </label>
                <Textarea
                  id={`claim-${index}`}
                  value={claim.text}
                  onChange={(e) => updateText(index, e.target.value)}
                  rows={2}
                />
                <SourceTag
                  source={claim.source}
                  edited={claim.edited}
                  tag={resolved?.tag}
                  authorName={resolved?.authorName}
                />
              </div>
              <div className="flex shrink-0 flex-col gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Move sentence ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ChevronUp aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Move sentence ${index + 1} down`}
                  disabled={index === claims.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ChevronDown aria-hidden />
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Delete sentence ${index + 1}`}
                onClick={() => remove(index)}
              >
                <X aria-hidden />
              </Button>
            </li>
          )
        })}
      </ol>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit"
        onClick={addSentence}
      >
        <Plus aria-hidden />
        Add a sentence
      </Button>
    </div>
  )
}
