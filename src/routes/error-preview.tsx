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

// Render the error state directly so the module fills the content area under
// the app chrome — no preview box, title, or padding gap. The boundary's
// ModuleLoadError fallback is `flex-1`, so it grows to fill the container just
// like the students Analytics empty state.
function ErrorPreviewPage() {
  return (
    <ErrorBoundary>
      <FailingRemote />
    </ErrorBoundary>
  )
}
