import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { FileDown } from 'lucide-react'
import { toast } from 'sonner'

import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type ReportTab = 'onboarding' | 'travel-declaration'
type DeclarationStatus = 'not-declared' | 'declared'

const MY_CLASS = '3A'
const SCHOOL_NAME = 'Fruits Primary School'

export const Route = createFileRoute('/reports/')({
  validateSearch: (search) => ({
    tab: (search.tab as ReportTab | undefined) ?? 'onboarding',
    scope: (search.scope as 'my' | 'school' | undefined) ?? 'my',
  }),
  component: ReportsPage,
})

function ReportsPage() {
  const { tab, scope } = Route.useSearch()
  const navigate = useNavigate()
  const isSchoolWide = scope === 'school'

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

  function toggleSchoolWide() {
    navigate({
      to: '/reports/',
      search: (prev) => ({ ...prev, scope: isSchoolWide ? 'my' : 'school' }),
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
      <div className="shrink-0 space-y-5 pt-6">
        {/* ── Title ───────────────────────────────────────────────────────────── */}
        <div className="border-b px-6 pb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Reports</h1>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-900">
              Concept
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Export reports for your {isSchoolWide ? 'school' : 'class'}.
          </p>
        </div>

        {/* ── Filter row: report tabs + school-wide — mirrors Posts pattern ──────── */}
        <div className="px-6">
          <div className="flex items-center gap-2">
            <div className="flex shrink-0 rounded-full bg-muted p-1 gap-1">
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
            <button
              type="button"
              onClick={toggleSchoolWide}
              className={cn(
                'flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
                isSchoolWide
                  ? 'border-foreground/20 bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground',
              )}
            >
              School-wide
            </button>
          </div>
        </div>

        {/* ── School-wide banner ──────────────────────────────────────────────── */}
        {isSchoolWide && (
          <div className="mx-6 flex items-center rounded-lg border border-border bg-muted/50 px-4 py-2.5">
            <p className="text-sm text-muted-foreground">
              Viewing school-wide. The export will cover all classes.
            </p>
          </div>
        )}

        {/* ── Content section ─────────────────────────────────────────────────── */}
        <div className="px-6 pb-8">
          <section className="rounded-xl border bg-white p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Generating report for
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
    </div>
  )
}
