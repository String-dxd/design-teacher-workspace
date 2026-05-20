import { Link, useNavigate } from '@tanstack/react-router'
import { MessageCircle } from 'lucide-react'
import * as React from 'react'

import { NotificationPopover } from '@/components/notifications/notification-popover'
import { useHeyTalia } from '@/components/heytalia/heytalia-context'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useAuth } from '@/lib/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { cn } from '@/lib/utils'

export function AppHeader() {
  const breadcrumbs = useBreadcrumbs()
  const showNotifications = useFeatureFlag('notifications')
  const studentAnalyticsEnabled = useFeatureFlag('student-analytics')
  const studentAnalyticsBasicEnabled = useFeatureFlag('student-analytics-basic')
  const showAssistant =
    !studentAnalyticsBasicEnabled && !studentAnalyticsEnabled
  const { isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()
  const { setView } = useHeyTalia()
  const headerRef = React.useRef<HTMLElement>(null)
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const container = headerRef.current?.closest<HTMLElement>(
      '[data-scroll-container]',
    )
    if (!container) return

    const update = () => setIsScrolled(container.scrollTop > 0)
    update()
    container.addEventListener('scroll', update, { passive: true })
    return () => container.removeEventListener('scroll', update)
  }, [])

  return (
    <header
      ref={headerRef}
      className={cn(
        'sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background/70 backdrop-blur-md transition-colors duration-200',
        isScrolled ? 'border-border' : 'border-transparent',
      )}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1
              return (
                <BreadcrumbItem key={item.href}>
                  {index > 0 && <BreadcrumbSeparator />}
                  {isLast ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link to={item.href} />}>
                      {item.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center justify-center gap-3">
        {showNotifications && <NotificationPopover />}
        {isLoggedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="rounded-full"
                />
              }
            >
              <Avatar size="xs">
                <AvatarImage src="" alt="User avatar" />
                <AvatarFallback>D</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>daniel_tan@school.moe.sg</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link to="/settings" />}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  logout()
                  navigate({ to: '/login' })
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="outline"
            className="rounded-full"
            render={<Link to="/login" />}
          >
            Sign in
          </Button>
        )}
        {showAssistant && (
          <>
            <div className="h-4 w-px bg-border" />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setView('chat')}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Assistant
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
