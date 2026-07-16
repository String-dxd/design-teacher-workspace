import { TagQueueOverlay } from './tag-queue-overlay'
import { TagQueueProvider } from './tag-queue-context'
import { useFeatureFlag } from '@/hooks/use-feature-flag'

// Context reach: __root.tsx mounts HdpShell as a sibling of SidebarInset, so
// a provider living only in HdpShell couldn't reach AppHeader (which
// renders inside SidebarInset). HdpCaptureProvider is exported separately so
// __root.tsx can wrap the whole SidebarProvider block in it — every
// "Tag student" button shares the one session. It renders children directly
// (no flag check): the flag gates the overlay and buttons themselves, and
// openTagQueue no-ops when the flag is off, so a stale caller can't open a
// dead overlay.
export const HdpCaptureProvider = TagQueueProvider

// The floating FAB is gone (maintainer feedback 2026-07-17) — capture opens
// from the primary "Tag student" button in the /reports page header and the
// per-row quick-tag buttons. Only the shared overlay remains global.
export function HdpShell() {
  const enabled = useFeatureFlag('reports-hdp')
  if (!enabled) return null
  return <TagQueueOverlay />
}
