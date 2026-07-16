import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  addTag,
  canBroadcast,
  confirmPattern,
  coverageForClass,
  createBroadcast,
  deleteTag,
  detectFormingPatterns,
  dismissPattern,
  dispositionMix,
  loadBroadcasts,
  loadPatterns,
  loadTags,
  logEvent,
  nilsForStudent,
  respondToBroadcast,
  seedIfEmpty,
  summaryForTeacher,
  tagsForStudentVisible,
  updateTag,
} from './hdp-store'
import type { AddTagInput } from './hdp-store'
import type { BroadcastRequest, FormingPattern, HdpTag } from '@/types/hdp'
import { CURRENT_TEACHER } from '@/data/hdp'
import { teachersForStudents } from '@/data/timetable'

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

describe('confirmPattern / dismissPattern', () => {
  it('confirmPattern persists and survives a reload (loadPatterns reflects it)', () => {
    localStorage.setItem(
      'hdp_tags',
      JSON.stringify([
        makeTag({ id: 't1', studentId: 'x1', context: 'lesson' }),
        makeTag({ id: 't2', studentId: 'x1', context: 'cca' }),
      ]),
    )
    const [candidate] = detectFormingPatterns('x1')
    const confirmed = confirmPattern(candidate.id, 'lee-sy')
    expect(confirmed.status).toBe('confirmed')
    expect(confirmed.confirmedBy).toBe('lee-sy')

    // "Reload": read straight from storage, not the in-memory return value.
    const reloaded = loadPatterns().find((p) => p.id === candidate.id)
    expect(reloaded?.status).toBe('confirmed')
    expect(reloaded?.confirmedBy).toBe('lee-sy')
  })

  it('dismissPattern persists — the pattern does not resurface as a candidate', () => {
    localStorage.setItem(
      'hdp_tags',
      JSON.stringify([
        makeTag({ id: 't1', studentId: 'x2', context: 'lesson' }),
        makeTag({ id: 't2', studentId: 'x2', context: 'cca' }),
      ]),
    )
    const [candidate] = detectFormingPatterns('x2')
    dismissPattern(candidate.id)
    expect(detectFormingPatterns('x2')).toEqual([])
  })
})

describe('tagsForStudentVisible', () => {
  it('form-teacher viewer sees all active tags for a student in her form class', () => {
    // Student '1' is a real 3A student — CURRENT_TEACHER's form class.
    localStorage.setItem(
      'hdp_tags',
      JSON.stringify([
        makeTag({ id: 't1', studentId: '1', authorId: 'lee-sy' }),
        makeTag({ id: 't2', studentId: '1', authorId: 'goh-wt' }),
        makeTag({ id: 't3', studentId: '1', authorId: 'raj-v' }),
      ]),
    )
    const visible = tagsForStudentVisible('1', CURRENT_TEACHER.id, false)
    expect(visible.map((t) => t.id).sort()).toEqual(['t1', 't2', 't3'])
  })

  it('a non-form-teacher viewer sees only her own tags plus confirmed-pattern tags', () => {
    // Student '11' is a real 3B student — not CURRENT_TEACHER's form class.
    localStorage.setItem(
      'hdp_tags',
      JSON.stringify([
        makeTag({ id: 't1', studentId: '11', authorId: 'goh-wt' }),
        makeTag({ id: 't2', studentId: '11', authorId: 'raj-v' }),
        makeTag({ id: 't3', studentId: '11', authorId: 'kumar-a' }),
      ]),
    )
    localStorage.setItem(
      'hdp_patterns',
      JSON.stringify([
        {
          id: 'pattern-11-curiosity',
          studentId: '11',
          disposition: 'curiosity',
          contexts: ['lesson', 'cca'],
          tagIds: ['t3'],
          status: 'confirmed',
          confirmedBy: 'goh-wt',
          schoolYear: '2026',
        } satisfies FormingPattern,
      ]),
    )
    const visible = tagsForStudentVisible('11', 'goh-wt', false)
    // 'goh-wt' sees her own tag (t1) plus t3 (in a confirmed pattern), not t2.
    expect(visible.map((t) => t.id).sort()).toEqual(['t1', 't3'])
  })

  it('fullRiver: true shows the same non-form-teacher viewer every tag', () => {
    localStorage.setItem(
      'hdp_tags',
      JSON.stringify([
        makeTag({ id: 't1', studentId: '11', authorId: 'goh-wt' }),
        makeTag({ id: 't2', studentId: '11', authorId: 'raj-v' }),
      ]),
    )
    const visible = tagsForStudentVisible('11', 'goh-wt', true)
    expect(visible.map((t) => t.id).sort()).toEqual(['t1', 't2'])
  })
})

