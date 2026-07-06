import { describe, expect, it } from 'vitest'
import {
  CURRENT_ACADEMIC_YEAR,
  generateReportFromStudent,
  getReportById,
  mockReports,
  upsertReport,
} from './mock-reports'
import { mockStudents } from './mock-students'

// upsertReport is the critical correctness fix: generateAllReports pre-generates
// deterministic ids for most students/terms, so a naive "push if absent" (addReport)
// silently no-ops when committing a built report for those students.

describe('upsertReport', () => {
  it('inserts a new report when the id is not already present', () => {
    const student = mockStudents.find((s) => s.class === 'P1-A')
    if (!student) throw new Error('fixture missing a P1-A student')
    const report = generateReportFromStudent(
      student,
      'Term 4',
      CURRENT_ACADEMIC_YEAR,
    )
    // Term 4 is not pre-generated for most students in generateAllReports, so this
    // id should be new.
    const before = mockReports.find((r) => r.id === report.id)
    upsertReport(report)
    const after = getReportById(report.id)
    expect(after).toBeDefined()
    if (!before) {
      expect(after).toBe(report)
    }
  })

  it('replaces an existing report in place rather than no-op-ing', () => {
    const student = mockStudents.find((s) => s.class === 'P1-A')
    if (!student) throw new Error('fixture missing a P1-A student')
    const base = generateReportFromStudent(
      student,
      'Term 2',
      CURRENT_ACADEMIC_YEAR,
    )
    // Term 2 is pre-generated for every student, so this id already exists in
    // mockReports — addReport would no-op here; upsertReport must not.
    expect(getReportById(base.id)).toBeDefined()

    const built = {
      ...base,
      teacherComments: 'A distinctly different comment for this test',
      layout: { blocks: [{ key: 'pupilInfo', enabled: true, order: 0 }] },
    }
    upsertReport(built)

    const after = getReportById(base.id)
    expect(after?.teacherComments).toBe(
      'A distinctly different comment for this test',
    )
    expect(after?.layout).toEqual(built.layout)

    const countWithId = mockReports.filter((r) => r.id === base.id).length
    expect(countWithId).toBe(1)
  })
})
