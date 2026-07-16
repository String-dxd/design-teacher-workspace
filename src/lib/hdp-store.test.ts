import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  addTag,
  coverageForClass,
  deleteTag,
  detectFormingPatterns,
  loadPatterns,
  loadTags,
  logEvent,
  seedIfEmpty,
  updateTag,
} from './hdp-store'
import type { AddTagInput } from './hdp-store'
import type { FormingPattern, HdpTag } from '@/types/hdp'

// Same jsdom/localStorage race as src/lib/draft-storage.test.ts — install a
// minimal in-memory Storage-compatible stub so these tests exercise the
// real load/save functions against a real Storage contract deterministically.
class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length() {
    return this.store.size
  }
  clear(): void {
    this.store.clear()
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
}

beforeAll(() => {
  vi.stubGlobal('localStorage', new MemoryStorage())
})

afterEach(() => {
  localStorage.clear()
  vi.useRealTimers()
})

const baseTagInput: AddTagInput = {
  studentId: '1',
  authorId: 'lee-sy',
  disposition: 'perseverance',
  context: 'lesson',
  source: 'self',
  entryPoint: 'fab',
}

describe('addTag', () => {
  it('stamps schoolYear, term, and a 24h editableUntil window', () => {
    const before = Date.now()
    const tag = addTag(baseTagInput)
    expect(tag.schoolYear).toBe('2026')
    expect(tag.term).toBe(3)
    const createdAt = new Date(tag.createdAt).getTime()
    const editableUntil = new Date(tag.editableUntil).getTime()
    expect(createdAt).toBeGreaterThanOrEqual(before)
    expect(editableUntil - createdAt).toBe(24 * 60 * 60 * 1000)
  })

  it('persists the tag so it comes back from loadTags', () => {
    const tag = addTag(baseTagInput)
    expect(loadTags().map((t) => t.id)).toContain(tag.id)
  })
})

describe('updateTag / deleteTag — editable window', () => {
  it('updateTag succeeds inside the 24h window', () => {
    const NOW = new Date('2026-07-16T09:00:00+08:00')
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    const tag = addTag(baseTagInput)
    const updated = updateTag(tag.id, { note: 'Edited within window' })
    expect(updated.note).toBe('Edited within window')
  })

  it('updateTag throws once past editableUntil', () => {
    const CREATED = new Date('2026-07-16T09:00:00+08:00')
    vi.useFakeTimers()
    vi.setSystemTime(CREATED)
    const tag = addTag(baseTagInput)
    vi.setSystemTime(new Date(CREATED.getTime() + 25 * 60 * 60 * 1000))
    expect(() => updateTag(tag.id, { note: 'Too late' })).toThrow()
  })

  it('deleteTag succeeds inside the 24h window', () => {
    const NOW = new Date('2026-07-16T09:00:00+08:00')
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    const tag = addTag(baseTagInput)
    expect(() => deleteTag(tag.id)).not.toThrow()
    expect(loadTags().map((t) => t.id)).not.toContain(tag.id)
  })

  it('deleteTag throws once past editableUntil', () => {
    const CREATED = new Date('2026-07-16T09:00:00+08:00')
    vi.useFakeTimers()
    vi.setSystemTime(CREATED)
    const tag = addTag(baseTagInput)
    vi.setSystemTime(new Date(CREATED.getTime() + 25 * 60 * 60 * 1000))
    expect(() => deleteTag(tag.id)).toThrow()
  })
})

function makeTag(overrides: Partial<HdpTag>): HdpTag {
  return {
    id: `t-${Math.random().toString(36).slice(2, 8)}`,
    studentId: 'x1',
    authorId: 'lee-sy',
    disposition: 'curiosity',
    context: 'lesson',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-01T00:00:00+08:00',
    editableUntil: '2026-07-02T00:00:00+08:00',
    ...overrides,
  }
}