function makeBroadcast(overrides: Partial<BroadcastRequest>): BroadcastRequest {
  return {
    id: 'b-test',
    formClassId: '3A',
    requesterId: 'lee-sy',
    studentIds: ['1'],
    recipientIds: ['goh-wt'],
    message: 'test',
    createdAt: '2026-07-10T09:00:00+08:00',
    responses: [],
    ...overrides,
  }
}

describe('canBroadcast / createBroadcast — cooldown and outstanding', () => {
  it('is ok (true) for a class with no broadcast history', () => {
    expect(canBroadcast('unseeded-class')).toEqual({ ok: true })
  })

  it('is false (outstanding) while a recipient has given zero responses', () => {
    localStorage.setItem(
      'hdp_broadcasts',
      JSON.stringify([
        makeBroadcast({
          recipientIds: ['goh-wt', 'kumar-a'],
          responses: [], // neither recipient has responded at all
        }),
      ]),
    )
    const result = canBroadcast('3A')
    expect(result).toEqual({ ok: false, reason: 'outstanding' })
  })

  it('is false (cooldown) within 7 days of the last broadcast once every recipient has answered', () => {
    const NOW = new Date('2026-07-13T09:00:00+08:00') // 3 days after the fixture's createdAt
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    localStorage.setItem(
      'hdp_broadcasts',
      JSON.stringify([
        makeBroadcast({
          recipientIds: ['goh-wt'],
          responses: [
            {
              recipientId: 'goh-wt',
              studentId: '1',
              result: { kind: 'nothing-stood-out' },
              respondedAt: '2026-07-10T10:00:00+08:00',
            },
          ],
        }),
      ]),
    )
    const result = canBroadcast('3A')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('cooldown')
  })

  it('is true after 7 days once every recipient has answered', () => {
    const NOW = new Date('2026-07-18T09:00:00+08:00') // 8 days after the fixture's createdAt
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    localStorage.setItem(
      'hdp_broadcasts',
      JSON.stringify([
        makeBroadcast({
          recipientIds: ['goh-wt'],
          responses: [
            {
              recipientId: 'goh-wt',
              studentId: '1',
              result: { kind: 'nothing-stood-out' },
              respondedAt: '2026-07-10T10:00:00+08:00',
            },
          ],
        }),
      ]),
    )
    expect(canBroadcast('3A')).toEqual({ ok: true })
  })

  it('createBroadcast throws when canBroadcast is blocked', () => {
    localStorage.setItem(
      'hdp_broadcasts',
      JSON.stringify([
        makeBroadcast({ recipientIds: ['goh-wt'], responses: [] }),
      ]),
    )
    expect(() =>
      createBroadcast({
        formClassId: '3A',
        requesterId: 'lee-sy',
        studentIds: ['1'],
        recipientIds: ['goh-wt'],
        message: 'Anything stand out?',
      }),
    ).toThrow()
  })

  it('createBroadcast persists a new broadcast when not blocked', () => {
    localStorage.setItem('hdp_broadcasts', JSON.stringify([]))
    const broadcast = createBroadcast({
      formClassId: '3A',
      requesterId: 'lee-sy',
      studentIds: ['1', '2'],
      recipientIds: ['goh-wt'],
      message: 'Anything stand out?',
    })
    expect(loadBroadcasts().map((b) => b.id)).toContain(broadcast.id)
    expect(broadcast.responses).toEqual([])
  })
})

describe('respondToBroadcast', () => {
  it('a nothing-stood-out response marks the student covered via coverageForClass', () => {
    localStorage.setItem('hdp_tags', JSON.stringify([]))
    localStorage.setItem(
      'hdp_broadcasts',
      JSON.stringify([
        makeBroadcast({
          id: 'b1',
          studentIds: ['1'],
          recipientIds: ['goh-wt'],
          responses: [],
        }),
      ]),
    )
    respondToBroadcast('b1', 'goh-wt', '1', { kind: 'nothing-stood-out' })
    const snapshot = coverageForClass('3A')
    expect(snapshot.covered).toBe(1)
    expect(snapshot.reviewedNil).toBe(1)
    expect(nilsForStudent('1')).toHaveLength(1)
  })

  it('a tag response creates a tag with source "broadcast" and the response references its id', () => {
    localStorage.setItem('hdp_tags', JSON.stringify([]))
    localStorage.setItem(
      'hdp_broadcasts',
      JSON.stringify([
        makeBroadcast({
          id: 'b2',
          studentIds: ['1'],
          recipientIds: ['goh-wt'],
          responses: [],
        }),
      ]),
    )
    const response = respondToBroadcast('b2', 'goh-wt', '1', {
      kind: 'tag',
      tagInput: {
        studentId: '1',
        authorId: 'goh-wt',
        disposition: 'curiosity',
        context: 'lesson',
        entryPoint: 'topbar',
      },
    })
    expect(response.result.kind).toBe('tag')
    const tagId = response.result.kind === 'tag' ? response.result.tagId : ''
    const tag = loadTags().find((t) => t.id === tagId)
    expect(tag).toBeDefined()
    expect(tag?.source).toBe('broadcast')
    expect(tag?.authorId).toBe('goh-wt')
  })
})

