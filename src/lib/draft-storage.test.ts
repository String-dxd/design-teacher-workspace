import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearDraft,
  daysRemaining,
  loadDraft,
  saveDraft,
} from './draft-storage'
import type { DraftData } from './draft-storage'

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
    staffRoles: {},
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
      staffRoles: {},
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
