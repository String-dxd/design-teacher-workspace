import { Link } from '@tanstack/react-router'
import { TagQueueOverlay } from './tag-queue-overlay'
import { TagQueueProvider } from './tag-queue-context'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Context reach: __root.tsx mounts HdpShell as a sibling of SidebarInset, so
// a provider living only in HdpShell couldn't reach AppHeader (which
// renders inside SidebarInset). HdpCaptureProvider is exported separately so
// __root.tsx can wrap the whole SidebarProvider block in it — every
// "Tag student" button shares the one session. It renders children directly
// (no flag check): the flag gates the overlay and buttons themselves, and
// openTagQueue no-ops when the flag is off, so a stale caller can't open a
// dead overlay.
export const HdpCaptureProvider = TagQueueProvider

// The floating FAB is gone (maintainer feedback 2026-07-17) — capture opens
// from the primary "Tag student" button in the /reports page header and the
// per-row quick-tag buttons. Only the shared overlay remains global.
export function HdpShell() {
  const enabled = useFeatureFlag('reports-hdp')
  if (!enabled) return null
  return <TagQueueOverlay />
}

// Shared "Reports is off" page gate — used by every HDP Reports route so the
// off-state copy and affordance stay in lockstep across the module.
export function HdpFlagGate({ children }: { children: React.ReactNode }) {
  const enabled = useFeatureFlag('reports-hdp')
  if (!enabled) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Reports is off</h1>
        <p className="text-muted-foreground text-sm">
          Turn on “HDP Reports module” to use this page.
        </p>
        <Link
          to="/flags"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Open feature flags
        </Link>
      </main>
    )
  }
  return <>{children}</>
}

// Shared "Student not found" page fallback for the two $studentId routes
// under /reports (students river and drafts studio) — identical copy and
// affordance in both, so it lives here once.
export function HdpStudentNotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Student not found</h1>
      <Link to="/reports" className={cn(buttonVariants())}>
        Back to Reports
      </Link>
    </main>
  )
}
