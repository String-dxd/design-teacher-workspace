import * as React from 'react'
import { ArrowLeft, Paperclip, Search } from 'lucide-react'
import { toast } from 'sonner'
import { DispositionChip } from './disposition-chip'
import { useTagQueue } from './tag-queue-context'
import type { DispositionId, TagContext } from '@/types/hdp'
import { getStudentById } from '@/data/mock-students'
import { CURRENT_TEACHER } from '@/data/hdp'
import { addTag, logEvent, seedIfEmpty, tagsForStudent } from '@/lib/hdp-store'
import { cn } from '@/lib/utils'
import { searchAllStudents, searchAssociatedStudents } from '@/lib/hdp-search'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const DISPOSITIONS: Array<{ id: DispositionId; label: string }> = [
  { id: 'perseverance', label: 'Perseverance' },
  { id: 'curiosity', label: 'Curiosity' },
  { id: 'collaboration', label: 'Collaboration' },
  { id: 'self-direction', label: 'Self-direction' },
]

const CONTEXTS: Array<{ id: TagContext; label: string }> = [
  { id: 'lesson', label: 'During lesson' },
  { id: 'marking', label: 'While marking' },
  { id: 'cca', label: 'CCA' },
  { id: 'form-time', label: 'Form time' },
  { id: 'other', label: 'Other' },
]

const NOTE_MAX_LENGTH = 140

function dispositionLabel(id: DispositionId): string {
  return DISPOSITIONS.find((d) => d.id === id)?.label ?? id
}

interface TagQueueComposerProps {
  /** Called after a successful save when the entry point is 'row' — a
   *  specific student was pre-chosen, single-tag intent. The overlay passes
   *  closeTagQueue; the /reports/tag page passes nothing (there's no dialog
   *  to close). */
  onSaveClose?: () => void
  /** Renders the ghost "Close" action when provided. */
  onRequestClose?: () => void
}

