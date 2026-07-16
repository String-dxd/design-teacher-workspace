import { Link, createFileRoute } from '@tanstack/react-router'

import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { HdpReportsHome } from '@/components/hdp/reports-home'

export const Route = createFileRoute('/reports/')({
  component: ReportsIndexSwitch,
})

// The legacy Reports table + P1–P2 cycle hub have been torn down (plan 034).
// The HDP Reports module (flag `reports-hdp`) is the only surface left at
// `/reports`; off shows the module's standard off-state.
function ReportsIndexSwitch() {
  const hdpModuleEnabled = useFeatureFlag('reports-hdp')
  if (hdpModuleEnabled) return <HdpReportsHome />
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
