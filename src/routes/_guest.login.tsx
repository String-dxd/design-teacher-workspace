import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Loader2, Settings2, X } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/_guest/login')({
  component: LoginPage,
})

type EduPassState = 'idle' | 'loading' | 'error'

const EDUPASS_STATES: Array<{ label: string; value: EduPassState }> = [
  { label: 'Idle', value: 'idle' },
  { label: 'Loading', value: 'loading' },
  { label: 'Error', value: 'error' },
]

type OtpState =
  | 'email-input'
  | 'invalid-email'
  | 'network-error'
  | 'otp-verify'
  | 'otp-verify-no-countdown'
  | 'invalid-otp'

const OTP_STATES: Array<{ label: string; value: OtpState }> = [
  { label: 'Email input', value: 'email-input' },
  { label: 'Invalid email', value: 'invalid-email' },
  { label: 'Network error', value: 'network-error' },
  { label: 'OTP verify', value: 'otp-verify' },
  { label: 'OTP (no countdown)', value: 'otp-verify-no-countdown' },
  { label: 'Invalid OTP', value: 'invalid-otp' },
]

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = React.useState('')
  const [otpCode, setOtpCode] = React.useState('')
  const [eduPassState, setEduPassState] = React.useState<EduPassState>('idle')
  const [otpState, setOtpState] = React.useState<OtpState>('email-input')
  const [countdown, setCountdown] = React.useState(60)

  // Reset OTP code and countdown when otpState changes
  React.useEffect(() => {
    setOtpCode('')
    if (otpState === 'otp-verify') {
      setCountdown(60)
    }
  }, [otpState])

  // Live countdown timer
  React.useEffect(() => {
    if (otpState !== 'otp-verify' || countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [otpState, countdown])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    login()
    navigate({ to: '/' })
  }

  function handleEduPassLogin() {
    if (eduPassState === 'loading') return
    setEduPassState('loading')
    const timer = setTimeout(() => {
      if (Math.random() > 0.2) {
        login()
        navigate({ to: '/' })
      } else {
        setEduPassState('error')
      }
    }, 1500)
    return () => clearTimeout(timer)
  }

  function handleBackToEmail() {
    setOtpState('email-input')
    setOtpCode('')
  }

  const isOtpScreen =
    otpState === 'otp-verify' ||
    otpState === 'otp-verify-no-countdown' ||
    otpState === 'invalid-otp'

  const showEmailError =
    otpState === 'invalid-email' || otpState === 'network-error'

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-sm font-medium text-foreground">Sign in</span>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={() => navigate({ to: '/' })}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center gap-16 px-8">
        <div className="w-full max-w-sm">
          <div className="rounded-3xl border bg-card p-8 shadow-none">
            <div className="transition-opacity duration-200">
              {isOtpScreen ? (
                <OtpVerifyCard
                  otpState={otpState}
                  otpCode={otpCode}
                  countdown={countdown}
                  onOtpChange={setOtpCode}
                  onSignIn={handleSubmit}
                  onBack={handleBackToEmail}
                  onResend={() => {
                    setCountdown(60)
                    setOtpState('otp-verify')
                  }}
                  email={email || 'name@schools.gov.sg'}
                />
              ) : (
                <>
                  <h1 className="text-xl font-semibold text-foreground">
                    Sign in to Teacher Workspace
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {showEmailError
                      ? 'Enter your @schools.gov.sg email to receive a one-time password.'
                      : 'Sign in with your Edupass account or school email.'}
                  </p>

                  <Button
                    className="mt-6 w-full"
                    disabled={eduPassState === 'loading'}
                    onClick={handleEduPassLogin}
                  >
                    {eduPassState === 'loading' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connecting to Edupass…
                      </>
                    ) : (
                      'Sign in with Edupass'
                    )}
                  </Button>
                  {eduPassState === 'error' && (
                    <p className="mt-2 text-sm text-destructive">
                      Edupass is unavailable. Please try again or Sign in with
                      OTP.
                    </p>
                  )}

                  <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-sm text-muted-foreground">or</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <Input
                      type="email"
                      placeholder="e.g. name@schools.gov.sg"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      aria-invalid={showEmailError}
                      className={
                        showEmailError ? 'border-destructive ring-destructive/20' : ''
                      }
                    />
                    {otpState === 'invalid-email' && (
                      <p className="-mt-1 text-sm text-destructive">
                        Use your @schools.gov.sg email
                      </p>
                    )}
                    {otpState === 'network-error' && (
                      <p className="-mt-1 text-sm text-destructive">
                        Sign in failed due to network issues, try again.
                      </p>
                    )}
                    <Button
                      type="submit"
                      variant="secondary"
                      className="w-full"
                    >
                      Sign in with OTP
                    </Button>
                  </form>
                </>
              )}
            </div>
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

      {/* Floating design tools */}
      <Popover>
        <PopoverTrigger
          render={
            <button className="fixed bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border bg-card shadow-lg transition-shadow hover:shadow-xl">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
            </button>
          }
        />
        <PopoverContent side="top" sideOffset={8} align="end" className="w-64">
          <PopoverHeader>
            <PopoverTitle>Design Tools</PopoverTitle>
          </PopoverHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">
                Edupass State
              </label>
              <Select
                value={eduPassState}
                onValueChange={(val) => setEduPassState(val as EduPassState)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EDUPASS_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">
                OTP State
              </label>
              <Select
                value={otpState}
                onValueChange={(val) => setOtpState(val as OtpState)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OTP_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function OtpVerifyCard({
  otpState,
  otpCode,
  countdown,
  onOtpChange,
  onSignIn,
  onBack,
  onResend,
  email,
}: {
  otpState: OtpState
  otpCode: string
  countdown: number
  onOtpChange: (val: string) => void
  onSignIn: (e: React.FormEvent) => void
  onBack: () => void
  onResend: () => void
  email: string
}) {
  const showInvalidOtp = otpState === 'invalid-otp'
  const showCountdown = otpState === 'otp-verify' && countdown > 0
  const otpPrefix = otpState === 'otp-verify' ? 'e3myWwd5-' : 'E3MYWWD5-'

  return (
    <>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Button>

      <h1 className="text-xl font-semibold text-foreground">
        Enter your one-time password
        {otpState === 'otp-verify' ? ' (OTP)' : ''}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We sent a one-time password to{' '}
        <span className="font-semibold text-foreground">{email}</span>. Enter the
        characters that follow the prefix shown.
      </p>

      <form onSubmit={onSignIn} className="mt-6">
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-base font-medium text-foreground">
            {otpPrefix}
          </span>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="123123"
            value={otpCode}
            onChange={(e) => onOtpChange(e.target.value)}
            aria-invalid={showInvalidOtp}
            className={showInvalidOtp ? 'border-destructive ring-destructive/20' : ''}
          />
          <Button type="submit" className="shrink-0">
            Sign in
          </Button>
        </div>
        {showInvalidOtp && (
          <p className="mt-2 text-sm text-destructive">
            Invalid OTP. Try again or resend.
          </p>
        )}
      </form>

      <div className="mt-6 space-y-1">
        <p className="text-sm text-muted-foreground">
          It may take a moment to arrive.
        </p>
        {showCountdown ? (
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive? Resend OTP ({countdown})
          </p>
        ) : (
          <button
            type="button"
            onClick={onResend}
            className="text-sm font-medium text-twblue-11 hover:underline"
          >
            Didn&apos;t receive? Resend OTP
          </button>
        )}
      </div>
    </>
  )
}
