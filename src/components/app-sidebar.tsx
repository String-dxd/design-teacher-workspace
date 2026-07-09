import * as React from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  ArrowUpRight,
  BarChart3,
  Bot,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CircleHelp,
  FileText,
  Home,
  Layers,
  Mail,
  MessageSquare,
  ScrollText,
  Settings,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { FeatureFlagKey } from '@/lib/feature-flags'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FeedbackDialog } from '@/components/feedback-dialog'

import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useAuth } from '@/lib/auth'

interface MenuItem {
  title: string
  url: string
  icon: LucideIcon
  badge?: number
  featureFlag?: FeatureFlagKey
  stage?: string
  transparent?: boolean
  alsoActiveFor?: Array<string>
  search?: Record<string, string> // extra search params for the Link
  excludeSearchView?: string // not active when currentView === this
  requiredSearchView?: string // only active when currentView === this
}

const mainNavItems: Array<MenuItem> = [
  {
    title: 'Home',
    url: '/',
    icon: Home,
  },
  {
    title: 'Attendance',
    url: '/attendance',
    icon: CalendarCheck2,
  },
]

const studentInsightItemsWithAnalytics: Array<MenuItem> = [
  {
    title: 'Analytics',
    url: '/student-analytics',
    icon: BarChart3,
    stage: 'Experiment',
    featureFlag: 'student-analytics',
  },
  {
    title: 'Profiles',
    url: '/students',
    icon: Users,
  },
  {
    title: 'Insight Buddy',
    url: '/insight-buddy',
    icon: Bot,
    stage: 'Experiment',
    featureFlag: 'student-analytics',
  },
]

const studentInsightItemsBasicAnalytics: Array<MenuItem> = [
  {
    title: 'Analytics',
    url: '/student-analytics',
    icon: BarChart3,
    stage: 'Experiment',
  },
  {
    title: 'Profiles',
    url: '/students',
    icon: Users,
  },
]

const studentInsightItemsWithoutAnalytics: Array<MenuItem> = [
  {
    title: 'Student Insights',
    url: '/students',
    icon: Users,
  },
]

const manageItems: Array<MenuItem> = [
  {
    title: 'Student Groups',
    url: '/groups',
    icon: Layers,
    stage: 'Release 2',
    featureFlag: 'student-groups',
  },
  {
    title: 'Calendar',
    url: '/calendar',
    icon: CalendarDays,
    stage: 'Release 2',
    featureFlag: 'calendar',
  },
  {
    title: 'Reports',
    url: '/reports',
    icon: FileText,
    stage: 'Release 2',
    featureFlag: 'reports',
    excludeSearchView: 'admin',
  },
  {
    title: 'Reports (Admin)',
    url: '/reports',
    icon: FileText,
    stage: 'Release 2',
    featureFlag: 'reports-admin-view',
    search: { view: 'admin' },
    requiredSearchView: 'admin',
  },
]

const parentsCommItems: Array<MenuItem> = [
  {
    title: 'Posts',
    url: '/announcements',
    icon: Mail,
    stage: 'Release 2',
    featureFlag: 'posts',
    excludeSearchView: 'admin',
  },
  {
    title: 'Posts (Admin)',
    url: '/announcements',
    icon: Mail,
    stage: 'Release 2',
    featureFlag: 'posts-admin-view',
    search: { view: 'admin' },
    requiredSearchView: 'admin',
  },
  {
    title: 'Meetings',
    url: '/meetings',
    icon: CalendarClock,
    stage: 'Release 2',
    featureFlag: 'meetings',
  },
  {
    title: 'Holistic Development Reports',
    url: '/reports',
    icon: FileText,
    stage: 'Experiment',
    featureFlag: 'hdp-reports',
  },
]

interface SidebarMenuItemsProps {
  items: Array<MenuItem>
  currentPath: string
  currentView?: string
  highlightTitle?: string
}

