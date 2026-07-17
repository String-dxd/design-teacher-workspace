import { createFileRoute, redirect } from '@tanstack/react-router'

// Redirect stub — the requester journey (coverage diagnostic, composer,
// replies) lives in the "Fill gaps" section of the /reports "My students"
// tab; the responder journey lives on the Requests tab. Old links land on
// the fill-gaps section.
export const Route = createFileRoute('/reports/broadcast')({
  beforeLoad: () => {
    throw redirect({
      to: '/reports',
      search: { tab: 'drafting' },
    })
  },
  component: () => null,
})
