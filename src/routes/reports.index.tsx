import { createFileRoute } from '@tanstack/react-router'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'

export const Route = createFileRoute('/reports/')({
  component: ReportsPage,
})

function ReportsPage() {
  useSetBreadcrumbs([{ label: 'Reports', href: '/reports' }])

  return (
    <div className="flex flex-col">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">Reports</h1>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-900">
                Concept
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              View and manage student reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
