import { describe, expect, it } from 'vitest'
import { draftTeacherComment } from './hdp-comment-draft'
import {
  CURRENT_ACADEMIC_YEAR,
  generateReportFromStudent,
} from '@/data/mock-reports'
import { getStudentById } from '@/data/mock-students'

describe('draftTeacherComment', () => {
  it('drafts a multi-sentence plain-text comment from the report data', () => {
    const student = getStudentById('36')
    expect(student).toBeDefined()
    if (!student) return
    const report = generateReportFromStudent(
      student,
      'Term 2',
      CURRENT_ACADEMIC_YEAR,
    )
    const draft = draftTeacherComment(report)
    expect(draft).toContain('Chloe')
    expect(draft.split('. ').length).toBeGreaterThanOrEqual(3)
    expect(draft).not.toMatch(/<[^>]*>/)
  })
})
