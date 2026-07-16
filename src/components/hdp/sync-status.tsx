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

// One line describing the sync state. A stale count is normal, expected
// state — not an error — so it renders in text-foreground font-medium,
// never red; "none" (nothing confirmed yet) is plain neutral text.
export function SyncStatus({ state, onSyncNow }: SyncStatusProps) {
  const [syncing, setSyncing] = React.useState(false)

  if (state.kind === 'none') {
    return (
      <p className="text-muted-foreground text-sm">
        Nothing confirmed yet — synced drafts will show up here.
      </p>
    )
  }

  if (state.kind === 'synced') {
    return (
      <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <Check className="size-4" aria-hidden />
        Synced with School Cockpit · {minutesAgo(state.at)}m ago ·{' '}
        {state.studentCount} student{state.studentCount === 1 ? '' : 's'}
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-foreground text-sm font-medium">
        {state.unsyncedCount} change{state.unsyncedCount === 1 ? '' : 's'} not
        yet synced
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
        {syncing ? 'Syncing…' : 'Sync now'}
      </Button>
    </div>
  )
}
