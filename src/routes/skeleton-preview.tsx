import { createFileRoute } from '@tanstack/react-router'

import { StudentTableSkeleton } from '@/components/students/student-table-skeleton'

export const Route = createFileRoute('/skeleton-preview')({
  component: SkeletonPreviewPage,
})

function SkeletonPreviewPage() {
  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-foreground">
          Student table skeleton — preview
        </h1>
        <p className="text-sm text-muted-foreground">
          Loading placeholder shown while the student list is fetching.
        </p>
      </div>
      <div className="flex flex-1 rounded-lg border border-border">
        <StudentTableSkeleton />
      </div>
    </div>
  )
}
