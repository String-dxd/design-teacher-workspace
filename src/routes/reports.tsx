import { Outlet, createFileRoute, useSearch } from '@tanstack/react-router'
import { Crown } from 'lucide-react'

export const Route = createFileRoute('/reports')({
  component: ReportsLayout,
})

function ReportsLayout() {
  const search = useSearch({ strict: false })
  const scope = ((search as Record<string, unknown>).scope as string) ?? 'my'
  const isAdmin = (search as Record<string, unknown>).view === 'admin'
  const isSchoolWide = isAdmin && scope === 'school'

  return (
    <div className="flex flex-col">
      {isAdmin && (
        <div className="flex items-center justify-center gap-2 border-y border-amber-200 bg-amber-50 px-6 py-2 text-sm text-amber-800">
          <Crown className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span>
            <span className="font-semibold">You have admin access.</span>{' '}
            {isSchoolWide
              ? 'To view your own reports, use the dropdown next to School Reports.'
              : 'To view school reports, use the dropdown next to My Reports.'}
            <img
              src="/arrow-down-left-ink.svg"
              alt=""
              className="ml-1 inline-block h-5 w-5 -translate-y-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      )}
      <Outlet />
    </div>
  )
}
