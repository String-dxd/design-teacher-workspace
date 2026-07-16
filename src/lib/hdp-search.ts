import type { Student } from '@/types/student'
import { mockStudents } from '@/data/mock-students'
import { CURRENT_TEACHER } from '@/data/hdp'
import { classesForTeacher } from '@/data/timetable'

const MAX_RESULTS = 8

// Patronymic particles skipped as standalone match tokens (Malay names,
// e.g. "Nur Aisyah binte Rahman" should match "aisyah" or "rahman", never
// "binte"/"bin").
const SKIPPED_TOKENS = new Set(['bin', 'binte'])

/** Exported for tests only — name tokenization is the crux of the escape
 *  hatch and patronymic-skipping behaviour and deserves direct coverage. */
export function tokensFor(name: string): Array<string> {
  return name
    .toLowerCase()
    .split(/[\s'-]+/)
    .map((token) => token.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter((token) => token.length > 0 && !SKIPPED_TOKENS.has(token))
}

function matches(student: Student, query: string): boolean {
  const trimmed = query.trim().toLowerCase()
  if (trimmed === '') return true
  const nameTokens = tokensFor(student.name)
  // Every space-separated word in the query must match some name token —
  // lets "wei jie" find "Tan Wei Jie" (not just single-word queries).
  const queryTokens = trimmed.split(/\s+/).filter((t) => t.length > 0)
  return queryTokens.every((queryToken) =>
    nameTokens.some((nameToken) => nameToken.includes(queryToken)),
  )
}

/** Classes a teacher is associated with: their form class (if any) plus
 *  every class they're timetabled to teach. Only CURRENT_TEACHER has a form
 *  class in this fixture model — colleagues are teaching-only. */
function associatedClassesForTeacher(teacherId: string): Array<string> {
  const classes = new Set(classesForTeacher(teacherId))
  if (teacherId === CURRENT_TEACHER.id) {
    classes.add(CURRENT_TEACHER.formClassId)
  }
  return Array.from(classes)
}

function rankAndCap(
  students: Array<Student>,
  formClassId: string,
): Array<Student> {
  const sorted = [...students].sort((a, b) => {
    const aForm = a.class === formClassId
    const bForm = b.class === formClassId
    if (aForm !== bForm) return aForm ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  return sorted.slice(0, MAX_RESULTS)
}

/**
 * Students associated with a teacher (their form class + classes they
 * teach), matching `query` on any name token, form-class students ranked
 * first then alphabetical, capped at 8. Empty query returns the first 8
 * associated students (form class first).
 */
export function searchAssociatedStudents(
  query: string,
  teacherId: string,
): Array<Student> {
  const classes = new Set(associatedClassesForTeacher(teacherId))
  const pool = mockStudents.filter((s) => classes.has(s.class))
  const filtered = pool.filter((s) => matches(s, query))
  return rankAndCap(filtered, CURRENT_TEACHER.formClassId)
}

/**
 * Escape hatch (UX grill decision, 2026-07-16): CCA and relief moments
 * involve students outside the teacher's timetabled classes. Searches every
 * student in the school, capped at 8, alphabetical (no form-class ranking —
 * there is no single "home" class across the whole school).
 */
export function searchAllStudents(query: string): Array<Student> {
  const filtered = mockStudents.filter((s) => matches(s, query))
  return [...filtered]
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, MAX_RESULTS)
}
