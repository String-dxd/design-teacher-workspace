import * as React from 'react'
import { toast } from 'sonner'
import { DispositionChip } from './disposition-chip'
import { useTagQueue } from './tag-queue-context'
import type { DispositionId, HdpTag, TagContext } from '@/types/hdp'
import { getStudentById } from '@/data/mock-students'
import { CURRENT_TEACHER } from '@/data/hdp'
import {
  addTag,
  deleteTag,
  logEvent,
  seedIfEmpty,
  tagsByAuthor,
  tagsForStudent,
  updateTag,
} from '@/lib/hdp-store'
import { cn } from '@/lib/utils'
import { searchAllStudents, searchAssociatedStudents } from '@/lib/hdp-search'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  const [recentTags, setRecentTags] = React.useState<Array<HdpTag>>([])
  const [editingTagId, setEditingTagId] = React.useState<string | null>(null)
  const [deleteCandidate, setDeleteCandidate] = React.useState<HdpTag | null>(
    null,
  )

  const refreshRecentTags = React.useCallback(() => {
    const mine = tagsByAuthor(CURRENT_TEACHER.id)
      .filter((t) => t.lifecycle === 'active')
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5)
    setRecentTags(mine)
  }, [])

  React.useEffect(() => {
    seedIfEmpty()
    refreshRecentTags()
  }, [refreshRecentTags])

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

    if (editingTagId) {
      updateTag(editingTagId, {
        disposition: draft.disposition,
        context: draft.context,
        note: draft.note.trim() || undefined,
        evidenceIds: draft.evidenceAttached ? ['mock-evidence-1'] : [],
      })
      setEditingTagId(null)
      toast.success(`Updated tag · ${student.name}`)
    } else {
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

    refreshRecentTags()

    if (effectiveEntryPoint === 'row') {
      onSaveClose?.()
    } else {
      resetDraftForNextTag()
      searchInputRef.current?.focus()
    }
  }

  function handleEdit(tag: HdpTag) {
    setEditingTagId(tag.id)
    setDraftStudent(tag.studentId)
    setDraftDisposition(tag.disposition)
    setDraftContext(tag.context)
    setDraftNote(tag.note ?? '')
    if (tag.evidenceIds.length > 0 && !draft.evidenceAttached) {
      toggleDraftEvidence()
    }
  }

  function handleConfirmDelete() {
    if (!deleteCandidate) return
    deleteTag(deleteCandidate.id)
    setDeleteCandidate(null)
    refreshRecentTags()
  }

  function handleComposerKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement
    const isTextEntry =
      target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
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

  return (
    <div className="flex flex-col gap-6" onKeyDown={handleComposerKeyDown}>
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
            onClick={() => {
              setDraftStudent(null)
              setEditingTagId(null)
            }}
          >
            Change
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="tag-queue-search">Student</Label>
          <Input
            id="tag-queue-search"
            ref={searchInputRef}
            autoFocus
            placeholder="Search by name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            autoComplete="off"
          />
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
          variant="ghost"
          size="sm"
          onClick={toggleDraftEvidence}
        >
          {draft.evidenceAttached ? '1 attachment (mock)' : 'Attach evidence'}
        </Button>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onRequestClose && (
          <Button type="button" variant="ghost" onClick={onRequestClose}>
            Close
          </Button>
        )}
        <Button type="button" onClick={handleSave} disabled={!saveable}>
          Save tag
        </Button>
      </div>

      {recentTags.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <h3 className="text-sm font-medium">Your recent tags</h3>
          <ul className="flex flex-col gap-2">
            {recentTags.map((tag) => {
              const student = getStudentById(tag.studentId)
              const editable =
                Date.now() < new Date(tag.editableUntil).getTime()
              return (
                <li
                  key={tag.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span>
                    {student?.name ?? 'Unknown student'} ·{' '}
                    {dispositionLabel(tag.disposition)}
                  </span>
                  {editable && (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tag)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteCandidate(tag)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <AlertDialog
        open={deleteCandidate != null}
        onOpenChange={(open) => {
          if (!open) setDeleteCandidate(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tag?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes your observation of{' '}
              {deleteCandidate
                ? (getStudentById(deleteCandidate.studentId)?.name ??
                  'this student')
                : ''}{' '}
              (
              {deleteCandidate
                ? dispositionLabel(deleteCandidate.disposition)
                : ''}
              ). This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
