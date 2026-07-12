export type FormStatus = 'draft' | 'active' | 'closed'
export type FormOwnership = 'mine' | 'shared'
export type FormType = 'standard'
export type FormSource = 'custom' | 'announcement-response'
export type ResponseType = 'view-only' | 'acknowledge' | 'yes-no'
export type ReminderType = 'none' | 'one-time' | 'daily'

export type QuestionType =
  | 'yes-no'
  | 'mcq'
  | 'checkbox'
  | 'free-text'
  | 'ranking'
  | 'date'
  | 'file-upload'

export interface FormQuestion {
  id: string
  text: string
  type: QuestionType
  options?: Array<string> // for mcq, checkbox, ranking
  required?: boolean
  /** Short supporting text shown under the question, e.g. formatting hints. */
  helperText?: string
}

export interface Form {
  id: string
  title: string
  description: string
  status: FormStatus
  createdAt: string
  recipientCount: number
  completedCount: number
  ownership: FormOwnership
  targetClasses: Array<string>
  formType?: FormType
  source?: FormSource
  linkedAnnouncementId?: string
  responseType?: ResponseType
  questions?: Array<FormQuestion>
  eventStart?: string
  eventEnd?: string
  venue?: string
  dueDate?: string
  reminderType?: ReminderType
  reminderDate?: string
  scheduledAt?: string
}

export interface FormRecipient {
  studentId: string
  studentName: string
  indexNo: string
  classLabel: string
  parentName: string
  parentRelationship: string
  parentContact: string
  pgStatus: 'onboarded' | 'not_onboarded'
  readStatus: 'read' | 'unread'
  readAt?: string
  responseStatus: 'responded' | 'pending'
  respondedAt?: string
  formResponse?: 'yes' | 'no'
  questionAnswers?: Array<string>
}
