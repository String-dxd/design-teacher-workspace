import { createFileRoute, redirect } from '@tanstack/react-router'

// Redirect stub — Term Summary's content lives in the summary cards on the
// /reports "My students" tab now. Old links to /reports/summary keep working.
export const Route = createFileRoute('/reports/summary')({
  beforeLoad: () => {
    throw redirect({ to: '/reports', search: { tab: 'students' } })
  },
  component: () => null,
})
