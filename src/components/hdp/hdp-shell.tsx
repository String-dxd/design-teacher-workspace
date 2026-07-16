import { useLocation, useRouterState } from '@tanstack/react-router'
import { TagFab } from './tag-fab'
import { TagQueueOverlay } from './tag-queue-overlay'
import { TagQueueProvider } from './tag-queue-context'
import { useFeatureFlag } from '@/hooks/use-feature-flag'

// Context reach: __root.tsx mounts HdpShell as a sibling of SidebarInset, so
// a provider living only in HdpShell couldn't reach AppHeader (which
// renders inside SidebarInset). HdpCaptureProvider is exported separately so
// __root.tsx can wrap the whole SidebarProvider block in it — the FAB, the
// overlay, and the top-bar "+ Tag" button all share the one session. It
// renders children directly (no flag check): the flag gates the
// FAB/overlay/buttons themselves, and openTagQueue no-ops when the flag is
// off, so a stale caller can't open a dead overlay.
export const HdpCaptureProvider = TagQueueProvider

// Routes where a floating FAB would collide with route-local capture UI or
// simply doesn't belong: the full-page Tag composer itself, Insight Buddy's
// own floating bubble, and any guest route (no HDP surface for guests).
const FAB_SUPPRESSED_PATH_PREFIXES = ['/reports/tag', '/insight-buddy']

export function HdpShell() {
  const enabled = useFeatureFlag('reports-hdp')
  const pathname = useLocation({ select: (l) => l.pathname })
  const isGuestRoute = useRouterState({
    select: (s) => s.matches.some((m) => m.routeId.startsWith('/_guest')),
  })

  if (!enabled) return null

  const suppressFab =
    isGuestRoute ||
    FAB_SUPPRESSED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  return (
    <>
      {!suppressFab && <TagFab />}
      <TagQueueOverlay />
    </>
  )
}
