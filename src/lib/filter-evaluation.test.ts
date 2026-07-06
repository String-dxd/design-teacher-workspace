import { describe, expect, it } from 'vitest'
import { computeStudentOverall, evaluateCriterion } from './filter-evaluation'
import { assignBucket } from './profile-group-evaluation'
import type { FilterCriterion, Student } from '@/types/student'
import type { ProfileGroupBucket } from '@/types/profile-group'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: 'test-1',
    name: 'Test Student',
    class: '1A',
    cca: 'Basketball',
    attentionTags: [],
    overallPercentage: 75,
    subjectScores: [],
    conduct: 'Good',
    approvedMtl: null,
    learningSupport: null,
    postSecEligibility: 'Eligible',
    offences: 0,
    absences: 0,
    privateVrAbsences: 0,
    mcAbsences: 0,
    lateComing: 0,
    ccaMissed: 0,
    riskIndicators: 0,
    lowMoodFlagged: null,
    socialLinks: 0,
    counsellingSessions: 0,
    sen: null,
    fas: null,
    housing: null,
    housingType: null,
    custody: null,
    custodyDetails: null,
    commuterStatus: null,
    afterSchoolArrangement: null,
    siblings: 0,
    externalAgencies: null,
    nric: 'T0000000A',
    indexNumber: 1,
    formTeacher: 'Mr Test',
    coFormTeacher: null,
    promotionStatus: null,
    daysPresent: 100,
    totalSchoolDays: 100,
    teacherObservations: null,
    nextSteps: null,
    ...overrides,
  }
}

