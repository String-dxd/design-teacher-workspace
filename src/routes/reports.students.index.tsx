import { createFileRoute, redirect } from '@tanstack/react-router'

type LegacyTab = 'roster' | 'summary' | 'gaps' | 'requests'

// Redirect stub (2026-07-17) — the "My students" hub folded into /reports
// as a tab. Old links keep working: requests lands on the Requests tab;
// roster/summary/gaps land on My students.
export const Route = createFileRoute('/reports/students/')({
  validateSearch: (search: Record<string, unknown>): { tab?: LegacyTab } => ({
    tab:
      search.tab === 'summary' ||
      search.tab === 'gaps' ||
      search.tab === 'requests' ||
      search.tab === 'roster'
        ? search.tab
        : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: '/reports',
      search: { tab: search.tab === 'requests' ? 'requests' : 'students' },
      hash: search.tab === 'gaps' ? 'gaps' : undefined,
    })
  },
  component: () => null,
})
