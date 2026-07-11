import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearCycle,
  loadCycle,
  patchStudent,
  saveCycle,
} from './hdp-cycle-store'
import type { CycleState } from './hdp-cycle-store'

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

afterEach(() => {
  localStorage.clear()
  vi.useRealTimers()
})

describe('loadCycle', () => {
  it('returns null when nothing has been saved for that class/term', () => {
    expect(loadCycle('P1-A', 'Term 2')).toBeNull()
  })
})

describe('saveCycle / loadCycle', () => {
  it('round-trips a CycleState', () => {
    saveCycle(makeCycle())
    const loaded = loadCycle('P1-A', 'Term 2')
    expect(loaded).not.toBeNull()
    expect(loaded?.classId).toBe('P1-A')
    expect(loaded?.templateId).toBe('p1-default')
    // loadCycle merges in any default blocks missing from the stored layout
    // (older cycles pre-date newer sections), so the saved single block comes
    // back alongside the full default set.
    const keys = loaded?.layout.blocks.map((b) => b.key) ?? []
    expect(keys).toContain('pupilInfo')
    expect(keys).toContain('termAtAGlance')
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('keys storage per class + term, not sharing state across them', () => {
    saveCycle(makeCycle({ classId: 'P1-A', term: 'Term 2' }))
    saveCycle(makeCycle({ classId: 'P2-B', term: 'Term 2' }))
    expect(loadCycle('P1-A', 'Term 2')?.classId).toBe('P1-A')
    expect(loadCycle('P2-B', 'Term 2')?.classId).toBe('P2-B')
    expect(loadCycle('P1-A', 'Term 3')).toBeNull()
  })
})

describe('patchStudent', () => {
  it('creates a new per-student draft and persists it', () => {
    saveCycle(makeCycle())
    const updated = patchStudent('P1-A', 'Term 2', 'stu-1', {
      comments: 'Doing well',
    })
    expect(updated?.perStudent['stu-1']).toEqual({
      comments: 'Doing well',
      ready: false,
      sentAt: undefined,
    })
    const reloaded = loadCycle('P1-A', 'Term 2')
    expect(reloaded?.perStudent['stu-1'].comments).toBe('Doing well')
  })

  it('merges into an existing draft without clobbering other fields', () => {
    saveCycle(makeCycle())
    patchStudent('P1-A', 'Term 2', 'stu-1', { comments: 'Draft comment' })
    const updated = patchStudent('P1-A', 'Term 2', 'stu-1', { ready: true })
    expect(updated?.perStudent['stu-1']).toEqual({
      comments: 'Draft comment',
      ready: true,
      sentAt: undefined,
    })
  })

  it('returns null when no cycle exists yet for that class/term', () => {
    expect(patchStudent('P1-A', 'Term 2', 'stu-1', { ready: true })).toBeNull()
  })
})

describe('clearCycle', () => {
  it('returns null after clearing a saved cycle', () => {
    saveCycle(makeCycle())
    clearCycle('P1-A', 'Term 2')
    expect(loadCycle('P1-A', 'Term 2')).toBeNull()
  })
})

describe('loadCycle with corrupted storage', () => {
  it('returns null when localStorage contains invalid JSON', () => {
    localStorage.setItem('hdp_cycle_P1-A_Term 2', '{not json')
    expect(loadCycle('P1-A', 'Term 2')).toBeNull()
  })

  it('returns null when the layout shape is missing', () => {
    localStorage.setItem(
      'hdp_cycle_P1-A_Term 2',
      JSON.stringify({
        classId: 'P1-A',
        term: 'Term 2',
        templateId: 'p1-default',
        updatedAt: '2026-01-01T00:00:00Z',
      }),
    )
    expect(loadCycle('P1-A', 'Term 2')).toBeNull()
  })

  it('patches a per-student draft with a missing field from an old-version cycle', () => {
    localStorage.setItem(
      'hdp_cycle_P1-A_Term 2',
      JSON.stringify({
        classId: 'P1-A',
        term: 'Term 2',
        academicYear: 2025,
        templateId: 'p1-default',
        updatedAt: '2026-01-01T00:00:00Z',
        layout: { blocks: [] },
        perStudent: { 'stu-1': { comments: 'Old comment' } },
      }),
    )
    const loaded = loadCycle('P1-A', 'Term 2')
    expect(loaded?.perStudent['stu-1']).toEqual({
      comments: 'Old comment',
      ready: false,
      sentAt: undefined,
    })
  })
})

describe('review pipeline fields', () => {
  it('round-trips reviewStatus and submittedAt through patchStudent', () => {
    saveCycle(makeCycle())
    patchStudent('P1-A', 'Term 2', '36', {
      reviewStatus: 'in_review',
      submittedAt: '2026-07-08T01:00:00.000Z',
    })
    const loaded = loadCycle('P1-A', 'Term 2')
    expect(loaded?.perStudent['36'].reviewStatus).toBe('in_review')
    expect(loaded?.perStudent['36'].submittedAt).toBe(
      '2026-07-08T01:00:00.000Z',
    )
  })

  it('maps legacy ready:true drafts to reviewStatus in_review on load', () => {
    saveCycle(
      makeCycle({
        perStudent: {
          '36': { comments: '', ready: true },
        },
      }),
    )
    const loaded = loadCycle('P1-A', 'Term 2')
    expect(loaded?.perStudent['36'].reviewStatus).toBe('in_review')
  })
})

describe('editing an approved comment invalidates the approval', () => {
  it('demotes an approved (unsent) draft back to draft on a comment change', () => {
    saveCycle(
      makeCycle({
        perStudent: {
          '36': {
            comments: 'Approved text',
            ready: true,
            reviewStatus: 'approved',
            submittedAt: '2026-07-08T01:00:00.000Z',
          },
        },
      }),
    )
    patchStudent('P1-A', 'Term 2', '36', { comments: 'Edited text' })
    const loaded = loadCycle('P1-A', 'Term 2')
    expect(loaded?.perStudent['36'].reviewStatus).toBeUndefined()
    expect(loaded?.perStudent['36'].ready).toBe(false)
    expect(loaded?.perStudent['36'].submittedAt).toBeUndefined()
    expect(loaded?.perStudent['36'].comments).toBe('Edited text')
  })

  it('keeps the approval when the comment is written back unchanged', () => {
    saveCycle(
      makeCycle({
        perStudent: {
          '36': {
            comments: 'Approved text',
            ready: true,
            reviewStatus: 'approved',
          },
        },
      }),
    )
    patchStudent('P1-A', 'Term 2', '36', { comments: 'Approved text' })
    expect(loadCycle('P1-A', 'Term 2')?.perStudent['36'].reviewStatus).toBe(
      'approved',
    )
  })

  it('does not demote when the patch itself sets a review status (resubmission)', () => {
    saveCycle(
      makeCycle({
        perStudent: {
          '36': {
            comments: 'Approved text',
            ready: true,
            reviewStatus: 'approved',
          },
        },
      }),
    )
    patchStudent('P1-A', 'Term 2', '36', {
      comments: 'Edited text',
      ready: true,
      reviewStatus: 'in_review',
      submittedAt: '2026-07-09T01:00:00.000Z',
    })
    expect(loadCycle('P1-A', 'Term 2')?.perStudent['36'].reviewStatus).toBe(
      'in_review',
    )
  })

  it('cancels a pending scheduled send along with the approval', () => {
    saveCycle(
      makeCycle({
        perStudent: {
          '36': {
            comments: 'Approved text',
            ready: true,
            reviewStatus: 'approved',
            scheduledSendAt: '2026-07-17T09:00:00.000Z',
            ackDeadline: '2026-07-24T00:00:00.000Z',
            reminderType: 'daily',
            reminderDate: '2026-07-20T00:00:00.000Z',
          },
        },
      }),
    )
    patchStudent('P1-A', 'Term 2', '36', { comments: 'Edited text' })
    const loaded = loadCycle('P1-A', 'Term 2')?.perStudent['36']
    expect(loaded?.scheduledSendAt).toBeUndefined()
    expect(loaded?.ackDeadline).toBeUndefined()
    expect(loaded?.reminderType).toBeUndefined()
    expect(loaded?.reminderDate).toBeUndefined()
  })

  it('leaves sent reports alone — the correction flow owns that path', () => {
    saveCycle(
      makeCycle({
        perStudent: {
          '36': {
            comments: 'Sent text',
            ready: true,
            reviewStatus: 'approved',
            sentAt: '2026-07-08T02:00:00.000Z',
          },
        },
      }),
    )
    patchStudent('P1-A', 'Term 2', '36', { comments: 'Edited text' })
    expect(loadCycle('P1-A', 'Term 2')?.perStudent['36'].reviewStatus).toBe(
      'approved',
    )
  })

  it('in-review drafts are not silently demoted by a comment change', () => {
    saveCycle(
      makeCycle({
        perStudent: {
          '36': {
            comments: 'Submitted text',
            ready: true,
            reviewStatus: 'in_review',
          },
        },
      }),
    )
    patchStudent('P1-A', 'Term 2', '36', { comments: 'Edited text' })
    expect(loadCycle('P1-A', 'Term 2')?.perStudent['36'].reviewStatus).toBe(
      'in_review',
    )
  })
})
