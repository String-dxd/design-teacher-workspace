import type { FilterCriterion, Student } from '@/types/student'
import type { ProfileGroup, ProfileGroupBucket } from '@/types/profile-group'
import { isFilterComplete } from '@/data/filter-config'

const KNOWN_FIELDS = new Set<string>([
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
  'nonIntactFamily',
])

function getStudentValue(student: Student, field: string): unknown {
  if (field === 'attendance') {
    return student.totalSchoolDays > 0
      ? Math.round((student.daysPresent / student.totalSchoolDays) * 100)
      : 0
  }
  if (field === 'counsellingSessions') {
    // Filter config exposes this as multi-select with values like
    // 'Complex cases' / 'Less complex cases' / '-'. Map the numeric count to a
    // bucket so 'is' comparisons work against the configured enum values.
    const count = student.counsellingSessions
    if (!count) return '-'
    return count >= 2 ? 'Complex cases' : 'Less complex cases'
  }
  if (field === 'housingType') {
    return student.housingType === 'Rented'
      ? 'Rented'
      : student.housingType === 'Owned'
        ? 'Owner-occupied'
        : '-'
  }
  return student[field as keyof Student] as unknown
}

export function studentMatchesCriterion(
  student: Student,
  criterion: FilterCriterion,
): boolean {
  if (!KNOWN_FIELDS.has(criterion.field)) return false

  const value = getStudentValue(student, criterion.field)

  switch (criterion.operator) {
    case 'gt':
      return Number(value) > Number(criterion.value)
    case 'gte':
      return Number(value) >= Number(criterion.value)
    case 'lt':
      return Number(value) < Number(criterion.value)
    case 'lte':
      return Number(value) <= Number(criterion.value)
    case 'eq':
      return Number(value) === Number(criterion.value)
    case 'neq':
      return Number(value) !== Number(criterion.value)
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
    case 'is':
      if (Array.isArray(criterion.value)) {
        return criterion.value.includes(String(value ?? ''))
      }
      return String(value ?? '') === String(criterion.value)
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

export function countMatchedCriteria(
  student: Student,
  criteria: Array<FilterCriterion>,
): number {
  return criteria.reduce(
    (n, c) => n + (studentMatchesCriterion(student, c) ? 1 : 0),
    0,
  )
}

export function getMatchedCriteria(
  student: Student,
  criteria: Array<FilterCriterion>,
): Array<FilterCriterion> {
  return criteria.filter((c) => studentMatchesCriterion(student, c))
}

export function assignBucket(
  matchedCount: number,
  buckets: Array<ProfileGroupBucket>,
): ProfileGroupBucket | null {
  for (const bucket of buckets) {
    if (
      bucket.rule.kind === 'meet_at_least' &&
      matchedCount >= bucket.rule.count
    ) {
      return bucket
    }
  }
  const remaining = buckets.find((b) => b.rule.kind === 'all_remaining')
  return remaining ?? null
}

export function completeCriteria(group: ProfileGroup): Array<FilterCriterion> {
  return group.criteria.filter((c) => c.field && isFilterComplete(c))
}