function makeCriterion(overrides: Partial<FilterCriterion>): FilterCriterion {
  return {
    id: 'c1',
    field: 'absences',
    operator: 'eq',
    value: 0,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// 1. Numeric operator happy paths on absences
// ---------------------------------------------------------------------------

describe('numeric operators', () => {
  const student = makeStudent({ absences: 5 })

  it('gt: 5 > 3 → true', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({ field: 'absences', operator: 'gt', value: 3 }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })

  it('gt: 5 > 5 → false', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({ field: 'absences', operator: 'gt', value: 5 }),
        { unknownField: 'reject' },
      ),
    ).toBe(false)
  })

  it('gte: 5 >= 5 → true', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({ field: 'absences', operator: 'gte', value: 5 }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })

  it('lt: 5 < 10 → true', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({ field: 'absences', operator: 'lt', value: 10 }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })

  it('lte: 5 <= 5 → true', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({ field: 'absences', operator: 'lte', value: 5 }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })

  it('eq: 5 === 5 → true', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({ field: 'absences', operator: 'eq', value: 5 }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 2. NaN guard: non-numeric stored values with numeric operators → false
// ---------------------------------------------------------------------------

describe('NaN guard', () => {
  // conduct is a string ('Good') — not a number
  const student = makeStudent({ conduct: 'Good' })

  it('eq with non-numeric stored value → false', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({ field: 'conduct', operator: 'eq', value: 0 }),
        { unknownField: 'reject' },
      ),
    ).toBe(false)
  })

  it('neq with non-numeric stored value → false (not truthy-for-all)', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({ field: 'conduct', operator: 'neq', value: 0 }),
        { unknownField: 'reject' },
      ),
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 3. between / not_between
// ---------------------------------------------------------------------------

describe('between / not_between', () => {
  const student = makeStudent({ absences: 5 })

  it('between: 5 inside [3, 7] → true', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({
          field: 'absences',
          operator: 'between',
          value: { min: 3, max: 7 },
        }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })

  it('between: 5 outside [6, 10] → false', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({
          field: 'absences',
          operator: 'between',
          value: { min: 6, max: 10 },
        }),
        { unknownField: 'reject' },
      ),
    ).toBe(false)
  })

  it('not_between: 5 outside [6, 10] → true', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({
          field: 'absences',
          operator: 'not_between',
          value: { min: 6, max: 10 },
        }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })

  it('not_between: 5 inside [3, 7] → false', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({
          field: 'absences',
          operator: 'not_between',
          value: { min: 3, max: 7 },
        }),
        { unknownField: 'reject' },
      ),
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 4. Text operators
// ---------------------------------------------------------------------------

describe('text operators', () => {
  const student = makeStudent({ class: '2B-Excellence' })

  it('contains: case-insensitive match → true', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({
          field: 'class',
          operator: 'contains',
          value: 'excellence',
        }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })

  it('not_contains: no match → true', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({
          field: 'class',
          operator: 'not_contains',
          value: 'xyz',
        }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })

  it('is: exact string match → true', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({
          field: 'class',
          operator: 'is',
          value: '2B-Excellence',
        }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })

  it('is: array (multiselect) includes value → true', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({
          field: 'class',
          operator: 'is',
          value: ['1A', '2B-Excellence', '3C'],
        }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })

  it('is: array does not include value → false', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({ field: 'class', operator: 'is', value: ['1A', '3C'] }),
        { unknownField: 'reject' },
      ),
    ).toBe(false)
  })

  it('is_not: value differs → true', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({ field: 'class', operator: 'is_not', value: '1A' }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })

  it('is_empty: null field → true', () => {
    const s = makeStudent({ sen: null })
    expect(
      evaluateCriterion(
        s,
        makeCriterion({ field: 'sen', operator: 'is_empty', value: '' }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })

  it('is_not_empty: non-null field → true', () => {
    const s = makeStudent({ sen: 'ASD' })
    expect(
      evaluateCriterion(
        s,
        makeCriterion({ field: 'sen', operator: 'is_not_empty', value: '' }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 5. Unknown field behavior
// ---------------------------------------------------------------------------

describe('unknown field', () => {
  const student = makeStudent()

  it('unknownField "match": imported col → true', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({ field: 'importedCol42', operator: 'eq', value: 0 }),
        { unknownField: 'match' },
      ),
    ).toBe(true)
  })

  it('unknownField "reject": imported col → false', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({ field: 'importedCol42', operator: 'eq', value: 0 }),
        { unknownField: 'reject' },
      ),
    ).toBe(false)
  })

  it('dateRange with unknownField "match" → true (drift addendum)', () => {
    expect(
      evaluateCriterion(
        student,
        makeCriterion({ field: 'dateRange', operator: 'is', value: '2025-T4' }),
        { unknownField: 'match' },
      ),
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 6. attendance field
// ---------------------------------------------------------------------------

describe('attendance', () => {
  it('daysPresent 45 / totalSchoolDays 50 = 90% → gte 90 true', () => {
    const student = makeStudent({ daysPresent: 45, totalSchoolDays: 50 })
    expect(
      evaluateCriterion(
        student,
        makeCriterion({ field: 'attendance', operator: 'gte', value: 90 }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })

  it('totalSchoolDays 0 → attendance evaluates as 0', () => {
    const student = makeStudent({ daysPresent: 30, totalSchoolDays: 0 })
    expect(
      evaluateCriterion(
        student,
        makeCriterion({ field: 'attendance', operator: 'eq', value: 0 }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 7. housingType mapping
// ---------------------------------------------------------------------------

describe('housingType', () => {
  it('raw "Owned" maps to "Owner-occupied" → is "Owner-occupied" true', () => {
    const student = makeStudent({ housingType: 'Owned' })
    expect(
      evaluateCriterion(
        student,
        makeCriterion({
          field: 'housingType',
          operator: 'is',
          value: 'Owner-occupied',
        }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })

  it('raw null maps to "None" → is "None" true', () => {
    const student = makeStudent({ housingType: null })
    expect(
      evaluateCriterion(
        student,
        makeCriterion({ field: 'housingType', operator: 'is', value: 'None' }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 8. counsellingSessions bucketing (regression: students-page bug)
// ---------------------------------------------------------------------------

describe('counsellingSessions bucketing', () => {
  it('complexity "Complex cases" → "Complex cases"', () => {
    const student = makeStudent({ counsellingComplexity: 'Complex cases' })
    expect(
      evaluateCriterion(
        student,
        makeCriterion({
          field: 'counsellingSessions',
          operator: 'is',
          value: 'Complex cases',
        }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })

  it('complexity "Less complex cases" → "Less complex cases"', () => {
    const student = makeStudent({ counsellingComplexity: 'Less complex cases' })
    expect(
      evaluateCriterion(
        student,
        makeCriterion({
          field: 'counsellingSessions',
          operator: 'is',
          value: 'Less complex cases',
        }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })

  it('no complexity → "None"', () => {
    const student = makeStudent({ counsellingComplexity: undefined })
    expect(
      evaluateCriterion(
        student,
        makeCriterion({
          field: 'counsellingSessions',
          operator: 'is',
          value: 'None',
        }),
        { unknownField: 'reject' },
      ),
    ).toBe(true)
  })

  it('"Complex cases" student does not match "Less complex cases" filter', () => {
    const student = makeStudent({ counsellingComplexity: 'Complex cases' })
    expect(
      evaluateCriterion(
        student,
        makeCriterion({
          field: 'counsellingSessions',
          operator: 'is',
          value: 'Less complex cases',
        }),
        { unknownField: 'reject' },
      ),
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 9. overallPercentage with selectedSubjects
// ---------------------------------------------------------------------------

describe('overallPercentage with selectedSubjects', () => {
  it('filters to selected subject and matches gte 80', () => {
    const student = makeStudent({
      overallPercentage: 60,
      subjectScores: [
        { subject: 'EL', percentage: 80 },
        { subject: 'MA', percentage: 40 },
      ],
    })
    expect(
      evaluateCriterion(
        student,
        makeCriterion({
          field: 'overallPercentage',
          operator: 'gte',
          value: 80,
        }),
        { unknownField: 'reject', selectedSubjects: ['EL'] },
      ),
    ).toBe(true)
  })

  it('with selectedSubjects null falls back to student.overallPercentage', () => {
    const student = makeStudent({ overallPercentage: 55 })
    expect(
      evaluateCriterion(
        student,
        makeCriterion({
          field: 'overallPercentage',
          operator: 'eq',
          value: 55,
        }),
        { unknownField: 'reject', selectedSubjects: null },
      ),
    ).toBe(true)
  })

  it('computeStudentOverall direct: averages selected subjects', () => {
    const student = makeStudent({
      overallPercentage: 60,
      subjectScores: [
        { subject: 'EL', percentage: 80 },
        { subject: 'MA', percentage: 40 },
      ],
    })
    expect(computeStudentOverall(student, ['EL', 'MA'])).toBe(60)
  })
})

// ---------------------------------------------------------------------------
// 10. assignBucket
// ---------------------------------------------------------------------------

describe('assignBucket', () => {
  const buckets: Array<ProfileGroupBucket> = [
    { id: 'b1', name: 'High Risk', rule: { kind: 'meet_at_least', count: 3 } },
    {
      id: 'b2',
      name: 'Moderate Risk',
      rule: { kind: 'meet_at_least', count: 1 },
    },
    { id: 'b3', name: 'Low Risk', rule: { kind: 'all_remaining' } },
  ]

  it('meet_at_least: exactly equal to count → matches', () => {
    expect(assignBucket(3, buckets)?.id).toBe('b1')
  })

  it('meet_at_least: below threshold → falls to next bucket', () => {
    expect(assignBucket(2, buckets)?.id).toBe('b2')
  })

  it('all_remaining fallback: 0 matches → Low Risk', () => {
    expect(assignBucket(0, buckets)?.id).toBe('b3')
  })
})
