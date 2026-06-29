import {
  Link,
  Outlet,
  createFileRoute,
  useLocation,
  useNavigate,
  useSearch,
} from '@tanstack/react-router'
import { Plus, School } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Prototype: hardcoded as admin. In production this comes from the session.
const IS_ADMIN = true

export const Route = createFileRoute('/announcements')({
  component: AnnouncementsLayout,
})

function AnnouncementsLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { tab?: string; scope?: string }
  const isSchoolWide = IS_ADMIN && search.scope === 'school'

  const isSubPage =
    location.pathname.startsWith('/announcements/new') ||
    (location.pathname.startsWith('/announcements/') &&
      location.pathname !== '/announcements/' &&
      location.pathname !== '/announcements')

  if (isSubPage) {
    return <Outlet />
  }

  return (
    <div className="flex flex-col">
      <div className="border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold md:text-2xl">Posts</h1>
              {IS_ADMIN && isSchoolWide && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  School-wide view
                </span>
              )}
            </div>
            <p className="mt-1 hidden text-sm text-muted-foreground md:block">
              {isSchoolWide
                ? 'Viewing all sent posts across the school.'
                : 'Send a view-only post or collect responses from parents via Parents Gateway.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {IS_ADMIN && (
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'gap-1.5 text-muted-foreground',
                  isSchoolWide && 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100',
                )}
                onClick={() =>
                  navigate({
                    to: '/announcements/',
                    search: (prev) => ({ ...prev, scope: isSchoolWide ? 'my' : 'school' }),
                    replace: true,
                  })
                }
              >
                <School className="h-3.5 w-3.5" />
                {isSchoolWide ? 'Exit school-wide' : 'School-wide'}
              </Button>
            )}
            {!isSchoolWide && (
              <Button size="sm" render={<Link to="/create" />}>
                <Plus className="mr-1.5 h-4 w-4" />
                Create
              </Button>
            )}
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  )
}
