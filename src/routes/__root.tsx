import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

import { DirectEdit } from 'made-refine'
import appCss from '../styles.css?url'
import { NotFoundPage } from './$'
import { AppHeader } from '@/components/app-header'
import { AppSidebar } from '@/components/app-sidebar'
import { WelcomeModal } from '@/components/welcome-modal'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { FeatureFlagProvider } from '@/lib/feature-flags'
import { AuthProvider } from '@/lib/auth'
import { BreadcrumbProvider } from '@/hooks/use-breadcrumbs'
import { HeyTaliaPanel } from '@/components/heytalia/heytalia-panel'
import { HeyTaliaProvider } from '@/components/heytalia/heytalia-context'
import { HdpShell } from '@/components/hdp/hdp-shell'

const AUTO_COLLAPSE_ROUTES = [
  '/announcements',
  '/meetings',
  '/groups',
  '/reports',
  '/calendar',
]

function SidebarAutoCollapse() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { collapseSidebar } = useSidebar()
  const prevPathnameRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    const prev = prevPathnameRef.current
    prevPathnameRef.current = pathname

    const inSection = AUTO_COLLAPSE_ROUTES.some((r) => pathname.startsWith(r))
    const wasInSection =
      prev !== null && AUTO_COLLAPSE_ROUTES.some((r) => prev.startsWith(r))

    // Only collapse when crossing into a section from outside
    if (inSection && !wasInSection) {
      collapseSidebar()
    }
  }, [pathname, collapseSidebar])

  return null
}

export const Route = createRootRoute({
  notFoundComponent: NotFoundPage,
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'MOE Workspace Homepage',
      },
      {
        name: 'description',
        content:
          'Your central hub for school management, student insights, and daily tools.',
      },
      {
        property: 'og:title',
        content: 'MOE Teacher Workspace',
      },
      {
        property: 'og:description',
        content:
          'Your central hub for school management, student insights, and daily tools.',
      },
      {
        property: 'og:image',
        content: 'https://teacherworkspace-alpha.vercel.app/og-image.png',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'MOE Teacher Workspace',
      },
      {
        name: 'twitter:description',
        content:
          'Your central hub for school management, student insights, and daily tools.',
      },
      {
        name: 'twitter:image',
        content: 'https://teacherworkspace-alpha.vercel.app/og-image.png',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
  component: RootComponent,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        {process.env.NODE_ENV === 'development' && <DirectEdit />}
        <Scripts />
      </body>
    </html>
  )
}

function RootComponent() {
  const [queryClient] = React.useState(() => new QueryClient())
  const matches = useRouterState({ select: (s) => s.matches })
  const isGuestRoute = matches.some((m) => m.routeId === '/_guest')
  const isGlowRoute = matches.some((m) =>
    (m as { pathname: string }).pathname?.startsWith('/glow/'),
  )
  const isNotFoundRoute =
    matches.some((m) => m.routeId === '/$') ||
    matches.at(-1)?.status === 'notFound'

  if (isGuestRoute || isGlowRoute || isNotFoundRoute) {
    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <FeatureFlagProvider>
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </FeatureFlagProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FeatureFlagProvider>
            <BreadcrumbProvider>
              <HeyTaliaProvider>
                <SidebarProvider>
                  <SidebarAutoCollapse />
                  <AppSidebar />
                  <SidebarInset className="h-screen overflow-hidden">
                    <div
                      data-scroll-container
                      className="flex min-h-0 flex-1 flex-col overflow-auto bg-slate-1"
                    >
                      <AppHeader />
                      <ErrorBoundary>
                        <Outlet />
                      </ErrorBoundary>
                    </div>
                  </SidebarInset>
                  <HeyTaliaPanel />
                  <HdpShell />
                  <Toaster position="bottom-right" />
                  <WelcomeModal />
                </SidebarProvider>
              </HeyTaliaProvider>
            </BreadcrumbProvider>
          </FeatureFlagProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
