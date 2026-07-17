import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  acknowledgeReport,
  addTag,
  bookByStudentToken,
  bookByToken,
  canBroadcast,
  confirmDraft,
  confirmPattern,
  coverReflection,
  coverageForClass,
  createBroadcast,
  deleteTag,
  detectFormingPatterns,
  dismissPattern,
  dispositionMix,
  draftId,
  findDraft,
  loadBroadcasts,
  loadDrafts,
  loadMarks,
  loadPatterns,
  loadReflections,
  loadReportBooks,
  loadTags,
  logEvent,
  markSynced,
  nilsForStudent,
  reactToPattern,
  reflectionGatesShare,
  releaseToStudent,
  reopenDraft,
  respondToBroadcast,
  restorePattern,
  retirePatternFromFamily,
  saveDraft,
  saveMarkEntry,
  saveReflection,
  saveReportBook,
  seedIfEmpty,
  semesterAverage,
  shareReportBook,
  submitStudentReflection,
  summaryForTeacher,
  syncAcademicResults,
  tagsForStudentVisible,
  unsyncedConfirmedDrafts,
  updateTag,
} from './hdp-store'
import type { AddTagInput } from './hdp-store'
import type {
  BroadcastRequest,
  FormingPattern,
  HdpDraft,
  HdpReportBook,
  HdpTag,
} from '@/types/hdp'
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

  it('does not overwrite existing data from the current seed version', () => {
    // First call stamps hdp_seed_version; in-session edits after that must
    // survive later calls.
    seedIfEmpty()
    localStorage.setItem('hdp_patterns', JSON.stringify([]))
    seedIfEmpty()
    expect(loadPatterns()).toEqual([])
  })

  it('wipes and reseeds a store from an older seed version', () => {
    localStorage.setItem('hdp_seed_version', 'stale')
    localStorage.setItem('hdp_patterns', JSON.stringify([]))
    seedIfEmpty()
    expect(loadPatterns().length).toBeGreaterThan(0)
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

// ── Student pattern reactions + light curation (plan 041) ────────────────

function makeConfirmedPattern(
  overrides: Partial<FormingPattern> = {},
): FormingPattern {
  return {
    id: 'pattern-react-1',
    studentId: 'react-1',
    disposition: 'perseverance',
    contexts: ['lesson', 'cca'],
    tagIds: ['t1', 't2'],
    status: 'confirmed',
    confirmedBy: 'lee-sy',
    schoolYear: '2026',
    ...overrides,
  }
}

describe('reactToPattern', () => {
  it('persists a reaction and an optional note', () => {
    localStorage.setItem(
      'hdp_patterns',
      JSON.stringify([makeConfirmedPattern()]),
    )
    const updated = reactToPattern(
      'pattern-react-1',
      'add-my-side',
      'It was harder than it looked.',
    )
    expect(updated.studentReaction).toBe('add-my-side')
    expect(updated.studentNote).toBe('It was harder than it looked.')
    const reloaded = loadPatterns().find((p) => p.id === 'pattern-react-1')
    expect(reloaded?.studentReaction).toBe('add-my-side')
  })

  it('is changeable until the book is parent-shared, then throws (freeze like reflections)', () => {
    localStorage.setItem(
      'hdp_patterns',
      JSON.stringify([
        makeConfirmedPattern({
          id: 'pattern-react-2',
          studentId: 'react-2',
        }),
      ]),
    )
    saveReportBook(makeReportBook({ studentId: 'react-2' }))
    reactToPattern('pattern-react-2', 'agree')
    expect(
      loadPatterns().find((p) => p.id === 'pattern-react-2')?.studentReaction,
    ).toBe('agree')

    reactToPattern('pattern-react-2', 'more-complicated', 'Actually, no.')
    expect(
      loadPatterns().find((p) => p.id === 'pattern-react-2')?.studentReaction,
    ).toBe('more-complicated')

    shareReportBook('react-2')
    expect(() => reactToPattern('pattern-react-2', 'agree')).toThrow()
  })
})

describe('retirePatternFromFamily / restorePattern', () => {
  it('flips status to retired-by-student and back to confirmed', () => {
    localStorage.setItem(
      'hdp_patterns',
      JSON.stringify([
        makeConfirmedPattern({ id: 'pattern-retire-1', studentId: 'retire-1' }),
      ]),
    )
    const retired = retirePatternFromFamily('pattern-retire-1')
    expect(retired.status).toBe('retired-by-student')

    const restored = restorePattern('pattern-retire-1')
    expect(restored.status).toBe('confirmed')
    expect(restored.confirmedBy).toBe('lee-sy')
  })

  it('teacher visibility is unaffected — the pattern still appears in loadPatterns', () => {
    localStorage.setItem(
      'hdp_patterns',
      JSON.stringify([
        makeConfirmedPattern({ id: 'pattern-retire-2', studentId: 'retire-2' }),
      ]),
    )
    retirePatternFromFamily('pattern-retire-2')
    const stillThere = loadPatterns().find((p) => p.id === 'pattern-retire-2')
    expect(stillThere).toBeDefined()
    expect(stillThere?.status).toBe('retired-by-student')
  })

  it('throws when retiring a non-confirmed pattern, or restoring a non-retired one', () => {
    localStorage.setItem(
      'hdp_patterns',
      JSON.stringify([
        makeConfirmedPattern({
          id: 'pattern-retire-3',
          studentId: 'retire-3',
          status: 'candidate',
          confirmedBy: undefined,
        }),
      ]),
    )
    expect(() => retirePatternFromFamily('pattern-retire-3')).toThrow()
    expect(() => restorePattern('pattern-retire-3')).toThrow()
  })

  it('is frozen once the book is parent-shared', () => {
    localStorage.setItem(
      'hdp_patterns',
      JSON.stringify([
        makeConfirmedPattern({ id: 'pattern-retire-4', studentId: 'retire-4' }),
      ]),
    )
    saveReportBook(makeReportBook({ studentId: 'retire-4' }))
    shareReportBook('retire-4')
    expect(() => retirePatternFromFamily('pattern-retire-4')).toThrow()
  })
})

describe('reflectionGatesShare', () => {
  it('is false with fewer than three sentences and true with three or more', () => {
    saveReflection({
      studentId: 'gate-1',
      text: 'One sentence. Two sentences.',
      writtenAt: '2026-07-16T10:00:00+08:00',
      chosenAsCover: true,
    })
    expect(reflectionGatesShare('gate-1')).toBe(false)

    saveReflection({
      studentId: 'gate-2',
      text: 'One sentence. Two sentences. Three sentences.',
      writtenAt: '2026-07-16T10:00:00+08:00',
      chosenAsCover: true,
    })
    expect(reflectionGatesShare('gate-2')).toBe(true)
  })

  it('handles trailing whitespace and punctuation without inflating the count', () => {
    saveReflection({
      studentId: 'gate-3',
      text: '  One!   Two? Three...   ',
      writtenAt: '2026-07-16T10:00:00+08:00',
      chosenAsCover: true,
    })
    expect(reflectionGatesShare('gate-3')).toBe(true)
  })

  it('is false when the student has no reflection at all', () => {
    expect(reflectionGatesShare('no-such-student-gate')).toBe(false)
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

// ── Draft Studio / Review & Sync (plan 032) ─────────────────────────────

function makeDraft(overrides: Partial<HdpDraft> = {}): HdpDraft {
  return {
    id: 'draft-test-1',
    studentId: '99',
    kind: 'overall',
    authorId: CURRENT_TEACHER.id,
    status: 'draft',
    claims: [{ text: 'A sourceless sentence.' }],
    ...overrides,
  }
}

describe('draft confirm/reopen/sync', () => {
  it('confirmDraft sets status to confirmed and stamps confirmedAt', () => {
    saveDraft(makeDraft())
    const confirmed = confirmDraft('draft-test-1')
    expect(confirmed.status).toBe('confirmed')
    expect(confirmed.confirmedAt).toBeDefined()
    expect(loadDrafts().find((d) => d.id === 'draft-test-1')?.status).toBe(
      'confirmed',
    )
  })

  it('confirmDraft drops claims with blank or whitespace-only text', () => {
    saveDraft(
      makeDraft({
        claims: [
          { text: 'A real sentence with content.' },
          { text: '' },
          { text: '   ' },
        ],
      }),
    )
    const confirmed = confirmDraft('draft-test-1')
    expect(confirmed.claims).toEqual([
      { text: 'A real sentence with content.' },
    ])
    expect(loadDrafts().find((d) => d.id === 'draft-test-1')?.claims).toEqual([
      { text: 'A real sentence with content.' },
    ])
  })

  it('persists insightIds and reconcile (Prototype B, plan 040)', () => {
    saveDraft(
      makeDraft({
        insightIds: ['insight-99-attendance', 'insight-99-observation-tag-1'],
        reconcile: { fired: true, resolution: 'kept-with-context' },
      }),
    )
    const loaded = loadDrafts().find((d) => d.id === 'draft-test-1')
    expect(loaded?.insightIds).toEqual([
      'insight-99-attendance',
      'insight-99-observation-tag-1',
    ])
    expect(loaded?.reconcile).toEqual({
      fired: true,
      resolution: 'kept-with-context',
    })

    // confirmDraft spreads the existing draft, so a reconcile decision set
    // before confirming survives the freeze.
    const confirmed = confirmDraft('draft-test-1')
    expect(confirmed.insightIds).toEqual([
      'insight-99-attendance',
      'insight-99-observation-tag-1',
    ])
    expect(confirmed.reconcile).toEqual({
      fired: true,
      resolution: 'kept-with-context',
    })
  })

  it('reopenDraft sets status back to draft and clears confirmedAt/syncedAt', () => {
    saveDraft(
      makeDraft({
        status: 'confirmed',
        confirmedAt: '2026-07-14T08:00:00+08:00',
        syncedAt: '2026-07-14T09:00:00+08:00',
      }),
    )
    const reopened = reopenDraft('draft-test-1')
    expect(reopened.status).toBe('draft')
    expect(reopened.confirmedAt).toBeUndefined()
    expect(reopened.syncedAt).toBeUndefined()
  })

  it('confirmDraft/reopenDraft throw on an unknown draft id', () => {
    expect(() => confirmDraft('nope')).toThrow()
    expect(() => reopenDraft('nope')).toThrow()
  })

  it('markSynced sets syncedAt on the named drafts only', () => {
    saveDraft(makeDraft({ id: 'draft-test-1', status: 'confirmed' }))
    saveDraft(
      makeDraft({ id: 'draft-test-2', studentId: '98', status: 'confirmed' }),
    )
    markSynced(['draft-test-1'])
    const drafts = loadDrafts()
    expect(drafts.find((d) => d.id === 'draft-test-1')?.syncedAt).toBeDefined()
    expect(
      drafts.find((d) => d.id === 'draft-test-2')?.syncedAt,
    ).toBeUndefined()
  })

  it('unsyncedConfirmedDrafts returns only confirmed drafts with no syncedAt', () => {
    saveDraft(makeDraft({ id: 'draft-test-1', status: 'draft' }))
    saveDraft(
      makeDraft({ id: 'draft-test-2', studentId: '98', status: 'confirmed' }),
    )
    saveDraft(
      makeDraft({
        id: 'draft-test-3',
        studentId: '97',
        status: 'confirmed',
        syncedAt: '2026-07-14T09:00:00+08:00',
      }),
    )
    const unsynced = unsyncedConfirmedDrafts()
    expect(unsynced.map((d) => d.id)).toEqual(['draft-test-2'])
  })

  it('findDraft locates a draft by studentId + kind (+ subject for subject drafts)', () => {
    saveDraft(makeDraft({ id: 'draft-test-1', kind: 'overall' }))
    saveDraft(
      makeDraft({
        id: 'draft-test-2',
        kind: 'subject',
        subject: 'Mathematics',
      }),
    )
    expect(findDraft('99', 'overall')?.id).toBe('draft-test-1')
    expect(findDraft('99', 'subject', 'Mathematics')?.id).toBe('draft-test-2')
    expect(findDraft('99', 'subject', 'Science')).toBeUndefined()
  })

  it('draftId is deterministic and distinguishes kind/subject', () => {
    expect(draftId('99', 'overall')).toBe(draftId('99', 'overall'))
    expect(draftId('99', 'subject', 'Mathematics')).not.toBe(
      draftId('99', 'subject', 'Science'),
    )
    expect(draftId('99', 'overall')).not.toBe(
      draftId('99', 'subject', 'Science'),
    )
  })
})

// ── Report book sharing + acknowledgement (plan 033) ─────────────────────

function makeReportBook(overrides: Partial<HdpReportBook> = {}): HdpReportBook {
  return {
    studentId: '1',
    schoolYear: '2026',
    semester: 2,
    results: [{ subject: 'Mathematics', term: 3, grade: 'A2' }],
    attendance: { present: 58, total: 60 },
    conduct: 'Good',
    subjectComments: [],
    parentPrompts: ['Ask me about the science fair.'],
    ...overrides,
  }
}

describe('shareReportBook', () => {
  it('snapshots confirmed-draft claims into the book — mutating the draft afterwards does not change the shared book', () => {
    saveReportBook(makeReportBook({ studentId: '1' }))
    saveDraft(
      makeDraft({
        id: 'draft-share-1',
        studentId: '1',
        kind: 'overall',
        status: 'confirmed',
        claims: [{ text: 'Original sentence.' }],
      }),
    )

    const { token } = shareReportBook('1')
    expect(token).toBe('hdp-1')

    const shared = loadReportBooks().find((b) => b.studentId === '1')
    expect(shared?.overallComment?.claims).toEqual([
      { text: 'Original sentence.' },
    ])

    // Mutate the underlying draft after sharing.
    saveDraft(
      makeDraft({
        id: 'draft-share-1',
        studentId: '1',
        kind: 'overall',
        status: 'confirmed',
        claims: [{ text: 'Changed sentence.' }],
      }),
    )

    const stillShared = loadReportBooks().find((b) => b.studentId === '1')
    expect(stillShared?.overallComment?.claims).toEqual([
      { text: 'Original sentence.' },
    ])
  })

  it('drops blank-text claims when snapshotting — defense in depth even if a confirmed draft still carries one', () => {
    saveReportBook(makeReportBook({ studentId: '6' }))
    // Bypasses confirmDraft (which already strips blanks) to prove
    // shareReportBook filters independently at the snapshot point too.
    saveDraft(
      makeDraft({
        id: 'draft-share-blank',
        studentId: '6',
        kind: 'overall',
        status: 'confirmed',
        claims: [{ text: 'A real sentence.' }, { text: '   ' }],
      }),
    )
    shareReportBook('6')
    const shared = loadReportBooks().find((b) => b.studentId === '6')
    expect(shared?.overallComment?.claims).toEqual([
      { text: 'A real sentence.' },
    ])
  })

  it('snapshots insightIds onto the comment only when the source draft carries them (Prototype B, plan 040)', () => {
    saveReportBook(makeReportBook({ studentId: '7' }))
    saveDraft(
      makeDraft({
        id: 'draft-share-insights',
        studentId: '7',
        kind: 'overall',
        status: 'confirmed',
        claims: [{ text: 'Insight-composed sentence.' }],
        insightIds: ['insight-7-attendance', 'insight-7-observation-tag-x'],
      }),
    )
    shareReportBook('7')
    const shared = loadReportBooks().find((b) => b.studentId === '7')
    expect(shared?.overallComment?.insightIds).toEqual([
      'insight-7-attendance',
      'insight-7-observation-tag-x',
    ])
  })

  it('leaves insightIds absent on the comment for an A-path (composeDraft) draft', () => {
    saveReportBook(makeReportBook({ studentId: '8' }))
    saveDraft(
      makeDraft({
        id: 'draft-share-a-path',
        studentId: '8',
        kind: 'overall',
        status: 'confirmed',
        claims: [
          { text: 'A-path sentence.', source: { tagId: 't1', label: 'x' } },
        ],
      }),
    )
    shareReportBook('8')
    const shared = loadReportBooks().find((b) => b.studentId === '8')
    expect(shared?.overallComment?.insightIds).toBeUndefined()
  })

  it('with no confirmed overall draft still shares a results-only book (comments absent)', () => {
    saveReportBook(makeReportBook({ studentId: '2' }))
    const { token } = shareReportBook('2')
    expect(token).toBe('hdp-2')
    const shared = loadReportBooks().find((b) => b.studentId === '2')
    expect(shared?.overallComment).toBeUndefined()
    expect(shared?.subjectComments).toEqual([])
    expect(shared?.sharedAt).toBeDefined()
    expect(shared?.results).toEqual(makeReportBook().results)
  })

  it('throws when no report book exists yet for the student', () => {
    expect(() => shareReportBook('no-such-student')).toThrow()
  })
})

describe('bookByToken', () => {
  it('returns undefined for an unknown token', () => {
    expect(bookByToken('hdp-unknown')).toBeUndefined()
  })

  it('returns undefined for a book that exists but has not been shared', () => {
    saveReportBook(makeReportBook({ studentId: '3' }))
    expect(bookByToken('hdp-3')).toBeUndefined()
  })

  it('returns the book once shared', () => {
    saveReportBook(makeReportBook({ studentId: '3' }))
    shareReportBook('3')
    expect(bookByToken('hdp-3')?.studentId).toBe('3')
  })
})

describe('acknowledgeReport', () => {
  it('idempotence: a second call leaves `at` and `note` unchanged', () => {
    saveReportBook(makeReportBook({ studentId: '4' }))
    shareReportBook('4')
    const first = acknowledgeReport('hdp-4', 'Thank you.')
    const second = acknowledgeReport('hdp-4', 'A different note.')
    expect(second.acknowledgement?.at).toBe(first.acknowledgement?.at)
    expect(second.acknowledgement?.note).toBe(first.acknowledgement?.note)
    expect(second.acknowledgement?.note).toBe('Thank you.')
  })

  it('fills in the one-shot note on a later call when the first call had none', () => {
    saveReportBook(makeReportBook({ studentId: '5' }))
    shareReportBook('5')
    const ack = acknowledgeReport('hdp-5')
    expect(ack.acknowledgement?.note).toBeUndefined()
    const withNote = acknowledgeReport('hdp-5', 'Noted, thanks.')
    expect(withNote.acknowledgement?.at).toBe(ack.acknowledgement?.at)
    expect(withNote.acknowledgement?.note).toBe('Noted, thanks.')
  })

  it('throws for an unknown or unshared token', () => {
    expect(() => acknowledgeReport('hdp-unknown')).toThrow()
  })
})

describe('saveMarkEntry', () => {
  it('upserts by subject + schoolYear + semester + assessment — no duplicate rows', () => {
    saveMarkEntry('marks-1', {
      subject: 'English',
      schoolYear: '2026',
      semester: 2,
      assessment: 'wa1',
      score: 70,
    })
    saveMarkEntry('marks-1', {
      subject: 'English',
      schoolYear: '2026',
      semester: 2,
      assessment: 'wa1',
      score: 75,
    })
    const entries = loadMarks('marks-1').filter(
      (e) =>
        e.subject === 'English' && e.schoolYear === '2026' && e.semester === 2,
    )
    expect(entries).toHaveLength(1)
    expect(entries[0].score).toBe(75)
  })

  it('does not collide entries that share subject + semester across different school years', () => {
    saveMarkEntry('marks-2', {
      subject: 'Mathematics',
      schoolYear: '2025',
      semester: 1,
      assessment: 'wa1',
      score: 60,
    })
    saveMarkEntry('marks-2', {
      subject: 'Mathematics',
      schoolYear: '2026',
      semester: 1,
      assessment: 'wa1',
      score: 80,
    })
    const entries = loadMarks('marks-2')
    expect(entries).toHaveLength(2)
    expect(entries.find((e) => e.schoolYear === '2025')?.score).toBe(60)
    expect(entries.find((e) => e.schoolYear === '2026')?.score).toBe(80)
  })
})

describe('semesterAverage', () => {
  it('averages every assessment recorded for a subject/semester', () => {
    const entries = [
      {
        subject: 'Science',
        schoolYear: '2026' as const,
        semester: 2 as const,
        assessment: 'wa1' as const,
        score: 60,
      },
      {
        subject: 'Science',
        schoolYear: '2026' as const,
        semester: 2 as const,
        assessment: 'wa2' as const,
        score: 70,
      },
    ]
    expect(semesterAverage(entries, 'Science', '2026', 2)).toBe(65)
  })

  it('returns undefined when nothing is recorded for that semester', () => {
    expect(semesterAverage([], 'Science', '2026', 2)).toBeUndefined()
  })
})

describe('syncAcademicResults', () => {
  it('writes results with a grade + change vs the previous semester, and stamps marksSyncedAt', () => {
    saveReportBook(
      makeReportBook({
        studentId: 'marks-sync-1',
        results: [{ subject: 'English', term: 3, grade: 'B3' }],
      }),
    )
    saveMarkEntry('marks-sync-1', {
      subject: 'English',
      schoolYear: '2026',
      semester: 1,
      assessment: 'wa1',
      score: 60,
    })
    saveMarkEntry('marks-sync-1', {
      subject: 'English',
      schoolYear: '2026',
      semester: 2,
      assessment: 'wa1',
      score: 70,
    })

    const book = syncAcademicResults('marks-sync-1')
    const english = book.results.find(
      (r) => r.subject === 'English' && r.term === 4,
    )
    expect(english?.grade).toBe('70')
    expect(english?.change).toBe(10)
    expect(book.marksSyncedAt).toBeDefined()
    // The pre-existing term-3 result is untouched.
    expect(
      book.results.find((r) => r.subject === 'English' && r.term === 3)?.grade,
    ).toBe('B3')
  })

  it('is a snapshot — a later saveMarkEntry does not change the synced book until re-synced', () => {
    saveReportBook(makeReportBook({ studentId: 'marks-sync-2', results: [] }))
    saveMarkEntry('marks-sync-2', {
      subject: 'Mathematics',
      schoolYear: '2026',
      semester: 2,
      assessment: 'wa1',
      score: 70,
    })
    syncAcademicResults('marks-sync-2')

    saveMarkEntry('marks-sync-2', {
      subject: 'Mathematics',
      schoolYear: '2026',
      semester: 2,
      assessment: 'wa1',
      score: 90,
    })
    const book = loadReportBooks().find((b) => b.studentId === 'marks-sync-2')
    expect(
      book?.results.find((r) => r.subject === 'Mathematics' && r.term === 4)
        ?.grade,
    ).toBe('70')

    const resynced = syncAcademicResults('marks-sync-2')
    expect(
      resynced.results.find((r) => r.subject === 'Mathematics' && r.term === 4)
        ?.grade,
    ).toBe('90')
  })

  it('throws when no report book exists yet for the student', () => {
    expect(() => syncAcademicResults('no-such-student')).toThrow()
  })
})

describe('reflections (plan 037)', () => {
  it('seeds from SEED_REFLECTIONS and round-trips a save', () => {
    seedIfEmpty()
    expect(loadReflections('2').length).toBeGreaterThan(0)

    saveReflection({
      studentId: 'refl-1',
      text: 'Sample reflection text.',
      writtenAt: '2026-07-16T10:00:00+08:00',
      chosenAsCover: false,
    })
    expect(loadReflections('refl-1')).toEqual([
      {
        studentId: 'refl-1',
        text: 'Sample reflection text.',
        writtenAt: '2026-07-16T10:00:00+08:00',
        chosenAsCover: false,
      },
    ])
  })

  it('coverReflection returns exactly the chosenAsCover one, even when others are newer', () => {
    saveReflection({
      studentId: 'refl-2',
      text: 'Older, not the cover.',
      writtenAt: '2026-01-01T09:00:00+08:00',
      chosenAsCover: true,
    })
    saveReflection({
      studentId: 'refl-2',
      text: 'Newer, but not chosen.',
      writtenAt: '2026-07-01T09:00:00+08:00',
      chosenAsCover: false,
    })
    expect(coverReflection('refl-2')?.text).toBe('Older, not the cover.')
  })

  it('falls back to the most recent reflection when none is chosenAsCover', () => {
    saveReflection({
      studentId: 'refl-3',
      text: 'First.',
      writtenAt: '2026-01-01T09:00:00+08:00',
      chosenAsCover: false,
    })
    saveReflection({
      studentId: 'refl-3',
      text: 'Second, most recent.',
      writtenAt: '2026-07-01T09:00:00+08:00',
      chosenAsCover: false,
    })
    expect(coverReflection('refl-3')?.text).toBe('Second, most recent.')
  })

  it('returns undefined when the student has no reflections', () => {
    expect(coverReflection('no-such-student')).toBeUndefined()
  })
})

// ── Student-first release (plan 038) ─────────────────────────────────────

describe('releaseToStudent', () => {
  it('throws when there is no confirmed overall draft', () => {
    saveReportBook(makeReportBook({ studentId: 'release-1' }))
    expect(() => releaseToStudent('release-1')).toThrow()
  })

  it('stamps studentReleasedAt and returns a deterministic token', () => {
    saveReportBook(makeReportBook({ studentId: 'release-2' }))
    saveDraft(
      makeDraft({
        id: 'draft-release-2',
        studentId: 'release-2',
        kind: 'overall',
        status: 'confirmed',
      }),
    )
    const { token } = releaseToStudent('release-2')
    expect(token).toBe('hdp-student-release-2')
    const book = loadReportBooks().find((b) => b.studentId === 'release-2')
    expect(book?.studentReleasedAt).toBeDefined()
  })

  it('throws when no report book exists yet for the student', () => {
    saveDraft(
      makeDraft({
        id: 'draft-release-3',
        studentId: 'release-3',
        kind: 'overall',
        status: 'confirmed',
      }),
    )
    expect(() => releaseToStudent('release-3')).toThrow()
  })
})

describe('bookByStudentToken', () => {
  it('resolves a released book by its student token', () => {
    saveReportBook(makeReportBook({ studentId: 'release-4' }))
    saveDraft(
      makeDraft({
        id: 'draft-release-4',
        studentId: 'release-4',
        kind: 'overall',
        status: 'confirmed',
      }),
    )
    const { token } = releaseToStudent('release-4')
    expect(bookByStudentToken(token)?.studentId).toBe('release-4')
  })

  it('returns undefined for an unknown or not-yet-released token', () => {
    expect(bookByStudentToken('hdp-student-nope')).toBeUndefined()
    saveReportBook(makeReportBook({ studentId: 'release-5' }))
    expect(bookByStudentToken('hdp-student-release-5')).toBeUndefined()
  })

  it('does not resolve a parent token as a student token', () => {
    expect(bookByStudentToken('hdp-release-5')).toBeUndefined()
  })
})

describe('submitStudentReflection', () => {
  function releasedToken(studentId: string): string {
    saveReportBook(makeReportBook({ studentId }))
    saveDraft(
      makeDraft({
        id: `draft-${studentId}`,
        studentId,
        kind: 'overall',
        status: 'confirmed',
      }),
    )
    return releaseToStudent(studentId).token
  }

  it('round-trips a reflection and stamps studentReactedAt', () => {
    const token = releasedToken('reflect-1')
    submitStudentReflection(token, 'My honest reflection.')
    expect(coverReflection('reflect-1')?.text).toBe('My honest reflection.')
    expect(coverReflection('reflect-1')?.chosenAsCover).toBe(true)
    const book = loadReportBooks().find((b) => b.studentId === 'reflect-1')
    expect(book?.studentReactedAt).toBeDefined()
  })

  it('replaces the reflection in place on a second submission', () => {
    const token = releasedToken('reflect-2')
    submitStudentReflection(token, 'First draft of my reflection.')
    submitStudentReflection(token, 'Rewritten reflection.')
    expect(loadReflections('reflect-2')).toHaveLength(1)
    expect(coverReflection('reflect-2')?.text).toBe('Rewritten reflection.')
    expect(coverReflection('reflect-2')?.chosenAsCover).toBe(true)
  })

  it('throws once the book has been shared with parents (frozen)', () => {
    const token = releasedToken('reflect-3')
    submitStudentReflection(token, 'Before sharing.')
    shareReportBook('reflect-3')
    expect(() => submitStudentReflection(token, 'After sharing.')).toThrow()
  })

  it('throws for an unknown token', () => {
    expect(() =>
      submitStudentReflection('hdp-student-no-such-student', 'Text.'),
    ).toThrow()
  })
})
