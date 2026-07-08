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
      parentMessage: '',
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
      parentMessage: '',
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
      parentMessage: '',
      ready: false,
      sentAt: undefined,
    })
  })
})
