import type { PGRole, PGWebsiteLink, Shortcut } from '@/types/pg-announcement'
import type { FormQuestion, ReminderType, ResponseType } from '@/types/form'
import type { SelectedEntity } from '@/components/comms/entity-selector'

export interface FileMeta {
  name: string
  size: number
  uploadedAt: string // ISO 8601 — used to compute 30-day expiry
  /** Base64 data URL thumbnail (photos only) — stored so the image is visible when a draft is reopened. */
  thumbnailUrl?: string
}

export interface DraftData {
  savedAt: string
  title: string
  description: string
  shortcuts: Array<Shortcut>
  websiteLinks: Array<PGWebsiteLink>
  recipients: Array<SelectedEntity>
  staffInCharge: Array<SelectedEntity>
  enquiryEmail: string
  responseType: ResponseType
  dueDate: string
  reminderType: ReminderType
  reminderDate: string
  questions: Array<FormQuestion>
  eventStart: string
  eventStartTime: string
  eventEnd: string
  eventEndTime: string
  venue: string
  sendOption: 'now' | 'scheduled'
  scheduledDate: string
  scheduledTime: string
  /** Role map for staff-in-charge members: key = staff id, value = role */
  staffRoles: Record<string, PGRole>
  /** Combined metadata for all files (draft stubs + current session). */
  filesMeta: Array<FileMeta>
  /** Combined metadata for all photos (draft stubs + current session). */
  photosMeta: Array<FileMeta>
  /** Serialised Set<number> of cover photo indices. */
  coverPhotoIndices: Array<number>
}

const DRAFT_KEY = 'pg-new-post-draft'

export function saveDraft(data: DraftData): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
  } catch {
    // Quota exceeded or localStorage unavailable — silently ignore
  }
}

export function loadDraft(): DraftData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DraftData
  } catch {
    return null
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // ignore
  }
}

/**
 * Days remaining before a file/photo expires under the 30-day retention policy.
 * Returns 0 when already expired, never negative.
 */
export function daysRemaining(uploadedAt: string): number {
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
  const expiresAt = new Date(uploadedAt).getTime() + THIRTY_DAYS_MS
  const remaining = Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000))
  return Math.max(0, remaining)
}
