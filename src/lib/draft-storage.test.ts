import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  clearDraft,
  daysRemaining,
  loadDraft,
  saveDraft,
} from './draft-storage'
import type { DraftData } from './draft-storage'

// Under this repo's vitest/jsdom/Node combination, `globalThis.localStorage`
// occasionally comes back `undefined` in a worker (Node's own built-in
// `localStorage` global races with jsdom's environment-provided Storage —
// unrelated to draft-storage.ts itself). Install a minimal in-memory
// Storage-compatible stub so these tests exercise the real saveDraft/
// loadDraft against a real Storage contract deterministically, regardless
// of which one the worker happened to wire up.
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

function makeDraft(overrides: Partial<DraftData> = {}): DraftData {
  return {
    savedAt: '',
    title: '',
    description: '',
    shortcuts: [],
    websiteLinks: [],
    recipients: [],
    staffInCharge: [],
    enquiryEmail: '',
    responseType: 'view-only',
    dueDate: '',
    reminderType: 'none',
    reminderDate: '',
    questions: [],
    eventStart: '',
    eventStartTime: '',
    eventEnd: '',
    eventEndTime: '',
    venue: '',
    sendOption: 'now',
    scheduledDate: '',
    scheduledTime: '',
    filesMeta: [],
    photosMeta: [],
    coverPhotoIndices: [],
    ...overrides,
  }
}

afterEach(() => {
  localStorage.clear()
  vi.useRealTimers()
})

describe('loadDraft', () => {
  it('returns null when nothing has been saved', () => {
    expect(loadDraft()).toBeNull()
  })
})

describe('saveDraft / loadDraft', () => {
  it('round-trips a DraftData object', () => {
    const draft = makeDraft({
      title: 'Hello world',
      enquiryEmail: 'test@example.com',
    })
    saveDraft(draft)
    const loaded = loadDraft()
    expect(loaded).not.toBeNull()
    expect(loaded?.title).toBe('Hello world')
    expect(loaded?.enquiryEmail).toBe('test@example.com')
  })
})

describe('clearDraft', () => {
  it('returns null after clearing a saved draft', () => {
    saveDraft(makeDraft({ title: 'To be cleared' }))
    clearDraft()
    expect(loadDraft()).toBeNull()
  })
})

describe('loadDraft with corrupted storage', () => {
  it('returns null when localStorage contains invalid JSON', () => {
    localStorage.setItem('pg-new-post-draft', '{not json')
    expect(loadDraft()).toBeNull()
  })
})

describe('loadDraft shape validation', () => {
  it('patches missing array fields (questions, photosMeta) from an old-version draft', () => {
    const oldDraft = {
      savedAt: '2026-01-01T00:00:00Z',
      title: 'Old draft',
      description: '',
      shortcuts: [],
      websiteLinks: [],
      recipients: [],
      staffInCharge: [],
      enquiryEmail: '',
      responseType: 'view-only',
      dueDate: '',
      reminderType: 'none',
      reminderDate: '',
      // questions intentionally missing
      eventStart: '',
      eventStartTime: '',
      eventEnd: '',
      eventEndTime: '',
      venue: '',
      sendOption: 'now',
      scheduledDate: '',
      scheduledTime: '',
        filesMeta: [],
      // photosMeta intentionally missing
      coverPhotoIndices: [],
    }
    localStorage.setItem('pg-new-post-draft', JSON.stringify(oldDraft))
    const loaded = loadDraft()
    expect(loaded).not.toBeNull()
    expect(loaded?.questions).toEqual([])
    expect(loaded?.photosMeta).toEqual([])
  })

  it('returns null when the stored value is a JSON primitive (null literal or string)', () => {
    localStorage.setItem('pg-new-post-draft', 'null')
    expect(loadDraft()).toBeNull()

    localStorage.setItem('pg-new-post-draft', '"a string"')
    expect(loadDraft()).toBeNull()
  })

  it('returns null when the stored object is missing savedAt', () => {
    const draft = { title: 'No savedAt', questions: [], photosMeta: [] }
    localStorage.setItem('pg-new-post-draft', JSON.stringify(draft))
    expect(loadDraft()).toBeNull()
  })
})

