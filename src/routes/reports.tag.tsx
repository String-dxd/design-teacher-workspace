import { Link, createFileRoute } from '@tanstack/react-router'
import { TagQueueComposer } from '@/components/hdp/tag-queue-composer'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/reports/tag')({
  component: TagPage,
})

function TagPage() {
  const enabled = useFeatureFlag('reports-hdp')

  useSetBreadcrumbs([
    { label: 'Reports', href: '/reports' },
    { label: 'Tag', href: '/reports/tag' },
  ])

  if (!enabled) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Reports is off</h1>
        <p className="text-muted-foreground text-sm">
          Turn on “HDP Reports module” to use this page.
        </p>
        <Link
          to="/flags"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Open feature flags
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold">Add observation</h1>
      <TagQueueComposer />
    </main>
  )
}
