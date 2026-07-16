import type {
  BroadcastRequest,
  CoverageSnapshot,
  DispositionId,
  FormingPattern,
  HdpDraft,
  HdpReportBook,
  HdpTag,
  TagContext,
  TagEntryPoint,
} from '@/types/hdp'
import { mockStudents } from '@/data/mock-students'
import {
  CURRENT_CYCLE,
  SEED_BROADCAST,
  SEED_DRAFTS,
  SEED_PATTERNS,
  SEED_REPORT_BOOKS,
  SEED_TAGS,
} from '@/data/hdp'

// localStorage-backed store for the whole HDP Reports module. Modeled on
// src/lib/hdp-cycle-store.ts (defensive JSON parse, `typeof window ===
// 'undefined'` guard). One key per collection, seeded from src/data/hdp.ts
// on first load via seedIfEmpty(). SSR-safe: every function short-circuits
// when there's no window — never call these during render (routes read
// them in useEffect/event handlers, the repo's plan-018 hydration rule).

const TAGS_KEY = 'hdp_tags'
const PATTERNS_KEY = 'hdp_patterns'
const BROADCASTS_KEY = 'hdp_broadcasts'
const DRAFTS_KEY = 'hdp_drafts'
const REPORT_BOOKS_KEY = 'hdp_report_books'
const ANALYTICS_KEY = 'hdp_analytics'

const CURRENT_TERM = CURRENT_CYCLE.terms[0]
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

function readArray<T>(key: string): Array<T> {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as Array<T>
  } catch {
    return []
  }
}

function writeArray<T>(key: string, value: Array<T>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota exceeded or localStorage unavailable — silently ignore
  }
}

/** Seeds every collection from src/data/hdp.ts the first time it's empty. Idempotent — a second call adds nothing. */
export function seedIfEmpty(): void {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(TAGS_KEY) === null) {
    writeArray(TAGS_KEY, SEED_TAGS)
  }
  if (localStorage.getItem(PATTERNS_KEY) === null) {
    writeArray(PATTERNS_KEY, SEED_PATTERNS)
  }
  if (localStorage.getItem(BROADCASTS_KEY) === null) {
    writeArray(BROADCASTS_KEY, [SEED_BROADCAST])
  }
  if (localStorage.getItem(DRAFTS_KEY) === null) {
    writeArray(DRAFTS_KEY, SEED_DRAFTS)
  }
  if (localStorage.getItem(REPORT_BOOKS_KEY) === null) {
    writeArray(REPORT_BOOKS_KEY, SEED_REPORT_BOOKS)
  }
  if (localStorage.getItem(ANALYTICS_KEY) === null) {
    writeArray(ANALYTICS_KEY, [])
  }
}

// ── Tags ─────────────────────────────────────────────────────────────────

export function loadTags(): Array<HdpTag> {
  return readArray<HdpTag>(TAGS_KEY)
}

export interface AddTagInput {
  studentId: string
  authorId: string
  disposition: DispositionId
  context: TagContext
  note?: string
  evidenceIds?: Array<string>
  source: 'self' | 'broadcast'
  entryPoint: TagEntryPoint
}

