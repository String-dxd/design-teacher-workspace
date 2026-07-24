import { createFileRoute, useNavigate } from '@tanstack/react-router'
import * as React from 'react'

import { DEMO_PASSWORD, useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/_guest/student-login')({
  component: StudentLoginPage,
})

function StudentLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [passwordError, setPasswordError] = React.useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Same demo-password gate as /login — this route must not be a
    // passwordless side door into the signed-in app.
    if (password !== DEMO_PASSWORD) {
      setPasswordError(true)
      return
    }
    login()
    navigate({ to: '/' })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-foreground">
              Sign in
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Enter your school email and password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@schools.gov.sg"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="text-xs font-medium text-twblue-11 transition-colors hover:text-twblue-12"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setPassword(e.target.value)
                    setPasswordError(false)
                  }}
                  required
                  aria-invalid={passwordError}
                />
                {passwordError && (
                  <p className="text-sm text-destructive">
                    Incorrect password. Try again.
                  </p>
                )}
              </div>

              <Button type="submit" className="mt-3 w-full">
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