describe('detectFormingPatterns', () => {
  it('does not form a pattern from repeated tags in the same context', () => {
    localStorage.setItem(
      'hdp_tags',
      JSON.stringify([
        makeTag({ id: 't1', studentId: 'x1', context: 'lesson' }),
        makeTag({ id: 't2', studentId: 'x1', context: 'lesson' }),
      ]),
    )
    expect(detectFormingPatterns('x1')).toEqual([])
  })

  it('forms a candidate from ≥2 distinct contexts of the same disposition', () => {
    localStorage.setItem(
      'hdp_tags',
      JSON.stringify([
        makeTag({ id: 't1', studentId: 'x1', context: 'lesson' }),
        makeTag({ id: 't2', studentId: 'x1', context: 'cca' }),
      ]),
    )
    const patterns = detectFormingPatterns('x1')
    expect(patterns).toHaveLength(1)
    expect(patterns[0].status).toBe('candidate')
    expect(patterns[0].contexts.sort()).toEqual(['cca', 'lesson'])
  })

  it('respects a stored dismissed status — the pattern does not resurface', () => {
    localStorage.setItem(
      'hdp_tags',
      JSON.stringify([
        makeTag({ id: 't1', studentId: 'x1', context: 'lesson' }),
        makeTag({ id: 't2', studentId: 'x1', context: 'cca' }),
      ]),
    )
    const dismissed: FormingPattern = {
      id: 'pattern-x1-curiosity',
      studentId: 'x1',
      disposition: 'curiosity',
      contexts: ['lesson', 'cca'],
      tagIds: ['t1', 't2'],
      status: 'dismissed',
      schoolYear: '2026',
    }
    localStorage.setItem('hdp_patterns', JSON.stringify([dismissed]))
    expect(detectFormingPatterns('x1')).toEqual([])
  })
})

describe('coverageForClass', () => {
  it('counts a student with only a nil broadcast response as covered, and a zero-tag/zero-nil student as not covered', () => {
    // '1' and '2' are real 3A students (see src/data/mock-students.ts).
    localStorage.setItem('hdp_tags', JSON.stringify([]))
    localStorage.setItem(
      'hdp_broadcasts',
      JSON.stringify([
        {
          id: 'b1',
          formClassId: '3A',
          requesterId: 'lee-sy',
          studentIds: ['1'],
          recipientIds: ['goh-wt'],
          message: 'test',
          createdAt: '2026-07-10T09:00:00+08:00',
          responses: [
            {
              recipientId: 'goh-wt',
              studentId: '1',
              result: { kind: 'nothing-stood-out' },
              respondedAt: '2026-07-10T10:00:00+08:00',
            },
          ],
        },
      ]),
    )
    const snapshot = coverageForClass('3A')
    // '1' is covered via the nil response; every other 3A student has
    // neither a tag nor a nil in this isolated scenario.
    expect(snapshot.covered).toBe(1)
    expect(snapshot.reviewedNil).toBe(1)
    expect(snapshot.total).toBe(14)
  })

  it('matches the seeded value — 8 of 14 reviewed for 3A', () => {
    seedIfEmpty()
    const snapshot = coverageForClass('3A')
    expect(snapshot.total).toBe(14)
    expect(snapshot.covered).toBe(8)
  })
})

describe('seedIfEmpty', () => {
  it('is idempotent — a second call adds nothing', () => {
    seedIfEmpty()
    const afterFirst = loadTags().length
    seedIfEmpty()
    const afterSecond = loadTags().length
    expect(afterSecond).toBe(afterFirst)
  })

  it('does not overwrite existing data', () => {
    localStorage.setItem('hdp_patterns', JSON.stringify([]))
    seedIfEmpty()
    expect(loadPatterns()).toEqual([])
  })
})

describe('logEvent', () => {
  it('appends an event with a timestamp', () => {
    logEvent('tag_created', { tagId: 'tag-1' })
    const raw = localStorage.getItem('hdp_analytics')
    expect(raw).not.toBeNull()
    const events = JSON.parse(raw ?? '[]') as Array<Record<string, unknown>>
    expect(events).toHaveLength(1)
    expect(events[0].name).toBe('tag_created')
    expect(events[0].tagId).toBe('tag-1')
    expect(typeof events[0].at).toBe('string')
  })
})
