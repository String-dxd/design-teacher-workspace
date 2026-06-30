import { createFileRoute } from '@tanstack/react-router'

import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'

export const Route = createFileRoute('/meetings/')({
  component: MeetingsPage,
})

function MeetingsPage() {
  useSetBreadcrumbs([{ label: 'Meetings', href: '/meetings' }])

  return (
    <div className="flex flex-col">
      <div className="shrink-0 pt-6">
        <div className="border-b px-6 pb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Meetings</h1>
            <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Release 2
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule and manage parent-teacher meetings.
          </p>
        </div>
      </div>
    </div>
  )
}
