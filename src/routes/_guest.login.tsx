import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { DEMO_PASSWORD, useAuth } from '@/lib/auth'

export const Route = createFileRoute('/_guest/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [password, setPassword] = React.useState('')
  const [passwordError, setPasswordError] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== DEMO_PASSWORD) {
      setPasswordError(true)
      return
    }
    login()
    navigate({ to: '/' })
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-sm font-medium text-foreground">Sign in</span>
      </div>

      <div className="flex flex-1 items-center justify-center gap-16 px-8">
        <div className="w-full max-w-sm">
          <div className="rounded-3xl border bg-card p-8 shadow-none">
            <h1 className="text-xl font-semibold text-foreground">
              Sign in to Teacher Workspace
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in with your Edupass account or the demo password.
            </p>

            <Dialog>
              <DialogTrigger
                render={
                  <Button className="mt-6 w-full">Sign in with Edupass</Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Edupass sign-in is not available yet
                  </DialogTitle>
                  <DialogDescription>
                    This sign-in option is still being set up. Please sign in
                    with the demo account password instead.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button>OK, got it</Button>} />
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <InputGroup>
                <InputGroupInput
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Demo password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordError(false)
                  }}
                  required
                  aria-invalid={passwordError}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {passwordError && (
                <p className="-mt-1 text-sm text-destructive">
                  Incorrect password. Try again.
                </p>
              )}
              <Button type="submit" variant="secondary" className="w-full">
                Sign in with demo account
              </Button>
            </form>
          </div>
        </div>

        <div className="hidden lg:block">
          <img
            src="/teacher-illustration.png"
            alt="Teacher illustration"
            className="h-auto w-80 object-contain"
          />
        </div>
      </div>
    </div>
  )
}
