import { describe, expect, it } from 'vitest'
import { commitCycleReport } from './hdp-report-commit'
import type { CycleState } from './hdp-cycle-store'
import {
  CURRENT_ACADEMIC_YEAR,
  generateReportFromStudent,
  getReportById,
} from '@/data/mock-reports'
import { mockStudents } from '@/data/mock-students'

function makeCycle(overrides: Partial<CycleState> = {}): CycleState {
  return {
    classId: 'P1-A',
    term: 'Term 3',
    academicYear: 2025,
    templateId: 'p1-default',
    layout: { blocks: [{ key: 'pupilInfo', enabled: true, order: 0 }] },
    perStudent: {},
    updatedAt: '',
    ...overrides,
  }
}

const student = mockStudents.find((s) => s.class === 'P1-A')
if (!student) throw new Error('fixture missing a P1-A student')

describe('commitCycleReport', () => {
  it('uses the draft comments and cycle layout when a draft is present', () => {
    const cycle = makeCycle({
      perStudent: {
        [student.id]: {
          comments: 'DRAFT-COMMENT',
          parentMessage: '',
          ready: false,
        },
      },
    })
    const built = commitCycleReport(student, 'Term 3', cycle)
    expect(built.teacherComments).toBe('DRAFT-COMMENT')
    expect(built.layout).toBe(cycle.layout)
  })

  it('falls back to the generated report comments when there is no draft', () => {
    const cycle = makeCycle({ perStudent: {} })
    const built = commitCycleReport(student, 'Term 3', cycle)
    const base = generateReportFromStudent(
      student,
      'Term 3',
      CURRENT_ACADEMIC_YEAR,
    )
    expect(built.teacherComments).toBe(base.teacherComments)
  })

  it('persists the built report so it can be retrieved by id with the cycle layout', () => {
    const cycle = makeCycle({ perStudent: {} })
    const built = commitCycleReport(student, 'Term 3', cycle)
    const stored = getReportById(built.id)
    expect(stored).toBeDefined()
    expect(stored?.layout).toEqual(cycle.layout)
  })
})
