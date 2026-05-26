import { Link, createFileRoute } from '@tanstack/react-router'
import { Compass } from 'lucide-react'

import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/$')({
  component: NotFoundPage,
})

export function NotFoundPage() {
  return (
    <main className="flex flex-1 items-center justify-center">
      <EmptyState
        icon={<Compass className="size-10 text-muted-foreground" />}
        title="Page not found"
        description="We couldn't find the page you're looking for. It may have moved, or the link might be broken."
        action={
          <Button variant="outline" render={<Link to="/" />}>
            Back to home
          </Button>
        }
      />
    </main>
  )
}