describe('teachersForStudents', () => {
  it('returns the union of timetabled teachers across students, with no duplicates', () => {
    // '1' and '2' are 3A students — goh-wt, kumar-a, raj-v all teach 3A.
    const teachers = teachersForStudents(['1', '2'])
    expect(new Set(teachers).size).toBe(teachers.length)
    expect(teachers.sort()).toEqual(['goh-wt', 'kumar-a', 'raj-v'].sort())
  })

  it('never returns a teacher with no timetabled overlap with the given students', () => {
    // '11' is a 3B student — only lee-sy and kumar-a are timetabled to 3B.
    const teachers = teachersForStudents(['11'])
    expect(teachers.sort()).toEqual(['kumar-a', 'lee-sy'].sort())
    expect(teachers).not.toContain('raj-v')
  })
})

describe('dispositionMix', () => {
  it('proportions sum to the tag count', () => {
    const tags = [
      makeTag({ id: 't1', disposition: 'curiosity' }),
      makeTag({ id: 't2', disposition: 'curiosity' }),
      makeTag({ id: 't3', disposition: 'perseverance' }),
      makeTag({ id: 't4', disposition: 'collaboration' }),
    ]
    const mix = dispositionMix(tags)
    expect(mix.curiosity).toBe(2)
    expect(mix.perseverance).toBe(1)
    expect(mix.collaboration).toBe(1)
    expect(mix['self-direction']).toBe(0)
    const total = Object.values(mix).reduce((a, b) => a + b, 0)
    expect(total).toBe(tags.length)
  })
})

describe('summaryForTeacher', () => {
  it('orders most-noted top-3 by tag count, reports thin-record count only for the form class, and includes zero-tag classes as empty sections', () => {
    localStorage.setItem(
      'hdp_tags',
      JSON.stringify([
        // Student '1' (3A, form class): 3 tags — most-noted.
        makeTag({ id: 't1', studentId: '1', authorId: 'lee-sy', term: 3 }),
        makeTag({ id: 't2', studentId: '1', authorId: 'goh-wt', term: 3 }),
        makeTag({ id: 't3', studentId: '1', authorId: 'raj-v', term: 3 }),
        // Student '2' (3A): 1 tag.
        makeTag({ id: 't4', studentId: '2', authorId: 'lee-sy', term: 3 }),
      ]),
    )
    const summary = summaryForTeacher(CURRENT_TEACHER.id)
    const formClassSummary = summary.find((s) => s.classId === '3A')
    expect(formClassSummary?.isFormClass).toBe(true)
    expect(formClassSummary?.mostNoted[0]?.studentId).toBe('1')
    expect(formClassSummary?.mostNoted[0]?.tagCount).toBe(3)
    expect(typeof formClassSummary?.thinRecordCount).toBe('number')

    // Teaching classes (3B, 4A) have zero tags here — empty sections, not
    // omitted from the summary.
    const teachingClassSummary = summary.find((s) => s.classId === '3B')
    expect(teachingClassSummary).toBeDefined()
    expect(teachingClassSummary?.tagCount).toBe(0)
    expect(teachingClassSummary?.mostNoted).toEqual([])
    expect(teachingClassSummary?.thinRecordCount).toBeUndefined()
  })

  it('for a teaching (non-form) class, a colleague note outside any confirmed pattern never appears in quotes or counts; candidate patterns appear only for the form class', () => {
    localStorage.setItem(
      'hdp_tags',
      JSON.stringify([
        // Student '11' (3B, teaching class): a colleague's unconfirmed note.
        makeTag({
          id: 't1',
          studentId: '11',
          authorId: 'goh-wt',
          term: 3,
          note: 'A note only goh-wt should be able to see',
          context: 'lesson',
        }),
        makeTag({
          id: 't2',
          studentId: '11',
          authorId: 'raj-v',
          term: 3,
          note: 'Another distinct-context note from a different colleague',
          context: 'cca',
        }),
      ]),
    )
    const summary = summaryForTeacher(CURRENT_TEACHER.id)
    const teachingClassSummary = summary.find((s) => s.classId === '3B')
    expect(teachingClassSummary?.tagCount).toBe(0)
    expect(teachingClassSummary?.recentQuotes).toEqual([])
    expect(teachingClassSummary?.candidatePatterns).toEqual([])

    const formClassSummary = summary.find((s) => s.classId === '3A')
    // Candidate patterns are only ever populated for the form class section.
    expect(formClassSummary).toBeDefined()
  })
})
