import { describe, expect, it } from 'vitest'
import { slipDetailsForStudent, slipResultsForStudent } from './insights'

const GRADES = ['A1', 'A2', 'B3', 'B4', 'C5'] as const

// Mirrors gradeForMark() in insights.ts — kept here as the documented contract
// the Results table must honour (the function itself is module-private).
function gradeForMark(mark: number): string {
  if (mark >= 75) return 'A1'
  if (mark >= 70) return 'A2'
  if (mark >= 65) return 'B3'
  if (mark >= 60) return 'B4'
  if (mark >= 55) return 'C5'
  return 'C6'
}

// The percentile band each grade tier must land in.
const GRADE_PCTL: Record<string, string> = {
  A1: '80–100',
  A2: '60–80',
  B3: '40–60',
  B4: '20–40',
  C5: '20–40',
}

// A broad, deterministic id sweep (numeric + non-numeric) so the hash-derived
// marks are exercised across many residues, not just one lucky student.
const STUDENT_IDS = [
  ...Array.from({ length: 30 }, (_, i) => String(i + 1)),
  'x',
  'zz',
]

describe('slipResultsForStudent', () => {
  it('Overall grade always equals the seeded grade (never a band below it)', () => {
    for (const studentId of STUDENT_IDS) {
      for (const grade of GRADES) {
        const { rows } = slipResultsForStudent(studentId, [
          { subject: 'Mathematics', grade },
        ])
        expect(rows[0].overall.grade).toBe(grade)
        // The Overall mark must itself map back to the seeded grade, so mark
        // and grade never contradict each other (regression guard for the
        // hash-weighted-average band drop).
        expect(gradeForMark(rows[0].overall.mark)).toBe(grade)
      }
    }
  })

  it('Overall is never lower than the same row Sem 2 grade', () => {
    const rank = (g: string) => ['A1', 'A2', 'B3', 'B4', 'C5', 'C6'].indexOf(g)
    for (const studentId of STUDENT_IDS) {
      for (const grade of GRADES) {
        const { rows } = slipResultsForStudent(studentId, [
          { subject: 'Science', grade },
        ])
        const { sem2, overall } = rows[0]
        expect(rank(overall.grade)).toBeLessThanOrEqual(rank(sem2.grade))
      }
    }
  })

  it('percentile is taken from the grade tier, so every band is reachable', () => {
    for (const grade of GRADES) {
      const { rows } = slipResultsForStudent('7', [
        { subject: 'English', grade },
      ])
      expect(rows[0].overall.pctl).toBe(GRADE_PCTL[grade])
    }
    // The top band must actually appear for a top grade (previously dead code).
    const top = slipResultsForStudent('1', [
      { subject: 'English', grade: 'A1' },
    ])
    expect(top.rows[0].overall.pctl).toBe('80–100')
  })

  it('de-dups repeated subjects and averages Overall into a percentage', () => {
    const { rows, percentage } = slipResultsForStudent('3', [
      { subject: 'English', grade: 'A1' },
      { subject: 'English', grade: 'C5' }, // duplicate subject is ignored
      { subject: 'Mathematics', grade: 'B3' },
    ])
    expect(rows).toHaveLength(2)
    expect(rows.map((r) => r.subject)).toEqual(['English', 'Mathematics'])
    const avg = Math.round(
      rows.reduce((sum, r) => sum + r.overall.mark, 0) / rows.length,
    )
    expect(percentage).toBe(avg)
  })

  it('returns empty rows and 0% for a book with no results', () => {
    expect(slipResultsForStudent('1', [])).toEqual({ rows: [], percentage: 0 })
  })
})

describe('slipDetailsForStudent', () => {
  it('is deterministic for a given studentId', () => {
    expect(slipDetailsForStudent('7')).toEqual(slipDetailsForStudent('7'))
  })

  it('produces a complete, self-consistent slip', () => {
    const slip = slipDetailsForStudent('9')
    expect(slip.personalQualities).toHaveLength(4)
    expect(slip.via.length).toBeGreaterThan(0)
    expect(slip.cca.name.length).toBeGreaterThan(0)
    expect(slip.cca.domain.length).toBeGreaterThan(0)
    expect(slip.cca.attendanceByTerm).toHaveLength(4)
  })
})
