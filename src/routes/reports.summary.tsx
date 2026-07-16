import { createFileRoute, redirect } from '@tanstack/react-router'

// Redirect stub (plan 035) — Term Summary's content moved into the
// "My students" hub's Summary tab (term-summary-panel.tsx). Old links to
// /reports/summary keep working.
export const Route = createFileRoute('/reports/summary')({
  beforeLoad: () => {
    throw redirect({ to: '/reports/students', search: { tab: 'summary' } })
  },
  component: () => null,
})
