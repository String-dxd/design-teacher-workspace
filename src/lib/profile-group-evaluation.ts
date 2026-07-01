import type { FilterCriterion, Student } from '@/types/student'
import type { ProfileGroup, ProfileGroupBucket } from '@/types/profile-group'
import { isFilterComplete } from '@/data/filter-config'
import { evaluateCriterion } from '@/lib/filter-evaluation'

function studentMatchesCriterion(
  student: Student,
  criterion: FilterCriterion,
): boolean {
  return evaluateCriterion(student, criterion, { unknownField: 'reject' })
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
