import { createFileRoute, redirect } from '@tanstack/react-router'

// Redirect stub — Review & Sync lives on the /reports Drafting tab now.
export const Route = createFileRoute('/reports/review')({
  beforeLoad: () => {
    throw redirect({ to: '/reports', search: { tab: 'drafting' } })
  },
  component: () => null,
})
