import { describe, expect, it } from 'vitest'
import { draftTeacherComment } from './hdp-comment-draft'
import type { HolisticReport } from '@/types/report'
import {
  CURRENT_ACADEMIC_YEAR,
  generateReportFromStudent,
} from '@/data/mock-reports'
import { getStudentById } from '@/data/mock-students'

function chloeReport(): HolisticReport {
  const student = getStudentById('36')
  if (!student) throw new Error('mock student 36 missing')
  return generateReportFromStudent(student, 'Term 2', CURRENT_ACADEMIC_YEAR)
}

describe('draftTeacherComment', () => {
  it('drafts a multi-sentence plain-text comment from the report data', () => {
    const draft = draftTeacherComment(chloeReport())
    expect(draft).toContain('Chloe')
    expect(draft.split('. ').length).toBeGreaterThanOrEqual(3)
    expect(draft).not.toMatch(/<[^>]*>/)
  })

  it('only draws on the selected sources', () => {
    const report = chloeReport()
    const resultsOnly = draftTeacherComment(report, ['results'])
    expect(resultsOnly).toContain('strength in')
    expect(resultsOnly).not.toMatch(/% of school days/)
    expect(resultsOnly).not.toContain(report.holistic.cca[0]?.name ?? '@@')

    const attendanceOnly = draftTeacherComment(report, ['attendance'])
    expect(attendanceOnly).toMatch(/% of school days/)
    expect(attendanceOnly).not.toContain('strength in')
  })
})
