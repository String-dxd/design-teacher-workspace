// School Cockpit is the source of truth for assessment data — teachers enter it
// there, and Teacher Workspace only reads it. This mock models per-student,
// per-subject submission status so report surfaces can show honest "awaiting
// data" placeholders instead of seeded filler when a subject teacher hasn't
// submitted yet.

export interface CockpitSubjectSubmission {
  subject: string
  teacherName: string
  /** ISO timestamp of the submission; undefined = not yet submitted. */
  submittedAt?: string
}

/** P1 subject teachers — multiple teachers feed one pupil's report. */
const P1_SUBJECT_TEACHERS = new Map<string, string>([
  ['English Language', 'Mrs. Lim Siew Bee'],
  ['Chinese Language', 'Mdm Lee Hui Fen'],
  ['Mathematics', 'Mr Tan Wei Ming'],
])

// Deliberate gaps so readiness states are visible in the demo:
// Chloe (36) — Chinese not in yet; Ho Jia Min (48) — Mathematics not in yet.
const MISSING_BY_STUDENT = new Map<string, Array<string>>([
  ['36', ['Chinese Language']],
  ['48', ['Mathematics']],
])

const SUBMITTED_AT = '2026-07-03T09:00:00.000Z'

export function getCockpitSubmissions(
  studentId: string,
): Array<CockpitSubjectSubmission> {
  const missing = MISSING_BY_STUDENT.get(studentId) ?? []
  return [...P1_SUBJECT_TEACHERS.entries()].map(([subject, teacherName]) => ({
    subject,
    teacherName,
    submittedAt: missing.includes(subject) ? undefined : SUBMITTED_AT,
  }))
}

/** Unknown subjects (secondary, P3+) are treated as submitted — the cockpit
 * mock only tracks the P1 graded subjects. */
export function isSubjectSubmitted(
  studentId: string,
  subject: string,
): boolean {
  if (!P1_SUBJECT_TEACHERS.has(subject)) return true
  const missing = MISSING_BY_STUDENT.get(studentId) ?? []
  return !missing.includes(subject)
}

export function getSubjectTeacher(subject: string): string | undefined {
  return P1_SUBJECT_TEACHERS.get(subject)
}
