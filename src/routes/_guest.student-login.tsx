import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@flow/core'
import * as React from 'react'

import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/_guest/student-login')({
  component: StudentLoginPage,
})

function StudentLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    login()
    navigate({ to: '/' })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-md">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="typography-title-lg text-foreground-default">
              Sign in
            </CardTitle>
            <CardDescription className="typography-body-md text-foreground-subtle">
              Enter your school email and password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
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

              <div className="flex flex-col gap-xs">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="typography-label-sm text-foreground-link hover:text-foreground-link-hover transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  required
                />
              </div>

              <Button type="submit" className="mt-sm w-full">
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
