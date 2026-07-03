import { createFileRoute } from '@tanstack/react-router'
import { X } from 'lucide-react'

import type { FeatureFlags } from '@/lib/feature-flags/types'
import { Button } from '@/components/ui/button'
import {
  DEFAULT_FEATURE_FLAGS,
  FEATURE_FLAGS_STORAGE_KEY,
} from '@/lib/feature-flags/constants'

export const Route = createFileRoute('/_guest/create')({
  component: CreatePage,
})

function AnnouncementMockup() {
  return (
    <div className="flex flex-col gap-2 p-4 pb-7">
      <div className="h-2.5 w-2/3 rounded-full bg-border" />
      <div className="h-2 w-full rounded-full bg-muted" />
      <div className="h-2 w-5/6 rounded-full bg-muted" />
      <div className="h-2 w-4/6 rounded-full bg-muted" />
      <div className="h-2 w-full rounded-full bg-muted" />
    </div>
  )
}

function ResponseMockup() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="h-2.5 w-2/3 rounded-full bg-border" />
      <div className="h-2 w-full rounded-full bg-muted" />
      <div className="h-2 w-5/6 rounded-full bg-muted" />
      <div className="mt-1 flex h-7 items-center justify-center rounded-md bg-primary/80">
        <div className="h-1.5 w-14 rounded-full bg-primary-foreground/70" />
      </div>
    </div>
  )
}

function FormMockup() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2.5">
        <div className="h-4 w-4 shrink-0 rounded border-2 border-border" />
        <div className="h-2 w-3/4 rounded-full bg-muted" />
      </div>
      <div className="flex items-center gap-2.5">
        <div className="h-4 w-4 shrink-0 rounded border-2 border-border" />
        <div className="h-2 w-2/3 rounded-full bg-muted" />
      </div>
      <div className="flex items-center gap-2.5">
        <div className="h-4 w-4 shrink-0 rounded border-2 border-border" />
        <div className="h-2 w-4/5 rounded-full bg-muted" />
      </div>
    </div>
  )
}

interface CreateOption {
  title: string
  description: string
  to: string
  search?: Record<string, string>
  mockup: React.ReactNode
}

const CREATE_OPTIONS: Array<CreateOption> = [
  {
    title: 'No response needed',
    description:
      'Parents read the post on Parents Gateway. No action required.',
    to: '/announcements/new',
    mockup: <AnnouncementMockup />,
  },
  {
    title: 'Collect responses',
    description: 'Parents acknowledge or answer yes/no on Parents Gateway.',
    to: '/announcements/new',
    search: { responseType: 'acknowledge' },
    mockup: <ResponseMockup />,
  },
  {
    title: 'Custom form',
    description:
      'Create a form with custom questions to collect data from parents.',
    to: '/forms/new',
    mockup: <FormMockup />,
  },
]

function CreateCard({ option }: { option: CreateOption }) {
  return (
    <button
      type="button"
      onClick={() => {
        const searchStr = option.search
          ? '?' + new URLSearchParams(option.search).toString()
          : ''
        window.location.href = option.to + searchStr
      }}
      className="group flex flex-col overflow-hidden rounded-xl border-2 border-border bg-card text-left transition-all duration-150 ease-out hover:border-slate-8 hover:shadow-sm active:scale-[0.98]"
    >
      <div className="h-28 border-b border-border bg-muted">
        {option.mockup}
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {option.title}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {option.description}
          </p>
        </div>
      </div>
    </button>
  )
}

function getFormsEnabled(): boolean {
  try {
    const stored = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY)
    if (stored) {
      const flags = JSON.parse(stored) as Partial<FeatureFlags>
      return flags.forms ?? DEFAULT_FEATURE_FLAGS.forms
    }
  } catch {
    // ignore
  }
  return DEFAULT_FEATURE_FLAGS.forms
}

function CreatePage() {
  const formsEnabled = getFormsEnabled()

  const options = formsEnabled
    ? CREATE_OPTIONS
    : CREATE_OPTIONS.filter((o) => o.title !== 'Custom form')

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-sm font-medium text-foreground">Create</span>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={() => {
            window.location.href = '/announcements'
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-start justify-center px-6 pt-12 sm:items-center sm:pt-0">
        <div className="w-full max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-xl font-semibold text-foreground text-wrap-balance sm:text-2xl">
              Create new post
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose whether parents need to respond.
            </p>
          </div>

          <div
            className={`grid grid-cols-1 gap-4 ${formsEnabled ? 'sm:grid-cols-3' : 'mx-auto max-w-2xl sm:grid-cols-2'}`}
          >
            {options.map((option) => (
              <CreateCard key={option.title} option={option} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
