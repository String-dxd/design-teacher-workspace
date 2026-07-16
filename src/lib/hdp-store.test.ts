import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  addTag,
  confirmDraft,
  confirmPattern,
  coverageForClass,
  deleteTag,
  detectFormingPatterns,
  dismissPattern,
  dispositionMix,
  draftId,
  findDraft,
  loadDrafts,
  loadPatterns,
  loadTags,
  logEvent,
  markSynced,
  reopenDraft,
  saveDraft,
  seedIfEmpty,
  summaryForTeacher,
  tagsForStudentVisible,
  unsyncedConfirmedDrafts,
  updateTag,
} from './hdp-store'
import type { AddTagInput } from './hdp-store'
import type { FormingPattern, HdpDraft, HdpTag } from '@/types/hdp'
import { CURRENT_TEACHER } from '@/data/hdp'

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
