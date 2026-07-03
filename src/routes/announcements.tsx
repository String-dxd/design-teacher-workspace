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
    label: 'My posts',
    description: 'Posts you created',
  },
  {
    value: 'school',
    label: 'School posts',
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
      {isAdmin && (
        <div className="flex items-center justify-center gap-2 border-y border-amber-200 bg-amber-50 px-6 py-2 text-sm text-amber-800">
          <Crown className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span>
            <span className="font-semibold">You have admin access.</span>{' '}
            {isSchoolWide
              ? 'To view your own posts, use the dropdown next to School Posts.'
              : 'To view school posts, use the dropdown next to My Posts.'}
            <img src="/arrow-down-left-ink.svg" alt="" className="ml-1 inline-block h-5 w-5 -translate-y-0.5" aria-hidden="true" />
          </span>
        </div>
      )}
      <div className="shrink-0 pt-6">
        <div className="flex items-start justify-between px-6">
          <div>
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger className="inline-flex cursor-pointer items-center gap-1.5 bg-transparent p-0 text-2xl font-semibold outline-none">
                    {isSchoolWide ? 'School Posts' : 'My Posts'}
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
                          <span className="text-sm font-medium">
                            {opt.label}
                          </span>
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
                <h1 className="text-2xl font-semibold">My Posts</h1>
              )}
            </div>
            <p className="mt-1 hidden text-sm text-muted-foreground lg:block">
              Send posts to parents via Parents Gateway. Choose whether parents
              need to respond.
            </p>
          </div>
          {(!isSchoolWide || isAdmin) && (
            <Button size="sm" render={<Link to="/create" />}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create
            </Button>
          )}
        </div>
      </div>

      <Outlet />
    </div>
  )
}
