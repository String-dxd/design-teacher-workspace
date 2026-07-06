import { describe, expect, it } from 'vitest'
import { statusFor } from './cycle-student-table'
import type { CycleStudentStatus } from './cycle-student-table'
import type { CycleState } from '@/lib/hdp-cycle-store'

function makeCycle(overrides: Partial<CycleState> = {}): CycleState {
  return {
    classId: 'P1-A',
    term: 'Term 2',
    academicYear: 2025,
    templateId: 'p1-default',
    layout: { blocks: [{ key: 'pupilInfo', enabled: true, order: 0 }] },
    perStudent: {},
    updatedAt: '',
    ...overrides,
  }
}

describe('statusFor', () => {
  it('returns not_started when the cycle is null', () => {
    const status: CycleStudentStatus = statusFor(null, 'stu-1')
    expect(status).toBe('not_started')
  })

  it('returns not_started when the student is absent from perStudent', () => {
    const cycle = makeCycle()
    expect(statusFor(cycle, 'stu-1')).toBe('not_started')
  })

  it('returns draft when only comments are filled in', () => {
    const cycle = makeCycle({
      perStudent: {
        'stu-1': { comments: 'x', parentMessage: '', ready: false },
      },
    })
    expect(statusFor(cycle, 'stu-1')).toBe('draft')
  })

  it('returns draft when only parentMessage is filled in', () => {
    const cycle = makeCycle({
      perStudent: {
        'stu-1': { comments: '', parentMessage: 'x', ready: false },
      },
    })
    expect(statusFor(cycle, 'stu-1')).toBe('draft')
  })

  it('returns ready when marked ready with no comments', () => {
    const cycle = makeCycle({
      perStudent: {
        'stu-1': { comments: '', parentMessage: '', ready: true },
      },
    })
    expect(statusFor(cycle, 'stu-1')).toBe('ready')
  })

  it('returns sent when sentAt is set alongside ready', () => {
    const cycle = makeCycle({
      perStudent: {
        'stu-1': {
          comments: '',
          parentMessage: '',
          ready: true,
          sentAt: '2026-01-01',
        },
      },
    })
    expect(statusFor(cycle, 'stu-1')).toBe('sent')
  })

  it('returns sent when sentAt is set even though ready is false (sentAt precedence)', () => {
    const cycle = makeCycle({
      perStudent: {
        'stu-1': {
          comments: '',
          parentMessage: '',
          ready: false,
          sentAt: '2026-01-01',
        },
      },
    })
    expect(statusFor(cycle, 'stu-1')).toBe('sent')
  })
})
