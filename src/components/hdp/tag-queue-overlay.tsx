import { TagQueueComposer } from './tag-queue-composer'
import { useTagQueue } from './tag-queue-context'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// The Tag Queue overlay: a Base UI Dialog around the shared composer. Never
// mutates the underlying screen — no navigation, no route-state writes on
// open/close. Esc closes and Base UI restores focus to the trigger (the FAB
// or the top-bar + Tag button).
export function TagQueueOverlay() {
  const { open, closeTagQueue } = useTagQueue()

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeTagQueue()
      }}
    >
      <DialogContent className="flex h-dvh w-full max-w-full flex-col overflow-y-auto rounded-none duration-150 motion-reduce:animate-none motion-reduce:transition-none data-open:zoom-in-[98%] data-closed:zoom-out-[98%] sm:h-auto sm:max-h-[85vh] sm:w-[560px] sm:max-w-[calc(100vw-2rem)] sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle>Add observation</DialogTitle>
        </DialogHeader>
        <TagQueueComposer onSaveClose={closeTagQueue} />
      </DialogContent>
    </Dialog>
  )
}
