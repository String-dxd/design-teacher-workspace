import { createFileRoute, redirect } from '@tanstack/react-router'

// Redirect stub (plan 035) — Coverage & Broadcast's requester journey
// (coverage diagnostic, composer, replies) moved into the "My students"
// hub's Gaps tab (coverage-broadcast-panel.tsx); the responder-facing
// "Requests for you" section moved to the Requests tab
// (broadcast-requests-panel.tsx). Old links to /reports/broadcast keep
// working, landing on Gaps — the page's primary (requester) journey.
export const Route = createFileRoute('/reports/broadcast')({
  beforeLoad: () => {
    throw redirect({ to: '/reports/students', search: { tab: 'gaps' } })
  },
  component: () => null,
})
