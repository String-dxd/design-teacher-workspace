export type DispositionId =
  | 'perseverance'
  | 'curiosity'
  | 'collaboration'
  | 'self-direction'
export type TagContext = 'lesson' | 'marking' | 'cca' | 'form-time' | 'other'
export type SchoolYear = `${number}`
export type HdpTerm = 1 | 2 | 3 | 4
export type Semester = 1 | 2
export type CycleStage =
  | 'observing'
  | 'window-open'
  | 'drafting'
  | 'review'
  | 'released'
export type TagEntryPoint = 'fab' | 'topbar' | 'row' | 'cmdk' // cmdk reserved, unused this round
export type AssessmentKind = 'wa1' | 'wa2' | 'exam'
export type TrendDirection = 'climbing' | 'steady' | 'recovering' | 'easing'

export interface HdpTag {
  id: string
  studentId: string
  authorId: string
  disposition: DispositionId
  context: TagContext
  note?: string // ≤140 chars, enforced at the composer
  evidenceIds: Array<string>
  source: 'self' | 'broadcast'
  entryPoint: TagEntryPoint
  schoolYear: SchoolYear
  term: HdpTerm
  lifecycle: 'active' | 'archived' | 'retired-by-student'
  createdAt: string
  editableUntil: string // createdAt + 24h
}

export interface FormingPattern {
  id: string
  studentId: string
  disposition: DispositionId
  contexts: Array<TagContext> // ≥2 distinct
  tagIds: Array<string>
  status: 'candidate' | 'confirmed' | 'dismissed' | 'retired-by-student'
  confirmedBy?: string
  schoolYear: SchoolYear
  /** The story register's chapter claim, e.g. "Keeps coming back to hard
   *  problems" — behaviour phrasing, never trait words (plan 037). Only
   *  meaningful when status === 'confirmed'. */
  headline?: string
  /** The story register's "{FirstName} adds" annotation — the student's own
   *  note on a validated pattern (plan 037). Only meaningful when status
   *  === 'confirmed'. */
  studentNote?: string
  /** The student's reaction to a validated pattern — "Agree" / "It's more
   *  complicated" / "Add my side" (plan 041). `agree` may pair with no
   *  note; the other two prompt for one via `studentNote` but never
   *  require it. Changeable until the report book is shared with parents. */
  studentReaction?: 'agree' | 'more-complicated' | 'add-my-side'
}

export interface BroadcastRequest {
  id: string
  formClassId: string
  requesterId: string
  studentIds: Array<string>
  recipientIds: Array<string>
  message: string
  createdAt: string
  responses: Array<BroadcastResponse>
}

export interface BroadcastResponse {
  recipientId: string
  studentId: string
  result: { kind: 'tag'; tagId: string } | { kind: 'nothing-stood-out' }
  respondedAt: string
}

export interface DraftClaim {
  id?: string // stable React key across reorders (plan 048) — absent on legacy stored/snapshotted claims
  text: string
  source?: { tagId: string; label: string } // absent ⇒ rendered "your addition"
  edited?: boolean // teacher edited a sourced sentence — popover notes it (plan 032)
}

export interface HdpDraft {
  id: string
  studentId: string
  kind: 'subject' | 'overall'
  subject?: string // set when kind === 'subject'
  authorId: string
  claims: Array<DraftClaim>
  status: 'draft' | 'confirmed'
  confirmedAt?: string // set when status transitions to 'confirmed' (plan 032)
  syncedAt?: string // set by Review & Sync (plan 032)
  /** The teacher's curated selection when this draft was composed via
   *  Prototype B's insight layer (plan 040, `reports-hdp-future` only).
   *  Absent for A-path (composeDraft) drafts. */
  insightIds?: Array<string>
  /** F4b reconcile gate outcome, recorded on Confirm (plan 040,
   *  `reports-hdp-future` only). Absent when the gate never ran (A path or
   *  flag off). */
  reconcile?: { fired: boolean; resolution?: 'revised' | 'kept-with-context' }
}

export interface CoverageSnapshot {
  classId: string
  total: number
  covered: number // ≥1 active tag OR explicit nil this term — UI copy says "reviewed"
  reviewedNil: number
}

// ── A1 parent-facing report book (fresh fixtures, no legacy imports) ──
export interface HdpSubjectResult {
  subject: string
  term: HdpTerm
  grade: string // realistic format, e.g. 'B4', '72'
  remark?: string
  change?: number // delta vs previous semester's semester-average, signed (plan 036)
}

export interface HdpReportBook {
  studentId: string
  schoolYear: SchoolYear
  semester: Semester
  results: Array<HdpSubjectResult>
  attendance: { present: number; total: number }
  conduct: string
  overallComment?: {
    claims: Array<DraftClaim>
    authorId: string
    /** Snapshotted from the source draft's `insightIds` at share time (plan
     *  040) — present + non-empty only when that draft was composed via
     *  Prototype B's insight layer. */
    insightIds?: Array<string>
  }
  subjectComments: Array<{
    subject: string
    authorId: string
    claims: Array<DraftClaim>
    insightIds?: Array<string>
  }>
  parentPrompts: Array<string> // "ask me about…"
  sharedAt?: string // set when shared with parents (plan 033)
  acknowledgement?: { at: string; note?: string }
  marksSyncedAt?: string // set by syncAcademicResults (plan 036)
  studentReleasedAt?: string // set by releaseToStudent (plan 038, Prototype B Act 1)
  studentReactedAt?: string // set by submitStudentReflection (plan 038)
}

// ── Student reflections (plan 037, Prototype B story register) ─────────
export interface StudentReflection {
  studentId: string
  text: string
  writtenAt: string
  chosenAsCover: boolean // the one reflection the story register leads with
}

// ── Marks + trends (plan 036) ───────────────────────────────────────────
export interface HdpMarkEntry {
  subject: string
  schoolYear: SchoolYear
  semester: Semester
  assessment: AssessmentKind
  score: number
}

export interface HdpMarksRecord {
  studentId: string
  entries: Array<HdpMarkEntry>
}

export interface HdpCycle {
  schoolYear: SchoolYear
  semester: Semester
  terms: [HdpTerm, HdpTerm]
  stage: CycleStage
  windowOpensAt: string
  releaseAt: string
}

// ── Prototype B — insight layer (plan 040, PRD §7) ──────────────────────
export type InsightKind =
  | 'observation' // river tag/note
  | 'pattern' // forming pattern
  | 'trajectory' // trend/inflection, self-referential
  | 'attendance'
  | 'cca'
  | 'conduct'
  | 'via'
  | 'competition'
  | 'promotion'

export interface HdpInsight {
  id: string
  studentId: string
  kind: InsightKind
  label: string // one-line, numbered in UI
  sourceRef: {
    system: 'tw-river' | 'cockpit' | 'sdt' | 'sei' | 'sdp'
    recordId: string
  }
  selectable: boolean
}
