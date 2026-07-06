import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth'

const SESSION_KEY = 'tw_welcome_seen'

export function WelcomeModal() {
  const { isLoggedIn } = useAuth()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (isLoggedIn) {
      setOpen(false)
      return
    }
    if (!sessionStorage.getItem(SESSION_KEY)) {
      setOpen(true)
    }
  }, [isLoggedIn])

  function handleDismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setOpen(false)
    window.dispatchEvent(new CustomEvent('welcome-dismissed'))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleDismiss()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-xs p-0 overflow-hidden gap-0"
      >
        <div className="flex flex-col items-start gap-4 p-6">
          <div className="w-full flex justify-center">
            <div className="w-[256px] overflow-hidden rounded-2xl bg-slate-1 shrink-0">
              <video
                src="/video-onboarding.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base font-semibold leading-snug">
                Welcome to Teacher Workspace
              </DialogTitle>
              <span className="shrink-0 rounded-full bg-twblue-3 px-1.5 py-0.5 text-xs font-medium text-twblue-9">
                Beta
              </span>
            </div>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              One place for all your tools built for teachers, designed to save
              time and keep everything within reach.
            </DialogDescription>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Early access for selected teachers. Share your thoughts via the{' '}
              <strong className="text-foreground font-medium">Help</strong> icon
              in the sidebar.
            </DialogDescription>
          </div>

          <div className="w-full flex justify-end items-start">
            <Button className="w-fit" onClick={handleDismiss}>
              Get started
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
