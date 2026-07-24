import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  redirect,
  useNavigate,
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
  parseSeedCookie,
} from '@/lib/feature-flags'
import {
  AUTH_COOKIE_KEY,
  AuthProvider,
  isPublicPath,
  useAuth,
} from '@/lib/auth'
import { BreadcrumbProvider } from '@/hooks/use-breadcrumbs'
import { HeyTaliaPanel } from '@/components/heytalia/heytalia-panel'
import { HeyTaliaProvider } from '@/components/heytalia/heytalia-context'
import { HdpCaptureProvider, HdpShell } from '@/components/hdp/hdp-shell'

// Close the off-canvas drawer on phones after navigating. Desktop/tablet
// keep whatever expand/collapse state the user last set (persisted in
// localStorage by SidebarProvider), so we never force-collapse here.
function MobileSidebarAutoClose() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { isMobile, setOpenMobile } = useSidebar()

  React.useEffect(() => {
    if (isMobile) setOpenMobile(false)
  }, [pathname, isMobile, setOpenMobile])

  return null
}

// Client-side counterpart of the loader's redirect: the root loader only
// runs on the server (full-document loads), so a logged-out user reaching an
// app route via a client-side navigation (e.g. after signing out) is bounced
// here. This is a render GATE, not a passive effect — it withholds the
// protected children until auth is confirmed, so protected content never
// paints for a frame before the redirect. `replace` keeps the gated entry out
// of history so Back doesn't oscillate with /login.
function RequireAuthGate({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()

  React.useEffect(() => {
    if (!isLoggedIn) navigate({ to: '/login', replace: true })
  }, [isLoggedIn, navigate])

  if (!isLoggedIn) return null

  return <>{children}</>
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
    const raw = getCookie(FEATURE_FLAGS_STORAGE_KEY)
    const flags = parseSeedCookie(raw) as Partial<
      Record<string, boolean>
    > | null

    return {
      flags,
      loggedIn: getCookie(AUTH_COOKIE_KEY) === 'true',
    }
  },
)

export const Route = createRootRoute({
  loader: async (
    ctx,
  ): Promise<{
    seed: RootLoaderSeed | null
  }> => {
    // Only run the cookie read on the server. On the client (e.g. a later
    // client-side navigation re-running this loader) there is nothing to
    // seed — the providers are already mounted — so short-circuit rather
    // than round-tripping the server function over RPC.
    if (typeof document !== 'undefined') return { seed: null }

    const seed = await readSeedCookies()

    if (!seed.loggedIn && !isPublicPath(ctx.location.pathname)) {
      throw redirect({ to: '/login' })
    }

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
  // Derive the active pathname from the matched route, NOT location.pathname.
  // `matches` stays in sync with what <Outlet> renders; location.pathname
  // updates optimistically at the start of a navigation. Keying the branch on
  // the latter would flip the provider tree (guest shell vs app shell) a frame
  // before the Outlet swaps, so the outgoing page could render under the wrong
  // branch and crash — e.g. StudentsPage losing BreadcrumbProvider on sign-out.
  const activePathname =
    (matches.at(-1) as { pathname?: string } | undefined)?.pathname ?? ''
  const isNotFoundRoute =
    matches.some((m) => m.routeId === '/$') ||
    matches.at(-1)?.status === 'notFound'
  const { seed } = Route.useLoaderData()

  // Public routes (and the 404 page) render a minimal shell with no auth gate.
  // Reuse the same isPublicPath predicate the server loader uses so the two
  // sides can never drift out of sync.
  if (isPublicPath(activePathname) || isNotFoundRoute) {
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
          <RequireAuthGate>
            <FeatureFlagProvider initialFlags={seed?.flags}>
              <BreadcrumbProvider>
                <HeyTaliaProvider>
                  <HdpCaptureProvider>
                    <SidebarProvider>
                      <MobileSidebarAutoClose />
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
                      <Toaster
                        position="bottom-right"
                        offset={{ bottom: 88 }}
                      />
                      <WelcomeModal />
                    </SidebarProvider>
                  </HdpCaptureProvider>
                </HeyTaliaProvider>
              </BreadcrumbProvider>
            </FeatureFlagProvider>
          </RequireAuthGate>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
