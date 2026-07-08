import type { ReportLayout, Term } from '@/types/report'
import { withDefaultBlocks } from '@/data/report-layouts'

// Prototype persistence for the reporting-cycle hub: one record per class+term,
// holding the layout chosen in Stage 1 and each student's in-progress draft from
// Stage 2. Modeled on src/lib/draft-storage.ts (defensive load) and
// src/lib/hdp-template-store.ts (key style). localStorage only — mock data.
//
// Note: per-student section overrides are deferred (locked decision) — the shape
// below intentionally has no `overrides` field.

export interface PerStudentDraft {
  comments: string
  parentMessage: string
  ready: boolean
  /** P1-A pipeline: submitted to school leaders / approved by them. */
  reviewStatus?: 'in_review' | 'approved'
  submittedAt?: string
  sentAt?: string
}

export interface CycleState {
  classId: string
  term: Term
  academicYear: number
  templateId: string
  layout: ReportLayout
  perStudent: Record<string, PerStudentDraft>
  updatedAt: string
}

const cycleKey = (classId: string, term: Term) => `hdp_cycle_${classId}_${term}`

export function loadCycle(classId: string, term: Term): CycleState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(cycleKey(classId, term))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const state = parsed as Record<string, unknown>
    const layout = state.layout as Record<string, unknown> | null | undefined
    if (
      typeof state.classId !== 'string' ||
      typeof state.term !== 'string' ||
      typeof state.templateId !== 'string' ||
      typeof state.updatedAt !== 'string' ||
      typeof layout !== 'object' ||
      layout === null ||
      !Array.isArray(layout.blocks)
    ) {
      return null
    }
    const rawPerStudent =
      typeof state.perStudent === 'object' && state.perStudent !== null
        ? (state.perStudent as Record<string, unknown>)
        : {}
    // Defensively patch each student draft in case of a partial/older shape.
    const perStudent: Record<string, PerStudentDraft> = {}
    for (const [studentId, draft] of Object.entries(rawPerStudent)) {
      if (typeof draft !== 'object' || draft === null) continue
      const d = draft as Record<string, unknown>
      const ready = typeof d.ready === 'boolean' ? d.ready : false
      perStudent[studentId] = {
        comments: typeof d.comments === 'string' ? d.comments : '',
        parentMessage:
          typeof d.parentMessage === 'string' ? d.parentMessage : '',
        ready,
        reviewStatus:
          d.reviewStatus === 'in_review' || d.reviewStatus === 'approved'
            ? d.reviewStatus
            : // Legacy drafts marked ready pre-date the review pipeline —
              // treat them as already submitted for review.
              ready
              ? 'in_review'
              : undefined,
        submittedAt:
          typeof d.submittedAt === 'string' ? d.submittedAt : undefined,
        sentAt: typeof d.sentAt === 'string' ? d.sentAt : undefined,
      }
    }
    return {
      classId: state.classId,
      term: state.term as Term,
      academicYear:
        typeof state.academicYear === 'number' ? state.academicYear : 0,
      templateId: state.templateId,
      // Older saved cycles pre-date newer sections — merge in any missing
      // default blocks so they show up in the editor and the document.
      layout: {
        blocks: withDefaultBlocks((layout as unknown as ReportLayout).blocks),
      },
      perStudent,
      updatedAt: state.updatedAt,
    }
  } catch {
    return null
  }
}

export function saveCycle(state: CycleState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      cycleKey(state.classId, state.term),
      JSON.stringify({ ...state, updatedAt: new Date().toISOString() }),
    )
  } catch {
    // Quota exceeded or localStorage unavailable — silently ignore
  }
}

/**
 * Merge a partial draft update for one student into the cycle and persist it.
 * Creates the per-student entry if it doesn't exist yet.
 */
export function patchStudent(
  classId: string,
  term: Term,
  studentId: string,
  patch: Partial<PerStudentDraft>,
): CycleState | null {
  const current = loadCycle(classId, term)
  if (!current) return null
  const existing: PerStudentDraft = current.perStudent[studentId] ?? {
    comments: '',
    parentMessage: '',
    ready: false,
  }
  const next: CycleState = {
    ...current,
    perStudent: {
      ...current.perStudent,
      [studentId]: { ...existing, ...patch },
    },
  }
  saveCycle(next)
  return next
}

export function clearCycle(classId: string, term: Term): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(cycleKey(classId, term))
  } catch {
    // ignore
  }
}