export function TagQueueComposer({
  onSaveClose,
  onRequestClose,
}: TagQueueComposerProps) {
  const {
    draft,
    entryPoint,
    openedAt,
    setDraftStudent,
    setDraftContext,
    setDraftDisposition,
    setDraftNote,
    toggleDraftEvidence,
    resetDraftForNextTag,
  } = useTagQueue()

  const effectiveEntryPoint = entryPoint ?? 'topbar'
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [highlightedIndex, setHighlightedIndex] = React.useState(0)
  React.useEffect(() => {
    seedIfEmpty()
  }, [])

  const selectedStudent = draft.studentId
    ? getStudentById(draft.studentId)
    : null

  const associated = searchAssociatedStudents(searchQuery, CURRENT_TEACHER.id)
  const showEscapeHatch = searchQuery.trim() !== '' && associated.length === 0
  const results = showEscapeHatch ? searchAllStudents(searchQuery) : associated

  React.useEffect(() => {
    setHighlightedIndex(0)
  }, [searchQuery])

  function selectStudent(studentId: string) {
    setDraftStudent(studentId)
    setSearchQuery('')
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        selectStudent(results[highlightedIndex].id)
      }
    }
  }

  const saveable = draft.studentId != null && draft.disposition != null

  function handleSave() {
    if (!saveable || !draft.studentId || !draft.disposition) return
    const student = getStudentById(draft.studentId)
    if (!student) return

    {
      addTag({
        studentId: draft.studentId,
        authorId: CURRENT_TEACHER.id,
        disposition: draft.disposition,
        context: draft.context,
        note: draft.note.trim() || undefined,
        evidenceIds: draft.evidenceAttached ? ['mock-evidence-1'] : [],
        source: 'self',
        entryPoint: effectiveEntryPoint,
      })
      const durationMs = openedAt ? Date.now() - openedAt : 0
      logEvent('tag_created', {
        duration_ms: durationMs,
        context: draft.context,
        entry_point: effectiveEntryPoint,
        has_note: draft.note.trim().length > 0,
        has_evidence: draft.evidenceAttached,
      })
      toast.success(
        `Tagged ${student.name} · ${dispositionLabel(draft.disposition)}`,
      )
    }

    if (effectiveEntryPoint === 'row') {
      onSaveClose?.()
    } else {
      resetDraftForNextTag()
      searchInputRef.current?.focus()
    }
  }

  // A plain onKeyDown prop only fires while focus is on this element or one
  // of its descendants. Inside the Dialog, Base UI's focus trap parks DOM
  // focus on the dialog container itself once the previously-focused
  // descendant (e.g. a clicked search result) unmounts — an ANCESTOR of
  // this composer, not a descendant — so a div-level handler would silently
  // stop receiving these keys the moment that happens. A document-level
  // listener, scoped to this component's mount lifetime, isn't affected by
  // where inside (or just outside) the composer's own subtree the trap
  // happens to park focus.
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const isTextEntry =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'
      if (isTextEntry) return

      if (/^[1-4]$/.test(e.key)) {
        const index = Number(e.key) - 1
        if (index >= 0 && index < DISPOSITIONS.length) {
          const d = DISPOSITIONS[index]
          e.preventDefault()
          setDraftDisposition(draft.disposition === d.id ? null : d.id)
        }
      } else if (e.key === 'Enter' && saveable) {
        e.preventDefault()
        handleSave()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  })

  return (
    <div className="flex flex-col gap-6">
      {selectedStudent ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium">{selectedStudent.name}</span>
            <span className="text-muted-foreground text-xs">
              {selectedStudent.class}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDraftStudent(null)}
          >
            <ArrowLeft aria-hidden />
            Back
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="tag-queue-search">Student</Label>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="tag-queue-search"
              ref={searchInputRef}
              autoFocus
              placeholder="Search by name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              autoComplete="off"
              className="pl-9"
            />
          </div>
          <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
            {/* ui/combobox does not support async row meta — plain list */}
            {showEscapeHatch && (
              <li
                className="text-muted-foreground px-2 py-1 text-xs"
                aria-hidden
              >
                No matches in your classes — showing all students
              </li>
            )}
            {results.map((student, index) => {
              const tagCount = tagsForStudent(student.id).filter(
                (t) => t.lifecycle === 'active',
              ).length
              return (
                <li key={student.id}>
                  <button
                    type="button"
                    onClick={() => selectStudent(student.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm',
                      index === highlightedIndex
                        ? 'bg-muted'
                        : 'hover:bg-muted/50',
                    )}
                  >
                    <span>
                      {student.name}{' '}
                      <span className="text-muted-foreground">
                        · {student.class}
                      </span>
                    </span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {tagCount} this term
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label>Disposition</Label>
        <div className="flex flex-wrap gap-2">
          {DISPOSITIONS.map((d) => (
            <DispositionChip
              key={d.id}
              label={d.label}
              selected={draft.disposition === d.id}
              onClick={() =>
                setDraftDisposition(draft.disposition === d.id ? null : d.id)
              }
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tag-queue-note">Note (optional)</Label>
        <Textarea
          id="tag-queue-note"
          value={draft.note}
          onChange={(e) =>
            setDraftNote(e.target.value.slice(0, NOTE_MAX_LENGTH))
          }
          maxLength={NOTE_MAX_LENGTH}
          rows={2}
        />
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            For concerns about a student's wellbeing, use your school's usual
            channels.
          </p>
          <span className="text-muted-foreground shrink-0 pl-2 text-xs tabular-nums">
            {draft.note.length}/{NOTE_MAX_LENGTH}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Context</Label>
        <div className="flex flex-wrap gap-2">
          {CONTEXTS.map((c) => (
            <DispositionChip
              key={c.id}
              label={c.label}
              selected={draft.context === c.id}
              onClick={() => setDraftContext(c.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-pressed={draft.evidenceAttached}
          onClick={toggleDraftEvidence}
        >
          <Paperclip aria-hidden />
          {draft.evidenceAttached ? '1 attachment (mock)' : 'Attach evidence'}
        </Button>
      </div>

      <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-xs">
          {saveable ? '' : 'Choose a student and a disposition to save.'}
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {onRequestClose && (
            <Button type="button" variant="ghost" onClick={onRequestClose}>
              Close
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={!saveable}
            title={
              !saveable ? 'Choose a student and a disposition first' : undefined
            }
          >
            Save tag
          </Button>
        </div>
      </div>
    </div>
  )
}
