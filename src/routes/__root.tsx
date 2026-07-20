import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
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
import {
  FEATURE_FLAGS_STORAGE_KEY,
  FeatureFlagProvider,
} from '@/lib/feature-flags'
import { AUTH_COOKIE_KEY, AuthProvider } from '@/lib/auth'
import { BreadcrumbProvider } from '@/hooks/use-breadcrumbs'
import { HeyTaliaPanel } from '@/components/heytalia/heytalia-panel'
import { HeyTaliaProvider } from '@/components/heytalia/heytalia-context'
import { HdpCaptureProvider, HdpShell } from '@/components/hdp/hdp-shell'

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

interface RootLoaderSeed {
  /**
   * Raw parsed cookie payload — an arbitrary, untrusted partial flags
   * object (or null). `mergeStoredFlags` on the client validates every
   * value before it reaches state.
   */
  flags: Partial<Record<string, boolean>> | null
  loggedIn: boolean
}

// Server-only cookie read, extracted into a createServerFn handler so the
// dynamic `@tanstack/react-start/server` import stays out of the client
// bundle (a plain dynamic import in a client-reachable module trips this
// project's import-protection Vite plugin even when runtime-guarded).
const readSeedCookies = createServerFn({ method: 'GET' }).handler(
  async (_ctx): Promise<RootLoaderSeed> => {
    const { getCookie } = await import('@tanstack/react-start/server')
    let flags: Partial<Record<string, boolean>> | null = null
    try {
      const raw = getCookie(FEATURE_FLAGS_STORAGE_KEY)
      flags = raw ? JSON.parse(decodeURIComponent(raw)) : null
    } catch {
      flags = null
    }

    return {
      flags,
      loggedIn: getCookie(AUTH_COOKIE_KEY) === 'true',
    }
  },
)

export const Route = createRootRoute({
  loader: async (
    _ctx,
  ): Promise<{
    seed: RootLoaderSeed | null
  }> => {
    // Only run the cookie read on the server. On the client (e.g. a later
    // client-side navigation re-running this loader) there is nothing to
    // seed — the providers are already mounted — so short-circuit rather
    // than round-tripping the server function over RPC.
    if (typeof document !== 'undefined') return { seed: null }

    const seed = await readSeedCookies()
    return { seed }
  },
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
        title: 'Teacher Workspace',
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
  const { seed } = Route.useLoaderData()

  if (isGuestRoute || isGlowRoute || isNotFoundRoute) {
    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider initialLoggedIn={seed?.loggedIn}>
            <FeatureFlagProvider initialFlags={seed?.flags}>
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
        <AuthProvider initialLoggedIn={seed?.loggedIn}>
          <FeatureFlagProvider initialFlags={seed?.flags}>
            <BreadcrumbProvider>
              <HeyTaliaProvider>
                <HdpCaptureProvider>
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
                    <Toaster position="bottom-right" offset={{ bottom: 88 }} />
                    <WelcomeModal />
                  </SidebarProvider>
                </HdpCaptureProvider>
              </HeyTaliaProvider>
            </BreadcrumbProvider>
          </FeatureFlagProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
