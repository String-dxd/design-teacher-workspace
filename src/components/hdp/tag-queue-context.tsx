import * as React from 'react'
import type { DispositionId, TagContext, TagEntryPoint } from '@/types/hdp'
import { useFeatureFlag } from '@/hooks/use-feature-flag'

// Global capture session for the Tag Queue: the overlay's open/closed state
// plus the composer's in-progress draft. The draft lives here (not in the
// dialog component) so an unsaved note survives close/reopen within the
// session (plan 029 behaviour requirement) — closing the overlay never
// silently destroys typed content.

export interface TagQueuePrefill {
  studentId?: string
  context?: TagContext
  entryPoint: TagEntryPoint
}

export interface ComposerDraft {
  studentId: string | null
  context: TagContext
  disposition: DispositionId | null
  note: string
  evidenceAttached: boolean
}

interface TagQueueContextValue {
  open: boolean
  entryPoint: TagEntryPoint | null
  openedAt: number | null
  draft: ComposerDraft
  openTagQueue: (prefill: TagQueuePrefill) => void
  closeTagQueue: () => void
  setDraftStudent: (studentId: string | null) => void
  setDraftContext: (context: TagContext) => void
  setDraftDisposition: (disposition: DispositionId | null) => void
  setDraftNote: (note: string) => void
  toggleDraftEvidence: () => void
  /** Called after a successful save on 'fab'/'topbar' entry points: clears
   *  student + note + evidence for the next tag, keeps the overlay open and
   *  keeps the current context (still glanceable, still one tap to fix). */
  resetDraftForNextTag: () => void
}

const TagQueueContext = React.createContext<TagQueueContextValue | null>(null)

const EMPTY_DRAFT: ComposerDraft = {
  studentId: null,
  context: 'lesson',
  disposition: null,
  note: '',
  evidenceAttached: false,
}

/** PRD F0.1.3: default TagContext derived from the invoking route.
 *  '/groups' → 'cca' (CCA is a first-class tag context); everything else →
 *  'lesson'. Always editable afterwards in the composer. */
export function contextFromPath(pathname: string): TagContext {
  if (pathname.startsWith('/groups')) return 'cca'
  return 'lesson'
}

export function TagQueueProvider({ children }: { children: React.ReactNode }) {
  // The provider mounts unconditionally in __root.tsx (Step 6) so the
  // top-bar button and FAB share one session — but a stale caller (e.g. a
  // route rendered before the flag was toggled off) must not be able to
  // open a dead overlay. openTagQueue no-ops when the module flag is off;
  // the FAB/overlay/buttons are themselves gated on the same flag.
  const moduleEnabled = useFeatureFlag('reports-hdp')
  const [open, setOpen] = React.useState(false)
  const [entryPoint, setEntryPoint] = React.useState<TagEntryPoint | null>(null)
  const [openedAt, setOpenedAt] = React.useState<number | null>(null)
  const [draft, setDraft] = React.useState<ComposerDraft>(EMPTY_DRAFT)

  const openTagQueue = React.useCallback(
    (prefill: TagQueuePrefill) => {
      if (!moduleEnabled) return
      setEntryPoint(prefill.entryPoint)
      setOpenedAt(Date.now())
      setDraft((prev) => ({
        ...prev,
        studentId: prefill.studentId ?? prev.studentId,
        context: prefill.context ?? prev.context,
      }))
      setOpen(true)
    },
    [moduleEnabled],
  )

  const closeTagQueue = React.useCallback(() => {
    setOpen(false)
  }, [])

  const setDraftStudent = React.useCallback((studentId: string | null) => {
    setDraft((prev) => ({ ...prev, studentId }))
  }, [])

  const setDraftContext = React.useCallback((context: TagContext) => {
    setDraft((prev) => ({ ...prev, context }))
  }, [])

  const setDraftDisposition = React.useCallback(
    (disposition: DispositionId | null) => {
      setDraft((prev) => ({ ...prev, disposition }))
    },
    [],
  )

  const setDraftNote = React.useCallback((note: string) => {
    setDraft((prev) => ({ ...prev, note }))
  }, [])

  const toggleDraftEvidence = React.useCallback(() => {
    setDraft((prev) => ({ ...prev, evidenceAttached: !prev.evidenceAttached }))
  }, [])

  const resetDraftForNextTag = React.useCallback(() => {
    setDraft((prev) => ({
      ...EMPTY_DRAFT,
      context: prev.context,
    }))
  }, [])

  const value = React.useMemo<TagQueueContextValue>(
    () => ({
      open,
      entryPoint,
      openedAt,
      draft,
      openTagQueue,
      closeTagQueue,
      setDraftStudent,
      setDraftContext,
      setDraftDisposition,
      setDraftNote,
      toggleDraftEvidence,
      resetDraftForNextTag,
    }),
    [
      open,
      entryPoint,
      openedAt,
      draft,
      openTagQueue,
      closeTagQueue,
      setDraftStudent,
      setDraftContext,
      setDraftDisposition,
      setDraftNote,
      toggleDraftEvidence,
      resetDraftForNextTag,
    ],
  )

  return (
    <TagQueueContext.Provider value={value}>
      {children}
    </TagQueueContext.Provider>
  )
}

export function useTagQueue(): TagQueueContextValue {
  const ctx = React.useContext(TagQueueContext)
  if (!ctx) {
    throw new Error('useTagQueue must be used within a TagQueueProvider')
  }
  return ctx
}
