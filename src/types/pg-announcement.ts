export type PGStatus = 'draft' | 'posted' | 'scheduled'
export type ReadStatus = 'read' | 'unread'
export type PGOwnership = 'mine' | 'shared'
export type PGRole = 'editor' | 'viewer'

export interface StaffInChargeMember {
  id: string // matches MOCK_STAFF id
  name: string // display name without salutation
  role: PGRole
}

export interface PGQuestion {
  id: string
  text: string
  type: 'free-text' | 'mcq'
  options?: Array<string>
  showAfter?: 'yes' | 'no' | 'both'
}

export interface Shortcut {
  label: string
  url: string
}

export interface PGWebsiteLink {
  label: string
  url: string
}

export interface PGRecipient {
  studentId: string
  studentName: string
  indexNo?: string // class index number e.g. "01"
  classLabel: string
  parentName: string
  parentRelationship?: string // e.g. 'Father', 'Mother', 'Guardian'
  parentContact?: string // mobile number e.g. '9123 4567'
  pgStatus: 'onboarded' | 'not_onboarded' // whether parent has PG account
  readStatus: ReadStatus
  readAt?: string // ISO timestamp if read
  acknowledgedAt?: string // ISO timestamp if acknowledged (acknowledge type)
  formResponse?: 'yes' | 'no' // response for yes-no type
  respondedAt?: string // ISO timestamp if responded (acknowledge or yes-no)
  questionAnswers?: Record<string, string> // keyed by question id
}

export interface PGAttachment {
  name: string
  size: string // e.g. "320 KB"
}

export interface PGAnnouncement {
  id: string
  title: string
  description: string // stores HTML for rich text
  shortcuts: Array<Shortcut>
  websiteLinks: Array<PGWebsiteLink> // replaces websiteLink?: string
  attachments?: Array<PGAttachment>
  status: PGStatus
  recipients: Array<PGRecipient> // empty [] for drafts/scheduled
  staffInCharge: Array<StaffInChargeMember>
  enquiryEmail: string
  ownership: PGOwnership
  role: PGRole
  createdAt: string
  postedAt?: string
  scheduledAt?: string // set when status === 'scheduled'
  responseType?: 'view-only' | 'acknowledge' | 'yes-no'
  dueDate?: string // ISO date string for acknowledge/yes-no
  questions?: Array<PGQuestion>
  linkedFormId?: string // links to a standalone form from the Forms section
}
