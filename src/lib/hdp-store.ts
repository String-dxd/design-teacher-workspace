import type {
  BroadcastRequest,
  BroadcastResponse,
  CoverageSnapshot,
  DispositionId,
  DraftClaim,
  FormingPattern,
  HdpDraft,
  HdpMarkEntry,
  HdpMarksRecord,
  HdpReportBook,
  HdpTag,
  SchoolYear,
  Semester,
  StudentReflection,
  TagContext,
  TagEntryPoint,
} from '@/types/hdp'
import { mockStudents } from '@/data/mock-students'
import {
  CURRENT_CYCLE,
  CURRENT_TEACHER,
  HDP_COLLEAGUES,
  SEED_BROADCAST,
  SEED_BROADCAST_FOR_TEACHER,
  SEED_DRAFTS,
  SEED_MARKS,
  SEED_PATTERNS,
  SEED_REFLECTIONS,
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
const MARKS_KEY = 'hdp_marks'
const REFLECTIONS_KEY = 'hdp_reflections'

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
    writeArray(BROADCASTS_KEY, [SEED_BROADCAST, SEED_BROADCAST_FOR_TEACHER])
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
  if (localStorage.getItem(MARKS_KEY) === null) {
    writeArray(MARKS_KEY, SEED_MARKS)
  }
  if (localStorage.getItem(REFLECTIONS_KEY) === null) {
    writeArray(REFLECTIONS_KEY, SEED_REFLECTIONS)
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
    // 'dismissed' means "not a thread" — it never resurfaces as a fresh
    // candidate. 'retired-by-student' is different (plan 041): the teacher-
    // facing record is UNCHANGED, so a retired pattern still comes back
    // here (with its retired status intact) for the river/PatternCard to
    // render its quiet "hidden from the family report" line.
    if (existing?.status === 'dismissed') continue
    results.push({
      id: existing?.id ?? `pattern-${studentId}-${disposition}`,
      studentId,
      disposition,
      contexts: Array.from(contexts),
      tagIds: tagIdsByDisposition.get(disposition) ?? [],
      status: existing?.status ?? 'candidate',
      confirmedBy: existing?.confirmedBy,
      schoolYear: CURRENT_CYCLE.schoolYear,
      headline: existing?.headline,
      studentNote: existing?.studentNote,
      studentReaction: existing?.studentReaction,
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

// ── Student pattern reactions + light curation (plan 041, Prototype B) ──

/** Freezes a student-facing write once their report book has been shared
 *  with parents — the same rule `submitStudentReflection` already applies
 *  to reflections. */
function assertPatternActionAllowed(studentId: string, action: string): void {
  const book = loadReportBooks().find((b) => b.studentId === studentId)
  if (book?.sharedAt) {
    throw new Error(
      `Cannot ${action} for ${studentId}: already shared with parents`,
    )
  }
}

/**
 * Records the student's reaction to a validated (confirmed) pattern —
 * "Agree" / "It's more complicated" / "Add my side" — with an optional
 * note (≤300 chars, enforced at the composer). `agree` may omit the note;
 * the other two reactions prompt for one but never require it. One
 * reaction per pattern; changeable until the student's report book is
 * shared with parents, same freeze rule as `submitStudentReflection`.
 */
export function reactToPattern(
  patternId: string,
  reaction: 'agree' | 'more-complicated' | 'add-my-side',
  note?: string,
): FormingPattern {
  const patterns = loadPatterns()
  const pattern = patterns.find((p) => p.id === patternId)
  if (!pattern) throw new Error(`Unknown pattern id: ${patternId}`)
  assertPatternActionAllowed(pattern.studentId, 'react to a pattern')
  const updated: FormingPattern = {
    ...pattern,
    studentReaction: reaction,
    studentNote: note,
  }
  writeArray(
    PATTERNS_KEY,
    patterns.map((p) => (p.id === patternId ? updated : p)),
  )
  return updated
}

/**
 * Hides a confirmed pattern from the family-facing story register (Act 2
 * light curation, PRD F5). The teacher-facing record is UNCHANGED —
 * `loadPatterns`/`detectFormingPatterns` still return the pattern, now
 * carrying `status: 'retired-by-student'`, so the river renders it with a
 * quiet "hidden from the family report by {name}" line rather than
 * dropping it. Only a confirmed pattern can be retired (candidates never
 * reach the story register in the first place). Frozen once shared.
 */
export function retirePatternFromFamily(patternId: string): FormingPattern {
  const patterns = loadPatterns()
  const pattern = patterns.find((p) => p.id === patternId)
  if (!pattern) throw new Error(`Unknown pattern id: ${patternId}`)
  if (pattern.status !== 'confirmed') {
    throw new Error(
      `Cannot retire pattern ${patternId}: only confirmed patterns can be hidden`,
    )
  }
  assertPatternActionAllowed(pattern.studentId, 'retire a pattern')
  const updated: FormingPattern = { ...pattern, status: 'retired-by-student' }
  writeArray(
    PATTERNS_KEY,
    patterns.map((p) => (p.id === patternId ? updated : p)),
  )
  return updated
}

/** Restores a pattern the student previously retired from the family
 *  report — back to `confirmed`, the only status retire is reachable
 *  from. */
export function restorePattern(patternId: string): FormingPattern {
  const patterns = loadPatterns()
  const pattern = patterns.find((p) => p.id === patternId)
  if (!pattern) throw new Error(`Unknown pattern id: ${patternId}`)
  if (pattern.status !== 'retired-by-student') {
    throw new Error(`Cannot restore pattern ${patternId}: it is not retired`)
  }
  assertPatternActionAllowed(pattern.studentId, 'restore a pattern')
  const updated: FormingPattern = { ...pattern, status: 'confirmed' }
  writeArray(
    PATTERNS_KEY,
    patterns.map((p) => (p.id === patternId ? updated : p)),
  )
  return updated
}

/**
 * True once the student's cover reflection (`coverReflection`) has at
 * least three sentences — the gate that unlocks "Share with parents" in
 * Release (plan 041). Sentences are split on `.?!`, trimmed, and empty
 * fragments discarded, so trailing punctuation/whitespace never inflates
 * the count.
 */
export function reflectionGatesShare(studentId: string): boolean {
  const reflection = coverReflection(studentId)
  if (!reflection) return false
  const sentences = reflection.text
    .split(/[.?!]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  return sentences.length >= 3
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

// ── Student reflections (plan 037) ──────────────────────────────────────

/** All reflections recorded for a student (usually zero or one — plan 038
 *  writes through this same signature when students can add their own). */
export function loadReflections(studentId: string): Array<StudentReflection> {
  return readArray<StudentReflection>(REFLECTIONS_KEY).filter(
    (r) => r.studentId === studentId,
  )
}

/** Appends a reflection for a student. Keeps the signature plan 038 writes
 *  through — no upsert-by-id here since a student may write more than one
 *  over time; `chosenAsCover` picks which one the story register leads
 *  with. */
export function saveReflection(reflection: StudentReflection): void {
  const all = readArray<StudentReflection>(REFLECTIONS_KEY)
  writeArray(REFLECTIONS_KEY, [...all, reflection])
}

/** The reflection the story register's cover renders — the one marked
 *  `chosenAsCover`, else the most recently written, else undefined (no
 *  fabricated quote — the cover falls back to an honest "No reflection
 *  yet" line). */
export function coverReflection(
  studentId: string,
): StudentReflection | undefined {
  const reflections = loadReflections(studentId)
  const chosen = reflections.find((r) => r.chosenAsCover)
  if (chosen) return chosen
  return [...reflections].sort((a, b) =>
    b.writtenAt.localeCompare(a.writtenAt),
  )[0]
}

// ── Student-first release (plan 038, Prototype B Act 1) ─────────────────

const STUDENT_GUEST_TOKEN_PREFIX = 'hdp-student-'

/** Deterministic mock token for a student's OWN report link — distinct
 *  prefix from the parent token (`hdp-{studentId}`) so the two guest routes
 *  never collide on the same string. */
function tokenForStudentRelease(studentId: string): string {
  return `${STUDENT_GUEST_TOKEN_PREFIX}${studentId}`
}

/**
 * Releases a student's report book to the student themselves — Act 1 of the
 * staged release. Requires a confirmed overall draft (same precondition as
 * `shareReportBook`); throws otherwise, same as sharing with parents.
 * Stamps `studentReleasedAt`. Idempotent id: the token is deterministic, so
 * releasing twice just re-stamps the same book (no duplicate rows).
 */
export function releaseToStudent(studentId: string): { token: string } {
  const overallDraft = findDraft(studentId, 'overall')
  if (!overallDraft || overallDraft.status !== 'confirmed') {
    throw new Error(
      `Cannot release to student ${studentId}: no confirmed overall draft`,
    )
  }
  const books = loadReportBooks()
  const existing = books.find((b) => b.studentId === studentId)
  if (!existing) {
    throw new Error(`No report book found for student ${studentId}`)
  }
  saveReportBook({ ...existing, studentReleasedAt: new Date().toISOString() })
  return { token: tokenForStudentRelease(studentId) }
}

/** Looks up a report book by its student-release guest token — only ever
 *  resolves a book that has actually been released to the student
 *  (`studentReleasedAt` set); an unknown or not-yet-released token renders
 *  the guest route's calm "not valid" state, same convention as
 *  `bookByToken`. */
export function bookByStudentToken(token: string): HdpReportBook | undefined {
  if (!token.startsWith(STUDENT_GUEST_TOKEN_PREFIX)) return undefined
  const studentId = token.slice(STUDENT_GUEST_TOKEN_PREFIX.length)
  const book = loadReportBooks().find((b) => b.studentId === studentId)
  return book?.studentReleasedAt ? book : undefined
}

/**
 * Submits (or replaces) the student's own reflection on their report — the
 * one they write themselves at their release link, distinct from a
 * teacher's or parent's. Writes through `saveReflection` (plan 037): the
 * student's FIRST reflection is marked `chosenAsCover` (it becomes the
 * story register's cover quote); a second submission replaces it in place
 * (edit, not append) and keeps whatever cover status the first one had.
 * Stamps `studentReactedAt` on the book. Throws once the book has been
 * shared with parents — the reflection freezes at share, same rule as the
 * report book's own snapshot semantics.
 */
export function submitStudentReflection(token: string, text: string): void {
  const book = bookByStudentToken(token)
  if (!book) throw new Error(`Unknown or unreleased student token: ${token}`)
  if (book.sharedAt) {
    throw new Error(
      `Cannot submit a reflection for ${book.studentId}: already shared with parents`,
    )
  }

  // The student has at most one reflection of their own at a time — a
  // resubmit replaces it in place (edit), it never appends a second row.
  // `chosenAsCover` carries forward from whatever they had before (it's
  // `true` the first time, since it's their only reflection).
  const previous = coverReflection(book.studentId)
  const chosenAsCover = previous?.chosenAsCover ?? true
  const others = readArray<StudentReflection>(REFLECTIONS_KEY).filter(
    (r) => r.studentId !== book.studentId,
  )
  const reflection: StudentReflection = {
    studentId: book.studentId,
    text,
    writtenAt: new Date().toISOString(),
    chosenAsCover,
  }
  writeArray(REFLECTIONS_KEY, [...others, reflection])

  saveReportBook({ ...book, studentReactedAt: new Date().toISOString() })
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

// ── Broadcast lifecycle (plan 031) ──────────────────────────────────────
// Research-tunable constants — keep as named exports so a later tuning
// pass never has to hunt through the function body for a magic number.

export const BROADCAST_COOLDOWN_DAYS = 7
export const MAX_OUTSTANDING_PER_CLASS = 1

const SEVEN_DAYS_MS = BROADCAST_COOLDOWN_DAYS * 24 * 60 * 60 * 1000

export type CanBroadcastResult =
  | { ok: true }
  | { ok: false; reason: 'outstanding' | 'cooldown'; until?: string }

/**
 * A broadcast is "outstanding" while any of its recipients has given zero
 * responses at all — a recipient who has answered for at least one student
 * has engaged with the request, even if other students on the list haven't
 * been individually covered yet (a group ask, not a per-student checklist).
 */
function hasUnansweredRecipient(broadcast: BroadcastRequest): boolean {
  return broadcast.recipientIds.some(
    (recipientId) =>
      !broadcast.responses.some((r) => r.recipientId === recipientId),
  )
}

function latestBroadcastForClass(
  formClassId: string,
): BroadcastRequest | undefined {
  const forClass = loadBroadcasts().filter((b) => b.formClassId === formClassId)
  if (forClass.length === 0) return undefined
  return forClass.reduce((latest, b) =>
    new Date(b.createdAt) > new Date(latest.createdAt) ? b : latest,
  )
}

/**
 * Guardrail from docs/decisions/reports-hdp.md: 1 outstanding broadcast per
 * form class with a 7-day cooldown. Checked against the class's most recent
 * broadcast only — MAX_OUTSTANDING_PER_CLASS is always 1 in this prototype,
 * so "the latest one is still open" is equivalent to "the limit is hit".
 */
export function canBroadcast(formClassId: string): CanBroadcastResult {
  const latest = latestBroadcastForClass(formClassId)
  if (!latest) return { ok: true }

  if (hasUnansweredRecipient(latest)) {
    return { ok: false, reason: 'outstanding' }
  }

  const cooldownUntilMs = new Date(latest.createdAt).getTime() + SEVEN_DAYS_MS
  if (Date.now() < cooldownUntilMs) {
    return {
      ok: false,
      reason: 'cooldown',
      until: new Date(cooldownUntilMs).toISOString(),
    }
  }

  return { ok: true }
}

function newBroadcastId(): string {
  return `broadcast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export interface CreateBroadcastInput {
  formClassId: string
  requesterId: string
  studentIds: Array<string>
  recipientIds: Array<string>
  message: string
}

/** Throws if `canBroadcast(formClassId)` is currently false — callers show
 *  the cooldown/outstanding explanation and never call this while blocked. */
export function createBroadcast(input: CreateBroadcastInput): BroadcastRequest {
  const check = canBroadcast(input.formClassId)
  if (!check.ok) {
    throw new Error(
      `Cannot broadcast for ${input.formClassId}: ${check.reason}`,
    )
  }
  const broadcast: BroadcastRequest = {
    id: newBroadcastId(),
    formClassId: input.formClassId,
    requesterId: input.requesterId,
    studentIds: input.studentIds,
    recipientIds: input.recipientIds,
    message: input.message,
    createdAt: new Date().toISOString(),
    responses: [],
  }
  saveBroadcast(broadcast)
  return broadcast
}

export type BroadcastResponseResult =
  | { kind: 'tag'; tagInput: Omit<AddTagInput, 'source'> }
  | { kind: 'nothing-stood-out' }

/**
 * Records a colleague's answer to one (recipient, student) pair on a
 * broadcast. A tag answer creates the tag first (via addTag, stamped
 * `source: 'broadcast'`) and stores only its id on the response — the
 * response is a reference, the tag itself is the single source of truth
 * (same shape the river and coverageForClass already read).
 */
export function respondToBroadcast(
  broadcastId: string,
  recipientId: string,
  studentId: string,
  result: BroadcastResponseResult,
): BroadcastResponse {
  const broadcasts = loadBroadcasts()
  const broadcast = broadcasts.find((b) => b.id === broadcastId)
  if (!broadcast) throw new Error(`Unknown broadcast id: ${broadcastId}`)

  const response: BroadcastResponse =
    result.kind === 'tag'
      ? {
          recipientId,
          studentId,
          result: {
            kind: 'tag',
            tagId: addTag({ ...result.tagInput, source: 'broadcast' }).id,
          },
          respondedAt: new Date().toISOString(),
        }
      : {
          recipientId,
          studentId,
          result: { kind: 'nothing-stood-out' },
          respondedAt: new Date().toISOString(),
        }

  saveBroadcast({ ...broadcast, responses: [...broadcast.responses, response] })
  return response
}

/**
 * The nil ("Nothing stood out") responses on record for a student, across
 * every broadcast — feeds the "reviewed — nothing noted (teacher, date)"
 * roster marker (already consumed inline by 030's /reports/students roster;
 * this is the same rule as a named export for 031's own diagnostic table
 * and responder section).
 */
export function nilsForStudent(studentId: string): Array<BroadcastResponse> {
  return loadBroadcasts()
    .flatMap((b) => b.responses)
    .filter(
      (r) => r.studentId === studentId && r.result.kind === 'nothing-stood-out',
    )
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

/** Drops claims whose text is empty or whitespace-only — a blank "your
 *  addition" sentence (e.g. from "Add a sentence" left untouched) carries
 *  no content and should never persist into a confirmed draft or a shared
 *  report book. Applied at every point claims are frozen/snapshotted:
 *  confirmDraft and shareReportBook. */
function nonBlankClaims(claims: Array<DraftClaim>): Array<DraftClaim> {
  return claims.filter((c) => c.text.trim().length > 0)
}

/** Confirms a draft — freezes its claims and their sources for the report
 *  book, dropping any blank-text claims first (empty "your addition"
 *  sentences never make it into a confirmed draft). Reversible via
 *  reopenDraft before release. */
export function confirmDraft(id: string): HdpDraft {
  const drafts = loadDrafts()
  const draft = drafts.find((d) => d.id === id)
  if (!draft) throw new Error(`Unknown draft id: ${id}`)
  const updated: HdpDraft = {
    ...draft,
    claims: nonBlankClaims(draft.claims),
    status: 'confirmed',
    confirmedAt: new Date().toISOString(),
  }
  writeArray(
    DRAFTS_KEY,
    drafts.map((d) => (d.id === id ? updated : d)),
  )
  return updated
}

/** Reopens a confirmed draft for further editing. Clears `confirmedAt` and
 *  `syncedAt` — a reopened draft's claims may change, so it needs to be
 *  reviewed, reconfirmed, and re-synced before it's trusted again. */
export function reopenDraft(id: string): HdpDraft {
  const drafts = loadDrafts()
  const draft = drafts.find((d) => d.id === id)
  if (!draft) throw new Error(`Unknown draft id: ${id}`)
  const updated: HdpDraft = {
    ...draft,
    status: 'draft',
    confirmedAt: undefined,
    syncedAt: undefined,
  }
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

// ── Report book sharing + acknowledgement (plan 033) ────────────────────

const GUEST_TOKEN_PREFIX = 'hdp-'
const PARENT_NOTE_MAX_LENGTH = 500

/** Deterministic mock token for a student's report book — matches the
 *  legacy guest route's "by-design mock, no real data" convention (no
 *  crypto; a real pilot needs real tokens + auth, flagged not built). */
function tokenForStudent(studentId: string): string {
  return `${GUEST_TOKEN_PREFIX}${studentId}`
}

/** Assembles the `overallComment` + `subjectComments` a book would get if
 *  shared right now — snapshotting the CONFIRMED drafts (overall + subject)
 *  for this student — without persisting anything. Shared by `shareReportBook`
 *  (which freezes this into the saved book) and `previewReportBook` (which
 *  hands it to the teacher-facing Preview so it never drifts from what
 *  `shareReportBook` would actually produce). */
function assembleComments(studentId: string): {
  overallComment: HdpReportBook['overallComment']
  subjectComments: HdpReportBook['subjectComments']
} {
  const overallDraft = findDraft(studentId, 'overall')
  const overallComment =
    overallDraft && overallDraft.status === 'confirmed'
      ? {
          authorId: overallDraft.authorId,
          claims: nonBlankClaims(overallDraft.claims).map((c) => ({ ...c })),
          // Prototype B (plan 040): carried over only when the source draft
          // was actually composed via the insight layer — an A-path draft's
          // `insightIds` is undefined, so this stays undefined too.
          insightIds: overallDraft.insightIds?.length
            ? [...overallDraft.insightIds]
            : undefined,
        }
      : undefined

  const subjectComments = loadDrafts()
    .filter(
      (d) =>
        d.studentId === studentId &&
        d.kind === 'subject' &&
        d.status === 'confirmed' &&
        d.subject,
    )
    .map((d) => ({
      subject: d.subject as string,
      authorId: d.authorId,
      claims: nonBlankClaims(d.claims).map((c) => ({ ...c })),
      insightIds: d.insightIds?.length ? [...d.insightIds] : undefined,
    }))

  return { overallComment, subjectComments }
}

/**
 * Shares a student's report book with parents: snapshots the CONFIRMED
 * drafts (overall + subject) for this student into the book's comments —
 * the book is frozen content from this point, not a live view of drafts,
 * so editing/reopening the source draft afterwards never changes what a
 * parent already has a link to. A student with no confirmed drafts still
 * shares a results-only book (comments stay absent, not "undefined").
 * Throws if no report book exists yet for the student (nothing to share).
 */
export function shareReportBook(studentId: string): { token: string } {
  const books = loadReportBooks()
  const existing = books.find((b) => b.studentId === studentId)
  if (!existing) {
    throw new Error(`No report book found for student ${studentId}`)
  }

  const { overallComment, subjectComments } = assembleComments(studentId)

  const updated: HdpReportBook = {
    ...existing,
    overallComment,
    subjectComments,
    sharedAt: new Date().toISOString(),
  }
  saveReportBook(updated)
  return { token: tokenForStudent(studentId) }
}

/**
 * The teacher-facing Preview's data source: what a parent would actually see
 * if this book were shared right now. Once a book has been shared, its
 * stored comments are already the frozen truth (editing a draft afterwards
 * must NOT change what a parent with a live link sees), so this simply
 * returns the stored book unchanged. Before sharing, the stored book's
 * comments are still empty (only `shareReportBook` populates them), so this
 * assembles the same CONFIRMED-drafts snapshot `shareReportBook` would
 * produce — without persisting it — so Preview never omits sections (like
 * "Personal qualities") that the real parent link would show. Returns
 * `undefined` if no report book exists yet for the student.
 */
export function previewReportBook(
  studentId: string,
): HdpReportBook | undefined {
  const book = loadReportBooks().find((b) => b.studentId === studentId)
  if (!book) return undefined
  if (book.sharedAt) return book

  const { overallComment, subjectComments } = assembleComments(studentId)
  return { ...book, overallComment, subjectComments }
}

/** Looks up a report book by its guest token — only ever resolves a book
 *  that has actually been shared (sharedAt set); an unshared or unknown
 *  token renders the guest route's calm "not valid" state. */
export function bookByToken(token: string): HdpReportBook | undefined {
  if (!token.startsWith(GUEST_TOKEN_PREFIX)) return undefined
  const studentId = token.slice(GUEST_TOKEN_PREFIX.length)
  const book = loadReportBooks().find((b) => b.studentId === studentId)
  return book?.sharedAt ? book : undefined
}

/**
 * Records a parent's acknowledgement of a shared report book — replaces the
 * printed signature slip. First acknowledgement wins: once `acknowledgement`
 * is set, later calls with no note yet supplied fill in the one-shot note
 * (the "Acknowledge" button and the later "Send note" action are two
 * separate calls into this same function); once a note is present, further
 * calls change nothing (idempotent, PRD Act 3 — one note only).
 */
export function acknowledgeReport(token: string, note?: string): HdpReportBook {
  const book = bookByToken(token)
  if (!book) throw new Error(`Unknown or unshared report token: ${token}`)

  const trimmed = note?.trim()
  const clippedNote = trimmed
    ? trimmed.slice(0, PARENT_NOTE_MAX_LENGTH)
    : undefined

  let updated: HdpReportBook
  if (!book.acknowledgement) {
    updated = {
      ...book,
      acknowledgement: { at: new Date().toISOString(), note: clippedNote },
    }
  } else if (!book.acknowledgement.note && clippedNote) {
    updated = {
      ...book,
      acknowledgement: { ...book.acknowledgement, note: clippedNote },
    }
  } else {
    return book
  }
  saveReportBook(updated)
  return updated
}

// ── Marks + academic-results sync (plan 036) ────────────────────────────

/** All mark entries recorded for a student, across every subject/semester. */
export function loadMarks(studentId: string): Array<HdpMarkEntry> {
  const records = readArray<HdpMarksRecord>(MARKS_KEY)
  return records.find((r) => r.studentId === studentId)?.entries ?? []
}

function saveMarksForStudent(
  studentId: string,
  entries: Array<HdpMarkEntry>,
): void {
  const records = readArray<HdpMarksRecord>(MARKS_KEY)
  const index = records.findIndex((r) => r.studentId === studentId)
  const record: HdpMarksRecord = { studentId, entries }
  if (index === -1) {
    writeArray(MARKS_KEY, [...records, record])
  } else {
    writeArray(
      MARKS_KEY,
      records.map((r) => (r.studentId === studentId ? record : r)),
    )
  }
}

/**
 * Upserts one mark entry for a student — matched on subject + schoolYear +
 * semester + assessment (all four; two entries that only share
 * subject/semester but land in different school years must NOT collide).
 * Autosaved on blur from the marks grid.
 */
export function saveMarkEntry(studentId: string, entry: HdpMarkEntry): void {
  const existing = loadMarks(studentId)
  const index = existing.findIndex(
    (e) =>
      e.subject === entry.subject &&
      e.schoolYear === entry.schoolYear &&
      e.semester === entry.semester &&
      e.assessment === entry.assessment,
  )
  const next =
    index === -1
      ? [...existing, entry]
      : existing.map((e, i) => (i === index ? entry : e))
  saveMarksForStudent(studentId, next)
}

/** The mean score across whichever assessments (WA1/WA2/Exam) are recorded
 *  for a subject in a given school year + semester. Returns undefined when
 *  nothing is recorded yet — callers skip that semester rather than
 *  treating it as a zero. */
export function semesterAverage(
  entries: Array<HdpMarkEntry>,
  subject: string,
  schoolYear: SchoolYear,
  semester: Semester,
): number | undefined {
  const matches = entries.filter(
    (e) =>
      e.subject === subject &&
      e.schoolYear === schoolYear &&
      e.semester === semester,
  )
  if (matches.length === 0) return undefined
  return matches.reduce((sum, e) => sum + e.score, 0) / matches.length
}

function previousSemester(
  schoolYear: SchoolYear,
  semester: Semester,
): { schoolYear: SchoolYear; semester: Semester } {
  if (semester === 2) return { schoolYear, semester: 1 }
  return {
    schoolYear: String(Number(schoolYear) - 1) as SchoolYear,
    semester: 2,
  }
}

/**
 * Snapshots the CURRENT semester's per-subject mark averages into a
 * student's report book `results` — grade is the rounded average as a
 * string, `change` is the delta vs the previous semester's average (signed,
 * absent when there's no previous-semester data to compare against), `term`
 * is the later of the two terms in the current cycle. Stamps
 * `marksSyncedAt`. Snapshot semantics identical to `shareReportBook`: a
 * later `saveMarkEntry` does not mutate an already-synced book until this
 * is called again. Throws if no report book exists yet for the student
 * (nothing to sync into).
 */
export function syncAcademicResults(studentId: string): HdpReportBook {
  const books = loadReportBooks()
  const existing = books.find((b) => b.studentId === studentId)
  if (!existing) {
    throw new Error(`No report book found for student ${studentId}`)
  }

  const { schoolYear, semester } = CURRENT_CYCLE
  const currentTerm = CURRENT_CYCLE.terms[1]
  const prev = previousSemester(schoolYear, semester)
  const entries = loadMarks(studentId)
  const subjects = Array.from(new Set(entries.map((e) => e.subject)))

  const syncedResults = subjects
    .map((subject) => {
      const avg = semesterAverage(entries, subject, schoolYear, semester)
      if (avg === undefined) return undefined
      const prevAvg = semesterAverage(
        entries,
        subject,
        prev.schoolYear,
        prev.semester,
      )
      const change =
        prevAvg === undefined ? undefined : Math.round(avg - prevAvg)
      return {
        subject,
        term: currentTerm,
        grade: String(Math.round(avg)),
        change,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== undefined)

  const untouchedResults = existing.results.filter(
    (r) => !(r.term === currentTerm && subjects.includes(r.subject)),
  )

  const updated: HdpReportBook = {
    ...existing,
    results: [...untouchedResults, ...syncedResults],
    marksSyncedAt: new Date().toISOString(),
  }
  saveReportBook(updated)
  return updated
}
