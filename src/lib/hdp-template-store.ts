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

// Teacher-saved templates: the current section selection, order, and display
// choices captured under a name, listed alongside the built-in school templates.
export interface CustomTemplate {
  id: string
  name: string
  layout: ReportLayout
}

const CUSTOM_TEMPLATES_KEY = 'hdp_custom_templates'

export function listCustomTemplates(): Array<CustomTemplate> {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_KEY)
    return raw ? (JSON.parse(raw) as Array<CustomTemplate>) : []
  } catch {
    return []
  }
}

export function saveCustomTemplate(
  name: string,
  layout: ReportLayout,
): CustomTemplate {
  const template: CustomTemplate = {
    id: `custom-${Date.now()}`,
    name,
    layout: { blocks: layout.blocks.map((b) => ({ ...b })) },
  }
  if (typeof window === 'undefined') return template
  try {
    const existing = listCustomTemplates()
    localStorage.setItem(
      CUSTOM_TEMPLATES_KEY,
      JSON.stringify([...existing, template]),
    )
  } catch {
    // ignore storage errors
  }
  return template
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
