import { createFileRoute, redirect } from '@tanstack/react-router'

// Redirect stub (2026-07-17) — the Drafting hub folded into /reports as a
// tab. Old links to /reports/drafts keep working.
export const Route = createFileRoute('/reports/drafts/')({
  beforeLoad: () => {
    throw redirect({ to: '/reports', search: { tab: 'drafting' } })
  },
  component: () => null,
})
