import { createFileRoute } from '@tanstack/react-router'
import type * as React from 'react'

import { ErrorBoundary } from '@/components/ui/error-boundary'

export const Route = createFileRoute('/error-preview')({
  component: ErrorPreviewPage,
})

// Always throws to mimic a Module Federation remote that can't be fetched at
// runtime, so the boundary reliably shows the error state.
function FailingRemote(): React.ReactNode {
  throw new Error(
    'ScriptExternalLoadError: Loading script failed (remoteEntry.js)',
  )
}

function ErrorPreviewPage() {
  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-foreground">
          Module load error — preview
        </h1>
        <p className="text-sm text-muted-foreground">
          Panel-scoped: one failed region inside the app chrome.
        </p>
      </div>
      <div className="flex flex-1 rounded-lg border border-border">
        <ErrorBoundary>
          <FailingRemote />
        </ErrorBoundary>
      </div>
    </div>
  )
}
