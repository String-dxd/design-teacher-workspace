import { createFileRoute, redirect } from '@tanstack/react-router'

// Redirect stub (plan 035) — Review & Sync's sync status strip, confirmed-
// drafts table, and ingest download moved into the Drafting hub
// (/reports/drafts). Old links to /reports/review keep working.
export const Route = createFileRoute('/reports/review')({
  beforeLoad: () => {
    throw redirect({ to: '/reports/drafts' })
  },
  component: () => null,
})
