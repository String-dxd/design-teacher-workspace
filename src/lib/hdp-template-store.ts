import type { ReportBlock } from '@/types/report'

// Prototype persistence for the Report Builder.
// - Share messages: the personal note a teacher writes on the share screen, keyed by
//   report id so the parent-facing guest view can show it. All localStorage (mock).

// The built report's layout + comments, persisted so a freshly-opened parent link
// resolves it (the in-memory mockReports array resets on a full page load).
interface SharedReport {
  blocks: Array<ReportBlock>
  comments: string
}

const sharedKey = (reportId: string) => `hdp_shared_report_${reportId}`

export function loadSharedReport(reportId: string): SharedReport | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(sharedKey(reportId))
    return raw ? (JSON.parse(raw) as SharedReport) : null
  } catch {
    return null
  }
}
