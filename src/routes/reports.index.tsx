import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Check, ChevronDown, FileDown } from 'lucide-react'
import { toast } from 'sonner'

import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type ReportTab = 'onboarding' | 'travel-declaration'
type DeclarationStatus = 'not-declared' | 'declared'

const MY_CLASS = '3A'
const SCHOOL_NAME = 'Fruits Primary School'

export const Route = createFileRoute('/reports/')({
  validateSearch: (search) => ({
    tab: (search.tab as ReportTab | undefined) ?? 'onboarding',
    scope: (search.scope as 'my' | 'school' | undefined) ?? 'my',
    view: (search.view as 'admin' | undefined) ?? undefined,
  }),
  component: ReportsRouteComponent,
})

function ReportsRouteComponent() {
  const { view } = Route.useSearch()
  if (view === 'admin') return <AdminReportsPage />
  return <RegularReportsPage />
}

// AdminReportsPage — admin handover view (do not amend)
function AdminReportsPage() {
  return <ReportsPage isAdmin />
}

// RegularReportsPage — regular teacher view (amend this for regular users)
function RegularReportsPage() {
  return <ReportsPage />
}

const SCOPE_OPTIONS = [
  {
    value: 'my',
    label: 'My Class',
    description: `Reports for your class (${MY_CLASS})`,
  },
  {
    value: 'school',
    label: 'School',
    description: 'All reports across the school',
  },
] as const

function ReportsPage({ isAdmin = false }: { isAdmin?: boolean }) {
  const { tab, scope } = Route.useSearch()
  const navigate = useNavigate()
  const isSchoolWide = isAdmin && scope === 'school'

  const [open, setOpen] = useState(false)
  const [declarationStatus, setDeclarationStatus] =
    useState<DeclarationStatus | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useSetBreadcrumbs([{ label: 'Reports', href: '/reports' }])

  function switchTab(newTab: ReportTab) {
    setDeclarationStatus(null)
    setStartDate('')
    setEndDate('')
    navigate({
      to: '/reports/',
      search: (prev) => ({ ...prev, tab: newTab }),
      replace: true,
    })
  }

  const scopeLabel = isSchoolWide ? SCHOOL_NAME : MY_CLASS

  const exportButtonLabel = isSchoolWide
    ? 'Export all records to Excel'
    : `Export ${scopeLabel} to Excel`

  const canExport =
    tab === 'onboarding' ||
    (declarationStatus !== null && startDate !== '' && endDate !== '')

  function handleExport() {
    toast.success(
      tab === 'onboarding'
        ? `Exporting onboarding report for ${scopeLabel}…`
        : `Exporting travel declaration report for ${scopeLabel}…`,
    )
  }

  return (
    <div className="flex flex-col">
      <div className="shrink-0 space-y-4 pt-6">
        {/* ── Page header ─────────────────────────────────────────────────────── */}
        <div className="px-6">
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="mt-1 hidden text-sm text-muted-foreground lg:block">
            Export reports for your {isSchoolWide ? 'school' : 'class'}.
            {isAdmin && (
              <>
                <br />
                Switch between your class and a school-wide view below.
              </>
            )}
          </p>
        </div>

        {/* ── Scope selector ──────────────────────────────────────────────────── */}
        <div className="px-6">
          {isAdmin ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger className="inline-flex cursor-pointer items-center gap-1.5 bg-transparent p-0 text-lg font-semibold outline-none">
              {isSchoolWide ? 'School' : 'My Class'}
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent
              className="w-56 gap-0 overflow-hidden rounded-2xl p-1"
              align="start"
            >
              {SCOPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    navigate({
                      to: '/reports/',
                      search: (prev) => ({ ...prev, scope: opt.value }),
                      replace: true,
                    })
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full flex-col rounded-xl px-3 py-2 text-left transition-colors hover:bg-accent',
                    scope === opt.value && 'bg-accent',
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span className="text-sm font-medium">{opt.label}</span>
                    {scope === opt.value && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {opt.description}
                  </span>
                </button>
              ))}
            </PopoverContent>
          </Popover>
          ) : (
            <span className="text-lg font-semibold">My Class</span>
          )}
        </div>
      </div>

      {/* ── Filter row: report tabs ──────────────────────────────────────────── */}
      <div className="mt-4 border-b px-6 pb-4">
        <div className="flex w-fit shrink-0 rounded-full bg-muted p-1 gap-1">
          <button
            type="button"
            onClick={() => switchTab('onboarding')}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all',
              tab === 'onboarding'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Onboarding
          </button>
          <button
            type="button"
            onClick={() => switchTab('travel-declaration')}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all',
              tab === 'travel-declaration'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Travel Declaration
          </button>
        </div>
      </div>

      {/* ── Content section ─────────────────────────────────────────────────── */}
      <div className="mt-6 px-6 pb-8">
        <section className="rounded-xl border bg-white p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {tab === 'onboarding'
                ? 'Generating onboarding report for'
                : 'Generating travel declaration report for'}
            </p>
            <p className="mt-1 text-xl font-semibold">
              {isSchoolWide ? SCHOOL_NAME : MY_CLASS}
            </p>
          </div>

          {/* Onboarding */}
          {tab === 'onboarding' && (
            <div className="space-y-1.5">
              <Button onClick={handleExport}>
                <FileDown className="mr-2 h-4 w-4" />
                {exportButtonLabel}
              </Button>
              <p className="text-xs text-muted-foreground">
                To allow or remove PG access for custodians, please do so in
                School Cockpit.
              </p>
            </div>
          )}

          {/* Travel Declaration */}
          {tab === 'travel-declaration' && (
            <div className="space-y-5">
              {/* Declaration status */}
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Declaration status</p>
                <div className="space-y-2">
                  {(
                    [
                      {
                        value: 'not-declared' as const,
                        label: 'Did Not Declare (No declarations made)',
                      },
                      {
                        value: 'declared' as const,
                        label:
                          'Declared (Include travelling and not travelling)',
                      },
                    ] satisfies Array<{
                      value: DeclarationStatus
                      label: string
                    }>
                  ).map((opt) => {
                    const isSelected = declarationStatus === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDeclarationStatus(opt.value)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all text-left',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-background hover:border-primary/40',
                        )}
                      >
                        <div
                          className={cn(
                            'h-4 w-4 shrink-0 rounded-full border-2 transition-all',
                            isSelected
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground',
                          )}
                        >
                          {isSelected && (
                            <div className="h-full w-full scale-[0.4] rounded-full bg-white" />
                          )}
                        </div>
                        <span className={cn(isSelected && 'font-medium')}>
                          {opt.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Date range */}
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Date range</p>
                <p className="text-xs text-muted-foreground">
                  E.g. For the June 2025 School Holidays, enter Start Date (30
                  May) and End Date (28 Jun).
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                  />
                  <span className="text-sm text-muted-foreground">→</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Export */}
              <div>
                <Button onClick={handleExport} disabled={!canExport}>
                  <FileDown className="mr-2 h-4 w-4" />
                  {exportButtonLabel}
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