function newTagId(): string {
  return `tag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function addTag(input: AddTagInput): HdpTag {
  const now = Date.now()
  const createdAt = new Date(now).toISOString()
  const editableUntil = new Date(now + TWENTY_FOUR_HOURS_MS).toISOString()
  const tag: HdpTag = {
    id: newTagId(),
    studentId: input.studentId,
    authorId: input.authorId,
    disposition: input.disposition,
    context: input.context,
    note: input.note,
    evidenceIds: input.evidenceIds ?? [],
    source: input.source,
    entryPoint: input.entryPoint,
    schoolYear: CURRENT_CYCLE.schoolYear,
    term: CURRENT_TERM,
    lifecycle: 'active',
    createdAt,
    editableUntil,
  }
  writeArray(TAGS_KEY, [...loadTags(), tag])
  return tag
}

function assertEditable(tag: HdpTag): void {
  if (Date.now() > new Date(tag.editableUntil).getTime()) {
    throw new Error(`Tag ${tag.id} is no longer editable (past its 24h window)`)
  }
}

export function updateTag(
  id: string,
  patch: Partial<
    Pick<HdpTag, 'disposition' | 'context' | 'note' | 'evidenceIds'>
  >,
): HdpTag {
  const tags = loadTags()
  const tag = tags.find((t) => t.id === id)
  if (!tag) throw new Error(`Unknown tag id: ${id}`)
  assertEditable(tag)
  const updated: HdpTag = { ...tag, ...patch }
  writeArray(
    TAGS_KEY,
    tags.map((t) => (t.id === id ? updated : t)),
  )
  return updated
}

export function deleteTag(id: string): void {
  const tags = loadTags()
  const tag = tags.find((t) => t.id === id)
  if (!tag) throw new Error(`Unknown tag id: ${id}`)
  assertEditable(tag)
  writeArray(
    TAGS_KEY,
    tags.filter((t) => t.id !== id),
  )
}

export function tagsForStudent(studentId: string): Array<HdpTag> {
  return loadTags().filter((t) => t.studentId === studentId)
}

export function tagsByAuthor(authorId: string): Array<HdpTag> {
  return loadTags().filter((t) => t.authorId === authorId)
}

// ── Forming patterns ─────────────────────────────────────────────────────

export function loadPatterns(): Array<FormingPattern> {
  return readArray<FormingPattern>(PATTERNS_KEY)
}

/**
 * Same disposition tagged in ≥2 distinct contexts among a student's active
 * tags (current school year) forms a candidate. Merges with any stored
 * pattern for the same student+disposition: a 'confirmed' status is kept
 * as confirmed; a 'dismissed' or 'retired-by-student' status is respected
 * by leaving the pattern out of the result entirely (it does not resurface
 * as a fresh candidate).
 */
export function detectFormingPatterns(
  studentId: string,
): Array<FormingPattern> {
  const activeTags = loadTags().filter(
    (t) =>
      t.studentId === studentId &&
      t.lifecycle === 'active' &&
      t.schoolYear === CURRENT_CYCLE.schoolYear,
  )

  const contextsByDisposition = new Map<DispositionId, Set<TagContext>>()
  const tagIdsByDisposition = new Map<DispositionId, Array<string>>()
  for (const tag of activeTags) {
    const contexts = contextsByDisposition.get(tag.disposition) ?? new Set()
    contexts.add(tag.context)
    contextsByDisposition.set(tag.disposition, contexts)
    const tagIds = tagIdsByDisposition.get(tag.disposition) ?? []
    tagIds.push(tag.id)
    tagIdsByDisposition.set(tag.disposition, tagIds)
  }

  const stored = loadPatterns().filter((p) => p.studentId === studentId)
  const results: Array<FormingPattern> = []

  for (const [disposition, contexts] of contextsByDisposition) {
    if (contexts.size < 2) continue
    const existing = stored.find((p) => p.disposition === disposition)
    if (
      existing &&
      (existing.status === 'dismissed' ||
        existing.status === 'retired-by-student')
    ) {
      continue
    }
    results.push({
      id: existing?.id ?? `pattern-${studentId}-${disposition}`,
      studentId,
      disposition,
      contexts: Array.from(contexts),
      tagIds: tagIdsByDisposition.get(disposition) ?? [],
      status: existing?.status ?? 'candidate',
      confirmedBy: existing?.confirmedBy,
      schoolYear: CURRENT_CYCLE.schoolYear,
    })
  }

  return results
}

// ── Coverage ─────────────────────────────────────────────────────────────

/**
 * Reviewed = ≥1 active tag this cycle OR an explicit nil broadcast response
 * this cycle. `reviewedNil` counts students reviewed only via a nil (no
 * tag) — the CoverageBar's "· n with nothing noted yet" note.
 */
export function coverageForClass(classId: string): CoverageSnapshot {
  const studentIds = mockStudents
    .filter((s) => s.class === classId)
    .map((s) => s.id)
  const tags = loadTags()
  const broadcasts = loadBroadcasts()

  let covered = 0
  let reviewedNil = 0
  for (const studentId of studentIds) {
    const hasActiveTag = tags.some(
      (t) =>
        t.studentId === studentId &&
        t.lifecycle === 'active' &&
        t.schoolYear === CURRENT_CYCLE.schoolYear &&
        CURRENT_CYCLE.terms.includes(t.term),
    )
    if (hasActiveTag) {
      covered += 1
      continue
    }
    const hasNil = broadcasts.some((b) =>
      b.responses.some(
        (r) =>
          r.studentId === studentId && r.result.kind === 'nothing-stood-out',
      ),
    )
    if (hasNil) {
      covered += 1
      reviewedNil += 1
    }
  }

  return { classId, total: studentIds.length, covered, reviewedNil }
}

// ── Broadcasts ───────────────────────────────────────────────────────────

export function loadBroadcasts(): Array<BroadcastRequest> {
  return readArray<BroadcastRequest>(BROADCASTS_KEY)
}

export function saveBroadcast(broadcast: BroadcastRequest): void {
  const broadcasts = loadBroadcasts()
  const index = broadcasts.findIndex((b) => b.id === broadcast.id)
  if (index === -1) {
    writeArray(BROADCASTS_KEY, [...broadcasts, broadcast])
  } else {
    writeArray(
      BROADCASTS_KEY,
      broadcasts.map((b) => (b.id === broadcast.id ? broadcast : b)),
    )
  }
}

// ── Drafts ───────────────────────────────────────────────────────────────

export function loadDrafts(): Array<HdpDraft> {
  return readArray<HdpDraft>(DRAFTS_KEY)
}

export function saveDraft(draft: HdpDraft): void {
  const drafts = loadDrafts()
  const index = drafts.findIndex((d) => d.id === draft.id)
  if (index === -1) {
    writeArray(DRAFTS_KEY, [...drafts, draft])
  } else {
    writeArray(
      DRAFTS_KEY,
      drafts.map((d) => (d.id === draft.id ? draft : d)),
    )
  }
}

// ── Report books ─────────────────────────────────────────────────────────

export function loadReportBooks(): Array<HdpReportBook> {
  return readArray<HdpReportBook>(REPORT_BOOKS_KEY)
}

export function saveReportBook(book: HdpReportBook): void {
  const books = loadReportBooks()
  const index = books.findIndex((b) => b.studentId === book.studentId)
  if (index === -1) {
    writeArray(REPORT_BOOKS_KEY, [...books, book])
  } else {
    writeArray(
      REPORT_BOOKS_KEY,
      books.map((b) => (b.studentId === book.studentId ? book : b)),
    )
  }
}

// ── Analytics ────────────────────────────────────────────────────────────

interface AnalyticsEvent {
  name: string
  at: string
  [key: string]: unknown
}

export function logEvent(
  name: string,
  payload: Record<string, unknown> = {},
): void {
  const events = readArray<AnalyticsEvent>(ANALYTICS_KEY)
  const event: AnalyticsEvent = {
    name,
    at: new Date().toISOString(),
    ...payload,
  }
  writeArray(ANALYTICS_KEY, [...events, event])
}
