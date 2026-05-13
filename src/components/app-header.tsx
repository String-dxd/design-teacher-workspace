import { Link, useNavigate } from '@tanstack/react-router'
import { MessageCircle } from 'lucide-react'

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

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
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
