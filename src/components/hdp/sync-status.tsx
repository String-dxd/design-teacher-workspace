import * as React from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type SyncStatusState =
  | { kind: 'none' }
  | { kind: 'synced'; at: string; studentCount: number }
  | { kind: 'stale'; unsyncedCount: number }

interface SyncStatusProps {
  state: SyncStatusState
  onSyncNow: () => Promise<void>
}

function minutesAgo(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
}

// One line describing the send state. Comments are SENT to School Cockpit
// (one direction — marks come the other way and are never pushed), so the
// copy says "send", never "sync" (walkthrough decision 2026-07-17). A
// pending count is normal, expected state — not an error — so it renders
// in text-foreground font-medium, never red; "none" (nothing confirmed
// yet) is plain neutral text.
export function SyncStatus({ state, onSyncNow }: SyncStatusProps) {
  const [syncing, setSyncing] = React.useState(false)

  if (state.kind === 'none') {
    return (
      <p className="text-muted-foreground text-sm">
        Nothing confirmed yet — confirmed comments are sent to School Cockpit
        from here.
      </p>
    )
  }

  if (state.kind === 'synced') {
    return (
      <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <Check className="size-4" aria-hidden />
        Sent to School Cockpit · {minutesAgo(state.at)}m ago ·{' '}
        {state.studentCount} student{state.studentCount === 1 ? '' : 's'}
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-foreground text-sm font-medium">
        {state.unsyncedCount} comment{state.unsyncedCount === 1 ? '' : 's'} not
        yet sent to School Cockpit
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={syncing}
        onClick={async () => {
          setSyncing(true)
          await onSyncNow()
          setSyncing(false)
        }}
      >
        {syncing ? 'Sending…' : 'Send now'}
      </Button>
    </div>
  )
}
