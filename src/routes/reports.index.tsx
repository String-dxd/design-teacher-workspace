import { Link, createFileRoute } from '@tanstack/react-router'

import type { ReportsTab } from '@/components/hdp/reports-home'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
  const hdpModuleEnabled = useFeatureFlag('reports-hdp')
  const { tab } = Route.useSearch()
  const navigate = Route.useNavigate()

  if (hdpModuleEnabled) {
    return (
      <HdpReportsHome
        tab={tab ?? 'students'}
        onTabChange={(next) =>
          navigate({ search: (prev) => ({ ...prev, tab: next }) })
        }
      />
    )
  }
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Reports is off</h1>
      <p className="text-muted-foreground text-sm">
        Turn on “HDP Reports module” to use this page.
      </p>
      <Link to="/flags" className={cn(buttonVariants({ variant: 'outline' }))}>
        Open feature flags
      </Link>
    </main>
  )
}
