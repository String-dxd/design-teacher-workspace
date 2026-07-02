import { useState } from 'react'
import {
  Link,
  Outlet,
  createFileRoute,
  useLocation,
  useNavigate,
  useSearch,
} from '@tanstack/react-router'
import { Check, ChevronDown, Crown, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const SCOPE_OPTIONS = [
  {
    value: 'my',
    label: 'My Posts',
    description: 'Posts you have created',
  },
  {
    value: 'school',
    label: 'School',
    description: 'Posts across your school',
  },
] as const

export const Route = createFileRoute('/announcements')({
  component: AnnouncementsLayout,
})

function AnnouncementsLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const scope = search.scope ?? 'my'
  const isAdmin = (search as Record<string, unknown>).view === 'admin'
  const isSchoolWide = isAdmin && scope === 'school'
  const [open, setOpen] = useState(false)

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
      <div className="shrink-0 space-y-4 pt-6">
        <div className="flex items-start justify-between px-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              Posts
              {isAdmin && (
                <Badge className="gap-1 bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold">
                  <Crown className="h-3 w-3" />
                  Admin
                </Badge>
              )}
            </h1>
            <p className="mt-1 hidden text-sm text-muted-foreground lg:block">
              Send a read only post or collect responses from parents via
              Parents Gateway.
              {isAdmin && (
                <>
                  <br />
                  Switch between your posts and a school-wide view below.
                </>
              )}
            </p>
          </div>
          {!isSchoolWide && (
            <Button size="sm" render={<Link to="/create" />}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create
            </Button>
          )}
        </div>
        <div className="px-6">
          {isAdmin ? (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger className="inline-flex cursor-pointer items-center gap-1.5 bg-transparent p-0 text-lg font-semibold outline-none">
                {isSchoolWide ? 'School' : 'My Posts'}
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </PopoverTrigger>
              <PopoverContent
                className="w-56 gap-0 overflow-hidden rounded-2xl p-1"
                align="start"
              >
                {SCOPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      navigate({
                        to: '/announcements',
                        search: (prev) => ({
                          ...prev,
                          scope: opt.value,
                        }),
                        replace: true,
                      })
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full flex-col rounded-xl px-3 py-2 text-left transition-colors hover:bg-accent',
                      scope === opt.value && 'bg-accent',
                    )}
                  >
                    <span className="flex items-center justify-between">
                      <span className="text-sm font-medium">{opt.label}</span>
                      {scope === opt.value && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {opt.description}
                    </span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          ) : (
            <span className="text-lg font-semibold">My Posts</span>
          )}
        </div>
      </div>
      <Outlet />
    </div>
  )
}