describe('saveDraft / loadDraft — full round-trip characterization', () => {
  // Mirrors the field list passed to saveDraft() in the autosave effect of
  // announcements.new.tsx (~line 1086) and its 27-dependency effect array
  // (~line 1119). If a future edit adds/removes a DraftData field without
  // updating this list, this test is the tripwire.
  const EXPECTED_DRAFT_FIELDS = [
    'savedAt',
    'title',
    'description',
    'shortcuts',
    'websiteLinks',
    'recipients',
    'staffInCharge',
    'enquiryEmail',
    'responseType',
    'dueDate',
    'reminderType',
    'reminderDate',
    'questions',
    'eventStart',
    'eventStartTime',
    'eventEnd',
    'eventEndTime',
    'venue',
    'sendOption',
    'scheduledDate',
    'scheduledTime',
    'filesMeta',
    'photosMeta',
    'coverPhotoIndices',
  ] as const

  it('persists exactly the fields the autosave effect writes today', () => {
    saveDraft(makeDraft({ title: 'field census' }))
    const loaded = loadDraft()
    expect(loaded).not.toBeNull()
    expect(Object.keys(loaded!).sort()).toEqual(
      [...EXPECTED_DRAFT_FIELDS].sort(),
    )
  })

  it('round-trips a fully populated draft bit-for-bit', () => {
    const draft: DraftData = {
      savedAt: '2026-07-01T00:00:00.000Z',
      title: 'Sports Day',
      description: '<p>Come join us on the field</p>',
      shortcuts: [{ label: 'RSVP', url: 'https://example.com/rsvp' }],
      websiteLinks: [{ label: 'Info page', url: 'https://example.com/info' }],
      recipients: [
        {
          id: 'class:3A',
          label: '3A',
          type: 'group',
          count: 20,
          groupType: 'class',
        },
      ],
      staffInCharge: [
        { id: 's1', label: 'Mr Tan', type: 'individual', count: 1 },
      ],
      enquiryEmail: 'office@example.edu.sg',
      responseType: 'acknowledge',
      dueDate: '2026-07-10',
      reminderType: 'one-time',
      reminderDate: '2026-07-08',
      questions: [
        { id: 'q1', text: 'Will you attend?', type: 'yes-no', required: true },
      ],
      eventStart: '2026-07-10',
      eventStartTime: '09:00',
      eventEnd: '2026-07-10',
      eventEndTime: '11:00',
      venue: 'Main Hall',
      sendOption: 'scheduled',
      scheduledDate: '2026-07-05',
      scheduledTime: '08:30',
      filesMeta: [
        { name: 'a.pdf', size: 1024, uploadedAt: '2026-07-01T00:00:00.000Z' },
      ],
      photosMeta: [
        {
          name: 'b.png',
          size: 2048,
          uploadedAt: '2026-07-01T00:00:00.000Z',
          thumbnailUrl: 'data:image/png;base64,AAAA',
        },
      ],
      coverPhotoIndices: [0, 2],
    }
    saveDraft(draft)
    expect(loadDraft()).toEqual(draft)
  })

  it('does not default missing scalar fields — they come back undefined (characterization, not a spec)', () => {
    // loadDraft only patches the array fields (see arrayFields allowlist);
    // scalar fields like venue/enquiryEmail are passed through as-is.
    const partial = {
      savedAt: '2026-07-01T00:00:00.000Z',
      title: 'Partial draft',
      // description, enquiryEmail, venue, etc. intentionally omitted
    }
    localStorage.setItem('pg-new-post-draft', JSON.stringify(partial))
    const loaded = loadDraft()
    expect(loaded).not.toBeNull()
    expect(loaded?.title).toBe('Partial draft')
    expect(loaded?.description).toBeUndefined()
    expect(loaded?.venue).toBeUndefined()
    expect(loaded?.enquiryEmail).toBeUndefined()
    // ...but the array-field allowlist still kicks in and defaults to []
    expect(loaded?.questions).toEqual([])
    expect(loaded?.filesMeta).toEqual([])
  })

  it('coerces non-array values in array fields to [] rather than passing them through', () => {
    const malformed = {
      savedAt: '2026-07-01T00:00:00.000Z',
      title: 'Malformed',
      websiteLinks: 'not-an-array',
      questions: null,
      coverPhotoIndices: { 0: true },
    }
    localStorage.setItem('pg-new-post-draft', JSON.stringify(malformed))
    const loaded = loadDraft()
    expect(loaded?.websiteLinks).toEqual([])
    expect(loaded?.questions).toEqual([])
    expect(loaded?.coverPhotoIndices).toEqual([])
  })

  it('preserves unknown extra properties on array-item objects (e.g. a future _key field on websiteLinks rows added by plan 022)', () => {
    // Characterizes that saveDraft/loadDraft round-trip whatever shape the
    // caller gives them for array items — draft-storage.ts never strips or
    // validates individual row fields, only the outer array-ness. This is
    // load-bearing for branch advisor/022-react-quickies, which adds a
    // `_key: string` to each websiteLinks row for React list keys.
    const draft = makeDraft({
      websiteLinks: [
        {
          label: 'Site',
          url: 'https://example.com',
          _key: 'uuid-123',
        } as unknown as DraftData['websiteLinks'][number],
      ],
    })
    saveDraft(draft)
    const loaded = loadDraft()
    const row = loaded?.websiteLinks[0] as unknown as Record<string, unknown>
    expect(row).toMatchObject({ label: 'Site', url: 'https://example.com' })
    expect(row._key).toBe('uuid-123')
  })
})

describe('daysRemaining', () => {
  const NOW = new Date('2026-06-10T00:00:00Z')

  it('returns 30 when uploaded today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    expect(daysRemaining('2026-06-10T00:00:00Z')).toBe(30)
  })

  it('returns 0 when uploaded more than 30 days ago (clamped)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    // 31 days before NOW
    expect(daysRemaining('2026-05-10T00:00:00Z')).toBe(0)
  })

  it('returns 1 when 29.5 days have elapsed (Math.ceil)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    // 29.5 days before NOW → 0.5 days remaining → Math.ceil(0.5) = 1
    const uploadedAt = new Date(
      NOW.getTime() - 29.5 * 24 * 60 * 60 * 1000,
    ).toISOString()
    expect(daysRemaining(uploadedAt)).toBe(1)
  })
})
