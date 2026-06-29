import {
  Link,
  Outlet,
  createFileRoute,
  useLocation,
} from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/announcements')({
  component: AnnouncementsLayout,
})

function AnnouncementsLayout() {
  const location = useLocation()
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
          <h1 className="text-lg font-semibold md:text-2xl">Posts</h1>
          <Button size="sm" render={<Link to="/create" />}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create
          </Button>
        </div>
        <p className="mt-1 hidden text-sm text-muted-foreground md:block">
          Send a view-only post or collect responses from parents via Parents
          Gateway.
        </p>
      </div>
      <Outlet />
    </div>
  )
}
