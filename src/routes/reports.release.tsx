import { createFileRoute, redirect } from '@tanstack/react-router'

// Redirect stub (2026-07-17) — the Release Manager folded into /reports as
// the "Send to parents" tab (release-manager.tsx). Old links keep working.
export const Route = createFileRoute('/reports/release')({
  beforeLoad: () => {
    throw redirect({ to: '/reports', search: { tab: 'send' } })
  },
  component: () => null,
})
