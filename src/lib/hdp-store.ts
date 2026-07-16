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
  CURRENT_TEACHER,
  HDP_COLLEAGUES,
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

  // Write-through: persist any freshly-derived candidate that isn't already
  // stored, so confirmPattern/dismissPattern (id-only) always have a stored
  // row to update — this function is always called to render a PatternCard
  // before a teacher can act on it. Idempotent: skips ids already present.
  const allStored = loadPatterns()
  const newlyDerived = results.filter(
    (r) => !allStored.some((p) => p.id === r.id),
  )
  if (newlyDerived.length > 0) {
    writeArray(PATTERNS_KEY, [...allStored, ...newlyDerived])
  }

  return results
}

/** Confirms a candidate (or previously stored) pattern as a real thread. */
export function confirmPattern(id: string, teacherId: string): FormingPattern {
  const patterns = loadPatterns()
  const pattern = patterns.find((p) => p.id === id)
  if (!pattern) throw new Error(`Unknown pattern id: ${id}`)
  const updated: FormingPattern = {
    ...pattern,
    status: 'confirmed',
    confirmedBy: teacherId,
  }
  writeArray(
    PATTERNS_KEY,
    patterns.map((p) => (p.id === id ? updated : p)),
  )
  return updated
}

/** Dismisses a candidate as "not a thread" — it will not resurface. */
export function dismissPattern(id: string): FormingPattern {
  const patterns = loadPatterns()
  const pattern = patterns.find((p) => p.id === id)
  if (!pattern) throw new Error(`Unknown pattern id: ${id}`)
  const updated: FormingPattern = { ...pattern, status: 'dismissed' }
  writeArray(
    PATTERNS_KEY,
    patterns.map((p) => (p.id === id ? updated : p)),
  )
  return updated
}

// ── Visibility ───────────────────────────────────────────────────────────

/**
 * One visibility rule, used by the river and (unparameterised) by the Term
 * Summary: the form teacher of the student's class sees every active tag.
 * Anyone else sees their own tags plus tags belonging to CONFIRMED patterns
 * only — unless `fullRiver` is true (the reports-river-visibility flag,
 * resolved by the caller; this store stays React-free).
 */
export function tagsForStudentVisible(
  studentId: string,
  viewerId: string,
  fullRiver: boolean,
): Array<HdpTag> {
  const tags = tagsForStudent(studentId).filter((t) => t.lifecycle === 'active')
  const student = mockStudents.find((s) => s.id === studentId)
  const viewerIsFormTeacher =
    viewerId === CURRENT_TEACHER.id &&
    student?.class === CURRENT_TEACHER.formClassId
  if (viewerIsFormTeacher || fullRiver) return tags

  const confirmedTagIds = new Set(
    loadPatterns()
      .filter((p) => p.studentId === studentId && p.status === 'confirmed')
      .flatMap((p) => p.tagIds),
  )
  return tags.filter(
    (t) => t.authorId === viewerId || confirmedTagIds.has(t.id),
  )
}

// ── Disposition mix ──────────────────────────────────────────────────────

/** Proportions (raw counts) of the four dispositions among a tag set. */
export function dispositionMix(
  tags: Array<HdpTag>,
): Record<DispositionId, number> {
  const mix: Record<DispositionId, number> = {
    perseverance: 0,
    curiosity: 0,
    collaboration: 0,
    'self-direction': 0,
  }
  for (const tag of tags) {
    mix[tag.disposition] += 1
  }
  return mix
}

// ── Term Summary ─────────────────────────────────────────────────────────

export interface ClassSummary {
  classId: string
  isFormClass: boolean
  studentCount: number
  tagCount: number
  mostNoted: Array<{
    studentId: string
    tagCount: number
    latestNote?: string
  }>
  recentQuotes: Array<{
    tagId: string
    studentId: string
    authorId: string
    note: string
    context: TagContext
    createdAt: string
  }>
  candidatePatterns: Array<FormingPattern>
  /** Only set for the form class (P7 — no cross-class coverage view). */
  thinRecordCount?: number
}

/**
 * Per associated class (form class first), everything a teacher needs for
 * PTM prep this term — never reporting-progress language. Every input
 * (counts, most-noted, quotes, patterns) is filtered through the same rule
 * as tagsForStudentVisible: form class sees everything incl. candidate
 * patterns; teaching classes see only the viewer's own tags + confirmed-
 * pattern tags, candidates hidden. The Term Summary never surfaces a note
 * or thread the river would hide from the same viewer.
 */
