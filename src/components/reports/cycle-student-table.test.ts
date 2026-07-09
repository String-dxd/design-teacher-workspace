import { describe, expect, it } from 'vitest'
import {
  checkpointsFor,
  checkpointsFromStatus,
  statusFor,
} from './cycle-student-table'
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

describe('statusFor — P1-A pipeline', () => {
  const draftBase = { comments: '', parentMessage: '', ready: false }

  it('returns awaiting_results when School Cockpit results are missing', () => {
    // Student 48 (Ho Jia Min) has a seeded Mathematics gap in the cockpit mock.
    const cycle = makeCycle()
    expect(statusFor(cycle, '48', true)).toBe('awaiting_results')
  })

  it('returns pending_comments when results are in and nothing is written', () => {
    const cycle = makeCycle()
    expect(statusFor(cycle, '36', true)).toBe('pending_comments')
  })

  it('returns draft once comments exist', () => {
    const cycle = makeCycle({
      perStudent: { '36': { ...draftBase, comments: '<p>Hi</p>' } },
    })
    expect(statusFor(cycle, '36', true)).toBe('draft')
  })

  it('returns in_review after submission to school leaders', () => {
    const cycle = makeCycle({
      perStudent: {
        '36': {
          ...draftBase,
          comments: '<p>Hi</p>',
          reviewStatus: 'in_review',
          submittedAt: '2026-07-08T00:00:00.000Z',
        },
      },
    })
    expect(statusFor(cycle, '36', true)).toBe('in_review')
  })

  it('returns approved once leaders approve', () => {
    const cycle = makeCycle({
      perStudent: {
        '36': { ...draftBase, comments: '<p>Hi</p>', reviewStatus: 'approved' },
      },
    })
    expect(statusFor(cycle, '36', true)).toBe('approved')
  })

  it('returns sent once shared with parents (precedence over approved)', () => {
    const cycle = makeCycle({
      perStudent: {
        '36': {
          ...draftBase,
          comments: '<p>Hi</p>',
          reviewStatus: 'approved',
          sentAt: '2026-07-08T00:00:00.000Z',
        },
      },
    })
    expect(statusFor(cycle, '36', true)).toBe('sent')
  })
})

describe('checkpointsFor', () => {
  const draftBase = { comments: '', parentMessage: '', ready: false }

  it('marks results awaiting for the cockpit-gap student, nothing else started', () => {
    expect(checkpointsFor(makeCycle(), '48')).toEqual({
      results: 'awaiting',
      comments: 'none',
      approval: 'none',
      parents: 'none',
    })
  })

  it('keeps comments at draft until submission', () => {
    const cycle = makeCycle({
      perStudent: { '36': { ...draftBase, comments: 'Hi' } },
    })
    expect(checkpointsFor(cycle, '36')).toEqual({
      results: 'in',
      comments: 'draft',
      approval: 'none',
      parents: 'none',
    })
  })

  it('a submitted comment reads done, approval pending', () => {
    const cycle = makeCycle({
      perStudent: {
        '36': { ...draftBase, comments: 'Hi', reviewStatus: 'in_review' },
      },
    })
    expect(checkpointsFor(cycle, '36')).toEqual({
      results: 'in',
      comments: 'done',
      approval: 'pending',
      parents: 'none',
    })
  })

  it('sent then acknowledged flows through the parents checkpoint', () => {
    const sent = makeCycle({
      perStudent: {
        '36': {
          ...draftBase,
          comments: 'Hi',
          reviewStatus: 'approved',
          sentAt: '2026-07-09T00:00:00.000Z',
        },
      },
    })
    expect(checkpointsFor(sent, '36').parents).toBe('sent')
    expect(checkpointsFor(sent, '36').approval).toBe('approved')

    const acked = makeCycle({
      perStudent: {
        '36': {
          ...draftBase,
          comments: 'Hi',
          reviewStatus: 'approved',
          sentAt: '2026-07-09T00:00:00.000Z',
          ackAt: '2026-07-09T00:01:00.000Z',
        },
      },
    })
    expect(checkpointsFor(acked, '36').parents).toBe('acknowledged')
  })
})

describe('checkpointsFromStatus', () => {
  it('maps every pipeline status to a consistent checkpoint tuple', () => {
    expect(checkpointsFromStatus('awaiting_results').results).toBe('awaiting')
    expect(checkpointsFromStatus('pending_comments')).toEqual({
      results: 'in',
      comments: 'none',
      approval: 'none',
      parents: 'none',
    })
    expect(checkpointsFromStatus('draft').comments).toBe('draft')
    expect(checkpointsFromStatus('in_review').approval).toBe('pending')
    expect(checkpointsFromStatus('approved').approval).toBe('approved')
    expect(checkpointsFromStatus('sent').parents).toBe('sent')
    expect(checkpointsFromStatus('sent', true).parents).toBe('acknowledged')
  })
})
