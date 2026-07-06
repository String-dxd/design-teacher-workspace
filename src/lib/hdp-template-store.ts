import type { ReportBlock, ReportLayout } from '@/types/report'

// Prototype persistence for the Report Builder.
// - Template layouts: an admin/HOD "Save template" writes the shared definition here,
//   and the builder loads it so teachers start from the admin's saved version.
// - Share messages: the personal note a teacher writes on the share screen, keyed by
//   report id so the parent-facing guest view can show it. All localStorage (mock).

const templateKey = (id: string) => `hdp_template_${id}`
const shareMsgKey = (reportId: string) => `hdp_share_msg_${reportId}`

export function saveTemplateLayout(
  templateId: string,
  layout: ReportLayout,
): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(templateKey(templateId), JSON.stringify(layout))
  } catch {
    // ignore storage errors
  }
}

export function loadTemplateLayout(templateId: string): ReportLayout | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(templateKey(templateId))
    return raw ? (JSON.parse(raw) as ReportLayout) : null
  } catch {
    return null
  }
}

export function saveShareMessage(reportId: string, message: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(shareMsgKey(reportId), message)
  } catch {
    // ignore storage errors
  }
}

export function loadShareMessage(reportId: string): string {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(shareMsgKey(reportId)) ?? ''
  } catch {
    return ''
  }
}

// The built report's layout + comments, persisted so a freshly-opened parent link
// resolves it (the in-memory mockReports array resets on a full page load).
export interface SharedReport {
  blocks: Array<ReportBlock>
  comments: string
}

const sharedKey = (reportId: string) => `hdp_shared_report_${reportId}`

export function saveSharedReport(reportId: string, data: SharedReport): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(sharedKey(reportId), JSON.stringify(data))
  } catch {
    // ignore storage errors
  }
}

export function loadSharedReport(reportId: string): SharedReport | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(sharedKey(reportId))
    return raw ? (JSON.parse(raw) as SharedReport) : null
  } catch {
    return null
  }
}
