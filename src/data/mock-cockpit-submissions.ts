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
  ['Social Studies', 'Mdm Siti Rahimah'],
])

// One deliberate gap so the hub's "Awaiting results" stage is demonstrable:
// Ho Jia Min (48) — Mathematics not yet entered in School Cockpit.
const MISSING_BY_STUDENT = new Map<string, Array<string>>([
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

/** True when every School Cockpit subject for this pupil has results in. */
export function hasAllResults(studentId: string): boolean {
  return getCockpitSubmissions(studentId).every(
    (s) => s.submittedAt !== undefined,
  )
}

/** True when at least one subject has results in — enough for a teacher to
 * start writing, with the still-missing subjects showing an honest "awaiting
 * data" placeholder rather than blocking the whole report. */
export function hasAnyResults(studentId: string): boolean {
  return getCockpitSubmissions(studentId).some(
    (s) => s.submittedAt !== undefined,
  )
}
