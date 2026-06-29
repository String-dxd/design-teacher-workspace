import type { FilterCriterion, Student } from '@/types/student'

/**
 * The set of student fields that both evaluators understand. Unknown fields
 * (imported / custom columns) are handled via EvaluateOptions.unknownField.
 *
 * NOTE: 'dateRange' is intentionally absent. It is consumed directly by
 * getPeriodTermKey() in students.index.tsx and must fall through to the
 * unknown-field path everywhere else.
 */
export const KNOWN_FILTER_FIELDS: Set<string> = new Set<string>([
  'class',
  'cca',
  'attendance',
  'overallPercentage',
  'conduct',
  'approvedMtl',
  'learningSupport',
  'postSecEligibility',
  'offences',
  'absences',
  'lateComing',
  'ccaMissed',
  'riskIndicators',
  'lowMoodFlagged',
  'socialLinks',
  'counsellingSessions',
  'sen',
  'fas',
  'housing',
  'housingType',
  'commuterStatus',
  'afterSchoolArrangement',
  'siblings',
  'externalAgencies',
  'supportedByComLink',
  'supportedByFsc',
  'parentsConsideringDivorce',
  'nonIntactFamily',
])

export interface EvaluateOptions {
  /**
   * What an incomplete/unknown field means:
   * - 'match'  — the students page shows all (imported/custom fields have no data)
   * - 'reject' — profile groups exclude (a group must not match on fields it can't evaluate)
   */
  unknownField: 'match' | 'reject'
  /** Subject selection for overallPercentage — students page only. */
  selectedSubjects?: Array<string> | null
}

/**
 * Compute a student's overall percentage, optionally restricted to a set of
 * selected subjects. Falls back to student.overallPercentage when no subject
 * selection is active or when no matching scores exist.
 */
export function computeStudentOverall(
  student: Student,
  selectedSubjects: Array<string> | null,
): number {
  if (!selectedSubjects || !student.subjectScores) {
    return student.overallPercentage
  }
  const relevant = student.subjectScores.filter((s) =>
    selectedSubjects.includes(s.subject),
  )
  if (relevant.length === 0) return student.overallPercentage
  return Math.round(
    relevant.reduce((sum, s) => sum + s.percentage, 0) / relevant.length,
  )
}

/**
 * Extract the comparable value for a given field from a student record.
 * Handles fields whose raw storage differs from their filter-config representation.
 */
// Non-numerical fields whose absent value is shown as 'None' in the table and
// must be selectable as 'None' in the filter dropdown.
const NONE_WHEN_EMPTY_FIELDS = new Set([
  'sen',
  'fas',
  'learningSupport',
  'nonIntactFamily',
])

function getStudentValue(
  student: Student,
  field: string,
  selectedSubjects: Array<string> | null | undefined,
): unknown {
  if (field === 'overallPercentage') {
    return computeStudentOverall(student, selectedSubjects ?? null)
  }
  if (field === 'attendance') {
    return student.totalSchoolDays > 0
      ? Math.round((student.daysPresent / student.totalSchoolDays) * 100)
      : 0
  }
  if (field === 'counsellingSessions') {
    // Filter config exposes this as multiselect with values
    // 'Complex cases' | 'Less complex cases' | 'None'. The severity bucket is
    // stored on the student; absence of a bucket means no counselling case.
    return student.counsellingComplexity ?? 'None'
  }
  if (field === 'housingType') {
    return student.housingType === 'Owned'
      ? 'Owner-occupied'
      : student.housingType === 'Rented'
        ? 'Rented'
        : 'None'
  }
  return student[field as keyof Student] as unknown
}

/**
 * Evaluate a single filter criterion against a student.
 *
 * Unknown fields are handled by options.unknownField:
 * - 'match'  → return true  (students list: show all if no data available)
 * - 'reject' → return false (profile groups: exclude if can't evaluate)
 */
export function evaluateCriterion(
  student: Student,
  criterion: FilterCriterion,
  options: EvaluateOptions,
): boolean {
  if (!KNOWN_FILTER_FIELDS.has(criterion.field)) {
    return options.unknownField === 'match'
  }

  const value = getStudentValue(
    student,
    criterion.field,
    options.selectedSubjects,
  )

  switch (criterion.operator) {
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte':
    case 'eq':
    case 'neq': {
      const left = Number(value)
      const right = Number(criterion.value)
      if (Number.isNaN(left) || Number.isNaN(right)) return false
      if (criterion.operator === 'gt') return left > right
      if (criterion.operator === 'gte') return left >= right
      if (criterion.operator === 'lt') return left < right
      if (criterion.operator === 'lte') return left <= right
      if (criterion.operator === 'eq') return left === right
      // neq
      return left !== right
    }
    case 'between': {
      const range = criterion.value as { min: number; max: number }
      return Number(value) >= range.min && Number(value) <= range.max
    }
    case 'not_between': {
      const range = criterion.value as { min: number; max: number }
      return Number(value) < range.min || Number(value) > range.max
    }
    case 'contains':
      return String(value ?? '')
        .toLowerCase()
        .includes(String(criterion.value).toLowerCase())
    case 'not_contains':
      return !String(value ?? '')
        .toLowerCase()
        .includes(String(criterion.value).toLowerCase())
    case 'is': {
      // Non-numerical fields with data show an absent value as 'None' (matching
      // the table), so an empty value must match the 'None' filter option.
      const norm =
        NONE_WHEN_EMPTY_FIELDS.has(criterion.field) &&
        (value == null || value === '' || value === '-')
          ? 'None'
          : String(value ?? '')
      if (Array.isArray(criterion.value)) {
        return criterion.value.includes(norm)
      }
      return norm === String(criterion.value)
    }
    case 'is_not':
      return String(value ?? '') !== String(criterion.value)
    case 'is_empty':
      return !value || value === ''
    case 'is_not_empty':
      return !!value && value !== ''
    default:
      return false
  }
}