function SidebarMenuItems({
  items,
  currentPath,
  currentView,
  highlightTitle,
}: SidebarMenuItemsProps) {
  return (
    <SidebarMenu>
      {items.map((item) => {
        const pathActive =
          currentPath === item.url ||
          (item.url !== '/' && currentPath.startsWith(item.url)) ||
          (item.alsoActiveFor?.some((p) => currentPath.startsWith(p)) ?? false)

        let isActive: boolean
        if (item.requiredSearchView != null) {
          isActive = pathActive && currentView === item.requiredSearchView
        } else if (item.excludeSearchView != null) {
          isActive = pathActive && currentView !== item.excludeSearchView
        } else {
          isActive = pathActive
        }

        return (
          <SidebarMenuItem
            key={item.title}
            className={item.transparent ? 'opacity-0 pointer-events-none' : ''}
          >
            <SidebarMenuButton
              render={
                item.search ? (
                  <Link to={item.url} search={item.search} />
                ) : (
                  <Link to={item.url} />
                )
              }
              isActive={isActive}
              tooltip={item.title}
              className={
                highlightTitle === item.title
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : undefined
              }
            >
              <item.icon className="size-4" />
              <span className="truncate">{item.title}</span>
              {item.stage && (
                <Badge
                  variant="outline"
                  className={
                    item.stage === 'Experiment'
                      ? 'border-violet-6 bg-violet-3 text-violet-11 group-data-[collapsible=icon]:hidden'
                      : 'group-data-[collapsible=icon]:hidden'
                  }
                >
                  {item.stage}
                </Badge>
              )}
            </SidebarMenuButton>
            {item.badge && (
              <SidebarMenuBadge className="bg-muted text-muted-foreground">
                {item.badge}
              </SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

const WELCOME_KEY = 'tw_welcome_seen'
const COACHMARK_KEY = 'tw_posts_coachmark_seen'

export function AppSidebar() {
  const location = useLocation()
  const { isLoggedIn } = useAuth()
  const [feedbackOpen, setFeedbackOpen] = React.useState(false)
  const [showCoachMark, setShowCoachMark] = React.useState(false)
  const postsEnabled = useFeatureFlag('posts')
  const hdpReportsEnabled = useFeatureFlag('hdp-reports')
  const parentsGatewayEnabled = useFeatureFlag('parents-gateway')
  const studentAnalyticsEnabled = useFeatureFlag('student-analytics')
  const studentAnalyticsBasicEnabled = useFeatureFlag('student-analytics-basic')
  const studentGroupsEnabled = useFeatureFlag('student-groups')
  const agencyReportsEnabled = useFeatureFlag('agency-reports')
  const msfUpliftEnabled = useFeatureFlag('msf-uplift-data')
  const reportsEnabled = useFeatureFlag('reports')
  const calendarEnabled = useFeatureFlag('calendar')
  const meetingsEnabled = useFeatureFlag('meetings')
  const postsAdminViewEnabled = useFeatureFlag('posts-admin-view')
  const reportsAdminViewEnabled = useFeatureFlag('reports-admin-view')
  const currentView = (location.search as Record<string, unknown>).view as
    | string
    | undefined

  const hideAttendanceAndReports =
    msfUpliftEnabled ||
    ((studentAnalyticsEnabled || studentAnalyticsBasicEnabled) &&
      !agencyReportsEnabled)

  React.useEffect(() => {
    if (localStorage.getItem(COACHMARK_KEY)) return

    let timerId: ReturnType<typeof setTimeout> | undefined

    const show = () => {
      timerId = setTimeout(() => setShowCoachMark(true), 500)
    }

    // Welcome modal won't show for logged-in users or if already dismissed
    if (isLoggedIn || sessionStorage.getItem(WELCOME_KEY)) {
      show()
      return () => clearTimeout(timerId)
    }

    // Welcome modal is open — wait for it to close
    const handler = () => show()
    window.addEventListener('welcome-dismissed', handler)
    return () => {
      window.removeEventListener('welcome-dismissed', handler)
      clearTimeout(timerId)
    }
  }, [isLoggedIn])

  function dismissCoachMark() {
    localStorage.setItem(COACHMARK_KEY, '1')
    setShowCoachMark(false)
  }

  const filterItems = (items: Array<MenuItem>) =>
    items.filter((item) => {
      if (!item.featureFlag) return true
      if (item.featureFlag === 'posts') return postsEnabled
      if (item.featureFlag === 'hdp-reports') return hdpReportsEnabled
      if (item.featureFlag === 'parents-gateway') return parentsGatewayEnabled
      if (item.featureFlag === 'student-groups') return studentGroupsEnabled
      if (item.featureFlag === 'reports') return reportsEnabled
      if (item.featureFlag === 'calendar') return calendarEnabled
      if (item.featureFlag === 'meetings') return meetingsEnabled
      if (item.featureFlag === 'posts-admin-view') return postsAdminViewEnabled
      if (item.featureFlag === 'reports-admin-view')
        return reportsAdminViewEnabled
      return true
    })

  const filteredMainItems = filterItems(mainNavItems).filter(
    (item) => !(hideAttendanceAndReports && item.title === 'Attendance'),
  )
  const filteredParentsItems = filterItems(parentsCommItems).filter(
    (item) => !(hideAttendanceAndReports && item.title === 'Reports'),
  )
  const filteredManageItems = filterItems(manageItems)
  const filteredStudentItems = studentAnalyticsEnabled
    ? studentInsightItemsWithAnalytics.filter((item) =>
        item.featureFlag === 'student-analytics'
          ? studentAnalyticsEnabled
          : true,
      )
    : studentAnalyticsBasicEnabled
      ? studentInsightItemsBasicAnalytics
      : studentInsightItemsWithoutAnalytics

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-0">
        <div className="flex h-14 items-center justify-center gap-2 px-4 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold transition-[opacity,flex] duration-150 group-data-[collapsible=icon]:flex-[0] group-data-[collapsible=icon]:opacity-0 select-none cursor-default">
            Teacher Workspace
            <span className="ml-1.5 rounded-full bg-twblue-3 px-1.5 py-0.5 text-xs font-medium text-twblue-9">
              Beta
            </span>
          </span>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pb-0">
          <SidebarGroupContent>
            <SidebarMenuItems
              items={filteredMainItems}
              currentPath={location.pathname}
            />
          </SidebarGroupContent>
          <>
            {(studentAnalyticsEnabled || studentAnalyticsBasicEnabled) && (
              <SidebarGroupLabel className="mt-2 group-data-[collapsible=icon]:pointer-events-none">
                Student Insights
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenuItems
                items={filteredStudentItems}
                currentPath={location.pathname}
              />
            </SidebarGroupContent>
          </>
          {filteredParentsItems.length > 0 && (
            <>
              <SidebarSeparator className="mx-0 mt-3" />
              <SidebarGroupLabel className="mt-2 group-data-[collapsible=icon]:pointer-events-none">
                Communications
              </SidebarGroupLabel>
              <Popover
                open={showCoachMark}
                onOpenChange={(o) => {
                  if (!o) dismissCoachMark()
                }}
              >
                <PopoverTrigger
                  render={
                    <SidebarGroupContent className="mt-2 focus:outline-none" />
                  }
                >
                  <SidebarMenuItems
                    items={filteredParentsItems}
                    currentPath={location.pathname}
                    currentView={currentView}
                    highlightTitle={showCoachMark ? 'Posts' : undefined}
                  />
                </PopoverTrigger>
                <PopoverContent side="right" sideOffset={12}>
                  <PopoverHeader>
                    <PopoverTitle>
                      New! Parents Gateway posts are here
                    </PopoverTitle>
                    <PopoverDescription>
                      Send posts, track responses, and manage all parent
                      communications in one place.
                    </PopoverDescription>
                  </PopoverHeader>
                  <div className="flex justify-end">
                    <Button size="sm" onClick={dismissCoachMark}>
                      Got it
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
          {filteredManageItems.length > 0 && (
            <>
              <SidebarSeparator className="mx-0 mt-3" />
              <SidebarGroupLabel className="mt-2 group-data-[collapsible=icon]:pointer-events-none">
                Manage
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenuItems
                  items={filteredManageItems}
                  currentPath={location.pathname}
                  currentView={currentView}
                />
              </SidebarGroupContent>
            </>
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link to="/settings" />}
              isActive={location.pathname === '/settings'}
              tooltip="Settings"
            >
              <Settings className="size-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton tooltip="Help">
                    <CircleHelp className="size-4" />
                    <span>Help</span>
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent side="top" align="start">
                <DropdownMenuItem onClick={() => setFeedbackOpen(true)}>
                  <MessageSquare />
                  Send feedback
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={
                    <a href="#" target="_blank" rel="noopener noreferrer" />
                  }
                >
                  <FileText />
                  Docs
                  <ArrowUpRight className="ml-auto size-3 text-muted-foreground" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={
                    <a href="#" target="_blank" rel="noopener noreferrer" />
                  }
                >
                  <ScrollText />
                  Changelog
                  <ArrowUpRight className="ml-auto size-3 text-muted-foreground" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </Sidebar>
  )
}
