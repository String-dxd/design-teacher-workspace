import { createFileRoute } from '@tanstack/react-router'

import type { ReportsTab } from '@/components/hdp/reports-home'
import { HdpFlagGate } from '@/components/hdp/hdp-shell'
import { HdpReportsHome } from '@/components/hdp/reports-home'

interface ReportsSearch {
  tab?: ReportsTab
}

export const Route = createFileRoute('/reports/')({
  component: ReportsIndexSwitch,
  validateSearch: (search: Record<string, unknown>): ReportsSearch => ({
    tab:
      search.tab === 'drafting' ||
      search.tab === 'send' ||
      search.tab === 'requests'
        ? search.tab
        : search.tab === 'students'
          ? 'students'
          : undefined,
  }),
})

// The HDP Reports module (flag `reports-hdp`) is the only surface at
// `/reports`; off shows the module's standard off-state. The former hub
// pages (students / drafts / release) are tabs on this one page now —
// their routes redirect here (maintainer feedback 2026-07-17).
function ReportsIndexSwitch() {
  const { tab } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <HdpFlagGate>
      <HdpReportsHome
        tab={tab ?? 'students'}
        onTabChange={(next) =>
          navigate({ search: (prev) => ({ ...prev, tab: next }) })
        }
      />
    </HdpFlagGate>
  )
}
