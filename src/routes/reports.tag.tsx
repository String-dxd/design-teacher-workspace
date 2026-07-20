import { createFileRoute } from '@tanstack/react-router'
import { TagQueueComposer } from '@/components/hdp/tag-queue-composer'
import { HdpFlagGate } from '@/components/hdp/hdp-shell'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'

export const Route = createFileRoute('/reports/tag')({
  component: TagPage,
})

function TagPage() {
  useSetBreadcrumbs([
    { label: 'Reports', href: '/reports' },
    { label: 'Tag', href: '/reports/tag' },
  ])

  return (
    <HdpFlagGate>
      <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold">Add observation</h1>
        <TagQueueComposer />
      </main>
    </HdpFlagGate>
  )
}
