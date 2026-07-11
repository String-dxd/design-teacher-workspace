import type { ReportLayout, Term } from '@/types/report'
import type { ReminderType } from '@/types/form'
import {
  BUILT_IN_TEMPLATES,
  defaultP1Layout,
  withDefaultBlocks,
} from '@/data/report-layouts'

// Prototype persistence for the reporting-cycle hub: one record per class+term,
// holding the layout chosen in Stage 1 and each student's in-progress draft from
// Stage 2. Modeled on src/lib/draft-storage.ts (defensive load) and
// src/lib/hdp-template-store.ts (key style). localStorage only — mock data.
//
// Note: per-student section overrides are deferred (locked decision) — the shape
// below intentionally has no `overrides` field.

export interface PerStudentDraft {
  comments: string
  ready: boolean
  /** P1-A pipeline: submitted to school leaders / approved by them. */
  reviewStatus?: 'in_review' | 'approved'
  submittedAt?: string
  sentAt?: string
  /** When the parent acknowledged the report in Parents Gateway (mock). */
  ackAt?: string
  /** Set when a send is scheduled for later; cleared once sentAt is set. */
  scheduledSendAt?: string
  /** The configured "acknowledge by" date, set at send time. */
  ackDeadline?: string
  /** Captured at send time, same depth as Posts — never dispatched. */
  reminderType?: ReminderType
  reminderDate?: string
}

/**
 * A student's place in the reporting cycle. Lives here (not in the table
 * component) so data modules can seed display states without importing from
 * a component.
 */
export type CycleStudentStatus =
  // Legacy 4-state story (all classes except P1-A)
  | 'not_started'
  | 'draft'
  | 'ready'
  | 'sent'
  // P1-A pipeline states
  | 'awaiting_results'
  | 'pending_comments'
  | 'in_review'
  | 'approved'

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
        ackAt: typeof d.ackAt === 'string' ? d.ackAt : undefined,
        scheduledSendAt:
          typeof d.scheduledSendAt === 'string' ? d.scheduledSendAt : undefined,
        ackDeadline:
          typeof d.ackDeadline === 'string' ? d.ackDeadline : undefined,
        reminderType:
          d.reminderType === 'none' ||
          d.reminderType === 'one-time' ||
          d.reminderType === 'daily'
            ? d.reminderType
            : undefined,
        reminderDate:
          typeof d.reminderDate === 'string' ? d.reminderDate : undefined,
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
 * Returns the saved cycle for classId/term, or transparently creates one
 * from the standard default template and persists it. Used by the form-class
 * flow (P1-A), which should never need a conscious "set up layout" step —
 * layout configuration is Level-scoped only, so a form teacher gets a
 * sensible default the moment they need to write, rather than a dead end.
 */
export function ensureCycle(
  classId: string,
  term: Term,
  academicYear: number,
): CycleState {
  const existing = loadCycle(classId, term)
  if (existing) return existing
  const created: CycleState = {
    classId,
    term,
    academicYear,
    templateId: BUILT_IN_TEMPLATES[0].id,
    layout: defaultP1Layout(),
    perStudent: {},
    updatedAt: new Date().toISOString(),
  }
  saveCycle(created)
  return created
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
    ready: false,
  }
  const merged: PerStudentDraft = { ...existing, ...patch }
  // Editing an approved comment invalidates the approval: the report drops
  // back to Draft and must go through school-leader review again, no matter
  // which surface wrote the change. Sent reports are exempt here — the write
  // page locks those behind an explicit correction flow that resets the
  // pipeline itself (clearing sentAt) before any comment edit can land.
  if (
    patch.comments !== undefined &&
    patch.comments !== existing.comments &&
    existing.reviewStatus === 'approved' &&
    patch.reviewStatus === undefined &&
    !existing.sentAt
  ) {
    merged.reviewStatus = undefined
    merged.ready = false
    merged.submittedAt = undefined
    // A pending scheduled send rode on that approval — cancel it too,
    // otherwise the report would be queued for parents while unapproved.
    merged.scheduledSendAt = undefined
    merged.ackDeadline = undefined
    merged.reminderType = undefined
    merged.reminderDate = undefined
  }
  const next: CycleState = {
    ...current,
    perStudent: {
      ...current.perStudent,
      [studentId]: merged,
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