export function summaryForTeacher(teacherId: string): Array<ClassSummary> {
  const formClassId =
    teacherId === CURRENT_TEACHER.id ? CURRENT_TEACHER.formClassId : undefined
  const teachingClasses =
    teacherId === CURRENT_TEACHER.id
      ? CURRENT_TEACHER.teachingClasses
      : (HDP_COLLEAGUES.find((c) => c.id === teacherId)?.teachingClasses ?? [])
  const classIds = formClassId
    ? [formClassId, ...teachingClasses.filter((c) => c !== formClassId)]
    : teachingClasses

  return classIds.map((classId): ClassSummary => {
    const isFormClass = classId === formClassId
    const studentIds = mockStudents
      .filter((s) => s.class === classId)
      .map((s) => s.id)

    const visibleTagsByStudent = new Map<string, Array<HdpTag>>()
    for (const studentId of studentIds) {
      const visible = tagsForStudentVisible(studentId, teacherId, false).filter(
        (t) => t.term === CURRENT_TERM,
      )
      visibleTagsByStudent.set(studentId, visible)
    }

    const allVisibleTags = Array.from(visibleTagsByStudent.values()).flat()

    const mostNoted = studentIds
      .map((studentId) => {
        const tags = visibleTagsByStudent.get(studentId) ?? []
        const newest = tags.reduce<HdpTag | undefined>((latest, t) => {
          if (!latest) return t
          return new Date(t.createdAt) > new Date(latest.createdAt) ? t : latest
        }, undefined)
        return {
          studentId,
          tagCount: tags.length,
          latestNote: newest?.note,
        }
      })
      .filter((s) => s.tagCount > 0)
      .sort((a, b) => b.tagCount - a.tagCount)
      .slice(0, 3)

    const recentQuotes = allVisibleTags
      .filter((t) => t.note)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 3)
      .map((t) => ({
        tagId: t.id,
        studentId: t.studentId,
        authorId: t.authorId,
        note: t.note ?? '',
        context: t.context,
        createdAt: t.createdAt,
      }))

    const candidatePatterns = isFormClass
      ? studentIds
          .flatMap((studentId) => detectFormingPatterns(studentId))
          .filter((p) => p.status === 'candidate')
      : []

    const thinRecordCount = isFormClass
      ? (() => {
          const snapshot = coverageForClass(classId)
          return snapshot.total - snapshot.covered
        })()
      : undefined

    return {
      classId,
      isFormClass,
      studentCount: studentIds.length,
      tagCount: allVisibleTags.length,
      mostNoted,
      recentQuotes,
      candidatePatterns,
      thinRecordCount,
    }
  })
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

// ── Draft Studio / Review & Sync (plan 032) ─────────────────────────────

/** Finds a student's draft of a given kind (and subject, for `kind: 'subject'`). */
export function findDraft(
  studentId: string,
  kind: 'subject' | 'overall',
  subject?: string,
): HdpDraft | undefined {
  return loadDrafts().find(
    (d) =>
      d.studentId === studentId &&
      d.kind === kind &&
      (kind === 'subject' ? d.subject === subject : true),
  )
}

/** Deterministic id for a brand-new draft — findDraft always checks first,
 *  so an existing seeded draft (e.g. 'draft-1') is reused rather than
 *  shadowed by a fresh id. */
export function draftId(
  studentId: string,
  kind: 'subject' | 'overall',
  subject?: string,
): string {
  return kind === 'subject'
    ? `draft-${studentId}-subject-${subject ?? 'none'}`
    : `draft-${studentId}-overall`
}

/** Confirms a draft — freezes its claims and their sources for the report
 *  book. Reversible via reopenDraft before release. */
export function confirmDraft(id: string): HdpDraft {
  const drafts = loadDrafts()
  const draft = drafts.find((d) => d.id === id)
  if (!draft) throw new Error(`Unknown draft id: ${id}`)
  const updated: HdpDraft = { ...draft, status: 'confirmed' }
  writeArray(
    DRAFTS_KEY,
    drafts.map((d) => (d.id === id ? updated : d)),
  )
  return updated
}

/** Reopens a confirmed draft for further editing. Clears `syncedAt` — a
 *  reopened draft's claims may change, so it needs to be reviewed and
 *  re-synced before it's trusted again. */
export function reopenDraft(id: string): HdpDraft {
  const drafts = loadDrafts()
  const draft = drafts.find((d) => d.id === id)
  if (!draft) throw new Error(`Unknown draft id: ${id}`)
  const updated: HdpDraft = { ...draft, status: 'draft', syncedAt: undefined }
  writeArray(
    DRAFTS_KEY,
    drafts.map((d) => (d.id === id ? updated : d)),
  )
  return updated
}

/** Confirmed drafts not yet marked synced — Review & Sync's unsynced count. */
export function unsyncedConfirmedDrafts(): Array<HdpDraft> {
  return loadDrafts().filter((d) => d.status === 'confirmed' && !d.syncedAt)
}

/** Marks a set of confirmed drafts as synced with School Cockpit (mock — no
 *  real Cockpit integration in this prototype). */
export function markSynced(draftIds: Array<string>): void {
  const now = new Date().toISOString()
  const drafts = loadDrafts()
  writeArray(
    DRAFTS_KEY,
    drafts.map((d) => (draftIds.includes(d.id) ? { ...d, syncedAt: now } : d)),
  )
}
