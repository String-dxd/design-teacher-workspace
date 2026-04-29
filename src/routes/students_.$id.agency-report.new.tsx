import { useEffect, useState } from 'react'
import {
  Link,
  createFileRoute,
  notFound,
  useNavigate,
} from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Download,
  Eye,
  EyeOff,
  FileText,
  Filter,
  ListChecks,
  Lock,
  PanelRight,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from 'lucide-react'

import type {
  AgencyTemplate,
  ReportField,
  ReportSection,
} from '@/data/mock-agency-reports'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { getStudentById } from '@/data/mock-students'
import type {
  AgencyReport,
  AiSourceItem,
  SectionAssignment,
  Staff,
} from '@/data/mock-agency-reports'
import {
  AGENCY_TEMPLATES,
  AI_DRAFTS,
  AI_DRAFT_CITATIONS,
  CURRENT_USER,
  MOCK_AI_SOURCES,
  MOCK_COUNSELLOR,
  MOCK_STAFF,
  mockAgencyReports,
} from '@/data/mock-agency-reports'
import { toast } from 'sonner'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'

export const Route = createFileRoute('/students_/$id/agency-report/new')({
  component: AgencyReportWizardPage,
  validateSearch: (search): {
    resume?: string
    reportId?: string
  } => ({
    resume:
      typeof search.resume === 'string' ? (search.resume as string) : undefined,
    reportId:
      typeof search.reportId === 'string'
        ? (search.reportId as string)
        : undefined,
  }),
  loader: ({ params }) => {
    const student = getStudentById(params.id)
    if (!student) throw notFound()
    return { student }
  },
})

// ── Types ──────────────────────────────────────────────────────

type WizardStep = 'templates' | 'form' | 'export' | 'done'

// ── Step bar ──────────────────────────────────────────────────

const STEP_LABELS = ['Template', 'Fill Report', 'Export']
const STEP_MAP: Record<WizardStep, number> = {
  templates: 0,
  form: 1,
  export: 2,
  done: 2,
}

const PREVIEW_SCALES = [0.55, 0.68, 0.82, 1] as const

function StepBar({
  step,
  onBack,
  canGoBack,
  onStepClick,
}: {
  step: WizardStep
  onBack?: () => void
  canGoBack?: boolean
  onStepClick?: (index: number) => void
}) {
  const cur = STEP_MAP[step]
  return (
    <div className="flex items-center gap-3 border-b bg-white px-4 py-3">
      <div className="flex w-40 shrink-0 justify-start">
        {canGoBack && onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        )}
      </div>
      <div className="flex flex-1 items-center justify-center gap-0">
        {STEP_LABELS.map((label, i) => {
          const isPast = i < cur
          const isCurrent = i === cur
          const clickable = (isPast || isCurrent) && !!onStepClick
          return (
            <div key={i} className="flex items-center">
              <button
                type="button"
                onClick={clickable ? () => onStepClick!(i) : undefined}
                disabled={!clickable}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-1.5 rounded-full transition-colors',
                  clickable
                    ? 'cursor-pointer px-2 py-0.5 hover:bg-muted'
                    : 'cursor-default',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                    isPast
                      ? 'border-2 border-primary bg-primary/10 text-primary'
                      : isCurrent
                        ? 'bg-primary text-white'
                        : 'border-2 border-border bg-muted text-muted-foreground',
                  )}
                >
                  {isPast ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span
                  className={cn(
                    'hidden text-xs sm:block',
                    isCurrent
                      ? 'font-semibold text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </button>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 w-6 shrink-0',
                    i < cur ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
      <div className="w-40 shrink-0" />
    </div>
  )
}

// ── Student context bar ───────────────────────────────────────

function StudentBar({
  name,
  studentClass,
  inProgress,
}: {
  name: string
  studentClass: string
  inProgress: number
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted/40 px-4 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {name
          .split(' ')
          .slice(-2)
          .map((w) => w[0])
          .join('')}
      </div>
      <span className="font-semibold">{name}</span>
      <span className="text-sm text-muted-foreground">{studentClass}</span>
      {inProgress > 0 && (
        <Badge className="ml-auto bg-primary/10 text-primary hover:bg-primary/10">
          {inProgress} report{inProgress !== 1 ? 's' : ''} in progress
        </Badge>
      )}
    </div>
  )
}

// ── Agency icon badge ─────────────────────────────────────────

function AgencyIcon({ abbrev, color }: { abbrev: string; color: string }) {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-[10px] font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {abbrev.length > 4 ? abbrev.slice(0, 4) : abbrev}
    </div>
  )
}

// ── S2 Template Selection ─────────────────────────────────────

const TEMPLATE_CATEGORIES: Array<{
  id: string
  label: AgencyTemplate['category']
}> = [
  { id: 'care-placement', label: 'Care & Placement' },
  { id: 'family-social', label: 'Family & Social Services' },
  { id: 'mental-health', label: 'Mental Health' },
  { id: 'offences-law', label: 'Offences & Law Enforcement' },
]

function templatePreviewImg(template: AgencyTemplate): string | null {
  if (!template.templateFile) return null
  const filename = template.templateFile.split('/').pop() ?? ''
  const base = filename.replace(/\.(docx?|pdf)$/i, '')
  return `/report-previews/${base}-thumb.png`
}

function TemplateSelection({
  studentName,
  studentClass,
  studentId,
  selected,
  onToggle,
  onSelectAndContinue,
  onBack,
  onContinue,
}: {
  studentName: string
  studentClass: string
  studentId: string
  selected: Array<string>
  onToggle: (id: string) => void
  onSelectAndContinue: (id: string) => void
  onBack: () => void
  onContinue: () => void
}) {
  const [multiSelect, setMultiSelect] = useState(false)
  const [query, setQuery] = useState('')
  const [agencyFilter, setAgencyFilter] = useState<string>('all')

  const inProgressReports = mockAgencyReports.filter(
    (r) => r.studentId === studentId && r.status === 'draft',
  )

  // Unique agency list with short acronym, sorted alphabetically by abbrev
  const agencyAbbrev = (agency: string): string => {
    const tpl = AGENCY_TEMPLATES.find((t) => t.agency === agency)
    return tpl?.abbrev.split(/[-\s]/)[0] ?? agency
  }
  const agencyOptions = Array.from(
    new Set(AGENCY_TEMPLATES.map((t) => t.agency)),
  )
    .map((agency) => ({ agency, abbrev: agencyAbbrev(agency) }))
    .sort((a, b) => a.abbrev.localeCompare(b.abbrev))

  const [filterQuery, setFilterQuery] = useState('')
  const filteredAgencyOptions = filterQuery.trim()
    ? agencyOptions.filter(
        (o) =>
          o.abbrev.toLowerCase().includes(filterQuery.toLowerCase()) ||
          o.agency.toLowerCase().includes(filterQuery.toLowerCase()),
      )
    : agencyOptions

  const matchesFilter = (tpl: AgencyTemplate) => {
    if (agencyFilter !== 'all' && tpl.agency !== agencyFilter) return false
    if (!query.trim()) return true
    const q = query.trim().toLowerCase()
    return (
      tpl.name.toLowerCase().includes(q) ||
      tpl.agency.toLowerCase().includes(q)
    )
  }

  return (
    <div className="space-y-5">
      <StudentBar
        name={studentName}
        studentClass={studentClass}
        inProgress={inProgressReports.length}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Select a template</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Choose the agency report to generate for this student.
          </p>
        </div>
        <Button
          variant={multiSelect ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMultiSelect((m) => !m)}
          className="gap-1.5 text-xs"
        >
          <ListChecks className="h-3.5 w-3.5" />
          {multiSelect ? 'Cancel multi-select' : 'Select multiple'}
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Left column — drafts + template list */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* Continue working on — drafts/pending reviews */}
          {inProgressReports.length > 0 && !multiSelect && (
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Continue working on
              </p>
              <div className="space-y-2">
                {inProgressReports.map((r) => {
                  const tpl = AGENCY_TEMPLATES.find(
                    (t) => t.id === r.templateId,
                  )
                  if (!tpl) return null
                  const lastEdited = (r.startedAt ?? r.createdAt)
                    .toLocaleDateString('en-SG', {
                      day: 'numeric',
                      month: 'short',
                    })
                  const statusLabel =
                    r.status === 'draft'
                      ? 'DRAFT'
                      : r.status === 'edits_requested'
                        ? 'EDITS REQUESTED'
                        : 'PENDING REVIEW'
                  // Completion %: same calculation the Fill Report top bar
                  // uses — fraction of non-principal fields with a value.
                  const allFields = tpl.sections
                    .filter((s) => s.role !== 'principal')
                    .flatMap((s) => s.fields)
                  const filledCount = allFields.filter(
                    (f) => !!f.value,
                  ).length
                  const pct = allFields.length
                    ? Math.round((filledCount / allFields.length) * 100)
                    : 0
                  return (
                    <button
                      key={r.id}
                      onClick={() => onSelectAndContinue(tpl.id)}
                      className="group flex w-full items-center gap-4 rounded-[12px] border border-primary/30 bg-primary/5 px-4 py-3 text-left transition-colors hover:border-primary/60 hover:bg-primary/10"
                    >
                      <div className="flex shrink-0 items-center justify-center rounded-sm bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary-foreground">
                        {statusLabel}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <p className="truncate text-sm font-semibold">
                            {r.templateName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            · {r.agency}
                          </p>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1 max-w-[240px] flex-1 overflow-hidden rounded-full bg-primary/15">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-semibold tabular-nums text-muted-foreground">
                            {pct}%
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            · Last edited {lastEdited}
                          </span>
                        </div>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
                        Resume draft
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {inProgressReports.length > 0 && !multiSelect && (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Start a new report
            </p>
          )}

          {/* Search + agency filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by report or agency name"
                className="w-full pl-9"
                aria-label="Search templates"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 aria-expanded:bg-white"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                  {agencyFilter !== 'all' && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      1
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-60 p-0">
                <div className="border-b p-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      placeholder="Search ministries"
                      className="h-8 pl-7 text-xs"
                      aria-label="Search ministries"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  <button
                    onClick={() => {
                      setAgencyFilter('all')
                      setFilterQuery('')
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted',
                      agencyFilter === 'all' && 'font-semibold',
                    )}
                  >
                    {agencyFilter === 'all' ? (
                      <Check className="h-3 w-3 text-primary" />
                    ) : (
                      <span className="h-3 w-3" />
                    )}
                    All agencies
                  </button>
                  {filteredAgencyOptions.map(({ agency, abbrev }) => {
                    const on = agencyFilter === agency
                    return (
                      <button
                        key={agency}
                        onClick={() => {
                          setAgencyFilter(agency)
                          setFilterQuery('')
                        }}
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted',
                          on && 'font-semibold',
                        )}
                      >
                        {on ? (
                          <Check className="h-3 w-3 text-primary" />
                        ) : (
                          <span className="h-3 w-3" />
                        )}
                        <span className="w-14 shrink-0 font-mono">
                          {abbrev}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-muted-foreground">
                          {agency}
                        </span>
                      </button>
                    )
                  })}
                  {filteredAgencyOptions.length === 0 && (
                    <p className="px-3 py-2 text-xs text-muted-foreground">
                      No matching ministries
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Template list, grouped by category */}
          {TEMPLATE_CATEGORIES.map((cat) => {
            const catTemplates = AGENCY_TEMPLATES.filter(
              (t) => t.category === cat.label,
            )
              .filter(matchesFilter)
              .sort((a, b) => a.name.localeCompare(b.name))
            if (catTemplates.length === 0) return null
            return (
              <section
                key={cat.id}
                id={`cat-${cat.id}`}
                className="scroll-mt-24 overflow-hidden rounded-lg border bg-card"
              >
                <div className="border-b bg-muted/40 px-4 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {cat.label}
                  </p>
                </div>
                {catTemplates.map((tpl, i) => {
                  const on = selected.includes(tpl.id)
                  const locked = tpl.locked === true
                  const rowClasses = cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                    i > 0 && 'border-t',
                    locked
                      ? 'pointer-events-none opacity-50'
                      : 'hover:bg-muted/40',
                    on && multiSelect && !locked && 'bg-primary/5',
                  )
                  return (
                    <button
                      key={tpl.id}
                      disabled={locked}
                      aria-disabled={locked}
                      onClick={() => {
                        if (locked) return
                        if (multiSelect) {
                          onToggle(tpl.id)
                        } else {
                          onSelectAndContinue(tpl.id)
                        }
                      }}
                      className={rowClasses}
                    >
                      {multiSelect && !locked && (
                        <div
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                            on
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground/40 bg-background',
                          )}
                        >
                          {on && <Check className="h-3 w-3 text-white" />}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold">
                          {tpl.name}
                        </span>
                      </div>
                      <span className="hidden text-xs text-muted-foreground sm:block">
                        {tpl.agency}
                      </span>
                      {locked ? (
                        <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        !multiSelect && (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )
                      )}
                    </button>
                  )
                })}
              </section>
            )
          })}
        </div>

        {/* Right column — sticky jump links */}
        <aside className="hidden w-44 shrink-0 lg:block">
          <div className="sticky top-24 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Jump to
            </p>
            <nav className="flex flex-col gap-1">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <a
                  key={cat.id}
                  href={`#cat-${cat.id}`}
                  className="rounded-full bg-muted px-3 py-1.5 text-sm hover:bg-muted/80"
                >
                  {cat.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </div>

      {/* Footer — only visible in multi-select mode */}
      {multiSelect && (
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={() => setMultiSelect(false)}>
            Cancel
          </Button>
          <Button onClick={onContinue} disabled={selected.length === 0}>
            {selected.length === 0
              ? 'Select templates'
              : `Continue with ${selected.length} template${selected.length !== 1 ? 's' : ''}`}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

// ── S4/S5 Report Form ─────────────────────────────────────────

function AiSourcePanel({
  selectedIds,
  onChange,
  onGenerate,
  onCancel,
}: {
  selectedIds: Set<string>
  onChange: (next: Set<string>) => void
  onGenerate: () => void
  onCancel: () => void
}) {
  const grouped = MOCK_AI_SOURCES.reduce<Record<string, Array<AiSourceItem>>>(
    (acc, item) => {
      acc[item.system] = acc[item.system] || []
      acc[item.system].push(item)
      return acc
    },
    {},
  )
  const toggle = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(next)
  }
  return (
    <div className="mt-2 rounded-lg border bg-muted/20 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Select sources for AI draft
      </p>
      <div className="space-y-3">
        {Object.entries(grouped).map(([system, items]) => (
          <div key={system}>
            <p className="mb-1 text-[11px] font-semibold text-foreground">
              {system}
            </p>
            <div className="space-y-1">
              {items.map((it) => {
                const checked = selectedIds.has(it.id)
                return (
                  <label
                    key={it.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(it.id)}
                      className="h-3.5 w-3.5 cursor-pointer accent-primary"
                    />
                    <span className="flex-1">
                      {it.label}
                      {it.date ? ` — ${it.date}` : ''}
                    </span>
                    <a
                      href={it.href}
                      onClick={(e) => e.preventDefault()}
                      className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
                    >
                      View in {it.system}
                    </a>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        <Button
          size="sm"
          onClick={onGenerate}
          disabled={selectedIds.size === 0}
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Generate draft from {selectedIds.size} selected source
          {selectedIds.size !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  )
}

function FieldRow({
  field,
  value,
  aiFlag,
  prefilledFromLabel,
  selectedAiSourceIds,
  onAiSourcesChange,
  onValueChange,
  onAiDraft,
}: {
  field: ReportField
  value: string
  aiFlag: boolean
  prefilledFromLabel?: string
  selectedAiSourceIds?: Set<string>
  onAiSourcesChange?: (next: Set<string>) => void
  onValueChange: (v: string) => void
  onAiDraft: () => void
}) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const selectedIds =
    selectedAiSourceIds ??
    new Set(
      MOCK_AI_SOURCES.filter((s) => s.defaultSelected).map((s) => s.id),
    )
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <label className="text-sm font-medium">{field.label}</label>
        {field.stale && (
          <Badge className="gap-1 bg-amber-50 text-amber-700 hover:bg-amber-50 text-[11px]">
            <AlertTriangle className="h-2.5 w-2.5" />
            {field.staleMsg}
          </Badge>
        )}
        {field.restricted && (
          <Badge className="gap-1 bg-red-50 text-red-700 hover:bg-red-50 text-[11px]">
            <Lock className="h-2.5 w-2.5" />
            {field.restrictedMsg}
          </Badge>
        )}
        {aiFlag && (
          <Badge className="gap-1 bg-purple-50 text-purple-700 hover:bg-purple-50 text-[11px]">
            <Sparkles className="h-2.5 w-2.5" />
            AI-assisted
          </Badge>
        )}
      </div>

      {field.type === 'narrative' ? (
        <div>
          <textarea
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder={
              field.aiDraftable
                ? "Click 'AI Draft' to generate, or write manually…"
                : 'Enter details…'
            }
            className={cn(
              'w-full resize-y rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed outline-none transition-colors',
              'focus:border-primary focus:ring-1 focus:ring-primary',
              'min-h-[120px]',
            )}
          />
          {field.aiDraftable && !aiFlag && !aiPanelOpen && (
            <div className="mt-2 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiPanelOpen(true)}
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                AI Draft
              </Button>
            </div>
          )}
          {field.aiDraftable && aiPanelOpen && (
            <AiSourcePanel
              selectedIds={selectedIds}
              onChange={(next) => onAiSourcesChange?.(next)}
              onGenerate={() => {
                onAiDraft()
                setAiPanelOpen(false)
              }}
              onCancel={() => setAiPanelOpen(false)}
            />
          )}
          {aiFlag &&
            (
              AI_DRAFT_CITATIONS as Record<
                string,
                | Array<{ num: number; source: string; detail: string }>
                | undefined
              >
            )[field.id] && (
              <div className="mt-2 rounded-lg border bg-muted/30 px-3 py-2.5">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Sources
                </p>
                <div className="space-y-1">
                  {(
                    AI_DRAFT_CITATIONS as Record<
                      string,
                      | Array<{ num: number; source: string; detail: string }>
                      | undefined
                    >
                  )[field.id]!
                    .filter((c) => {
                      // Filter to only show selected canonical sources.
                      const matched = MOCK_AI_SOURCES.find(
                        (s) => s.citationNum === c.num,
                      )
                      if (!matched) return true
                      return selectedIds.has(matched.id)
                    })
                    .map((c) => {
                      const matched = MOCK_AI_SOURCES.find(
                        (s) => s.citationNum === c.num,
                      )
                      return (
                        <div
                          key={c.num}
                          className="flex items-start gap-2 text-xs text-muted-foreground"
                        >
                          <sup className="mt-0.5 font-semibold text-primary">
                            {c.num}
                          </sup>
                          <span>
                            <span className="font-medium text-foreground">
                              {c.source}
                            </span>{' '}
                            —{' '}
                            <a
                              href={matched?.href ?? '#'}
                              onClick={(e) => e.preventDefault()}
                              className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
                            >
                              {c.detail}
                            </a>
                          </span>
                        </div>
                      )
                    })}
                </div>
                <button
                  type="button"
                  onClick={() => setAiPanelOpen(true)}
                  className="mt-2 text-xs text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  Edit sources
                </button>
              </div>
            )}
        </div>
      ) : field.type === 'radio' ? (
        <div className="flex flex-wrap gap-3">
          {(field.options ?? []).map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name={field.id}
                value={opt}
                checked={value === opt}
                onChange={() => onValueChange(opt)}
                className="h-4 w-4 cursor-pointer accent-primary"
              />
              {opt}
            </label>
          ))}
          {field.helper && (
            <p className="basis-full text-xs text-muted-foreground">
              {field.helper}
            </p>
          )}
        </div>
      ) : field.type === 'yesnona' ? (
        <div className="flex flex-wrap gap-3">
          {['Yes', 'No', 'NA'].map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name={field.id}
                value={opt}
                checked={value === opt}
                onChange={() => onValueChange(opt)}
                className="h-4 w-4 cursor-pointer accent-primary"
              />
              {opt}
            </label>
          ))}
        </div>
      ) : field.type === 'signature' ? (
        <div className="rounded-lg border border-dashed bg-muted/30 px-3.5 py-2.5 text-sm text-muted-foreground">
          Digital signature will be applied on export.
        </div>
      ) : (
        <>
          <input
            type="text"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="Enter details..."
            className={cn(
              'w-full rounded-lg border px-3.5 py-2 text-sm outline-none transition-colors',
              'focus:border-primary focus:ring-1 focus:ring-primary',
              field.stale ? 'border-amber-300 bg-amber-50' : '',
            )}
          />
          {field.helper && (
            <p className="text-xs text-muted-foreground">{field.helper}</p>
          )}
        </>
      )}
      {prefilledFromLabel && (
        <p className="text-xs text-muted-foreground">
          Pre-filled from {prefilledFromLabel}
        </p>
      )}
    </div>
  )
}

function AssignmentChip({
  assignedTo,
  onChange,
}: {
  assignedTo: SectionAssignment
  onChange: (s: Staff) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border bg-card px-2 py-0.5 text-xs hover:bg-muted"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            {assignedTo.initials}
          </span>
          <span className="font-medium">{assignedTo.name}</span>
          <span className="text-muted-foreground">· {assignedTo.role}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <div className="border-b px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Reassign section
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {MOCK_STAFF.map((s) => {
            const active =
              s.name === assignedTo.name && s.role === assignedTo.role
            return (
              <button
                key={s.name}
                onClick={() => onChange(s)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted',
                  active && 'font-semibold',
                )}
              >
                {active ? (
                  <Check className="h-3 w-3 text-primary" />
                ) : (
                  <span className="h-3 w-3" />
                )}
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                  {s.initials}
                </span>
                <span className="min-w-0 flex-1 truncate">{s.name}</span>
                <span className="text-muted-foreground">{s.role}</span>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function isSameStaff(a: Staff, b: Staff): boolean {
  return a.name === b.name && a.role === b.role
}

function SectionPanel({
  section,
  fieldValues,
  aiFlags,
  prefilledFrom,
  aiSourceSelections,
  onAiSourceChange,
  assignedTo,
  onAssignedChange,
  onValueChange,
  onAiDraft,
  onToggleReviewed,
  isReviewed,
}: {
  section: ReportSection
  fieldValues: Record<string, string>
  aiFlags: Record<string, boolean>
  prefilledFrom: Record<string, string>
  aiSourceSelections: Record<string, Set<string>>
  onAiSourceChange: (fieldId: string, next: Set<string>) => void
  assignedTo: SectionAssignment
  onAssignedChange: (s: Staff) => void
  onValueChange: (fieldId: string, v: string) => void
  onAiDraft: (fieldId: string) => void
  onToggleReviewed: (sectionId: string) => void
  isReviewed: boolean
}) {
  const isMine = isSameStaff(assignedTo, CURRENT_USER)
  const completed = assignedTo.completed === true
  const completedDate = assignedTo.completedDate

  // For the read-only rendering of a completed counsellor-role section, fall
  // back to the MOCK_COUNSELLOR.fields content so the demo shows real text.
  const completedContent = (fieldId: string): string => {
    if (section.role === 'counsellor') {
      const v = (MOCK_COUNSELLOR.fields as Record<string, string>)[fieldId]
      if (v) return v
    }
    const f = section.fields.find((x) => x.id === fieldId)
    return fieldValues[fieldId] ?? f?.value ?? '—'
  }

  const reviewToggle = (
    <Button
      variant={isReviewed ? 'secondary' : 'outline'}
      size="sm"
      onClick={() => onToggleReviewed(section.id)}
      className={cn(isReviewed && 'text-green-700')}
    >
      {isReviewed ? (
        <>
          <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
          Verified
        </>
      ) : (
        <>Mark as verified</>
      )}
    </Button>
  )

  // Counsellor's Input is restricted from the YH's view — the section is
  // visible in the form (so the YH knows it exists) but the contents are
  // never shown to anyone other than the assignee themselves.
  const isRestrictedCounsellor = section.role === 'counsellor' && !isMine

  return (
    <section
      id={`sec-${section.id}`}
      className="scroll-mt-24 rounded-xl border bg-white p-6"
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {section.title}
        </h2>
        <AssignmentChip assignedTo={assignedTo} onChange={onAssignedChange} />
      </div>

      {isRestrictedCounsellor ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          <Lock className="h-4 w-4 shrink-0" />
          <p>
            <span className="font-medium text-foreground">Restricted.</span>{' '}
            This section is completed by the School Counsellor and is not
            visible to you.
          </p>
        </div>
      ) : isMine ? (
        <div className="space-y-5">
          {section.fields.map((field) => (
            <FieldRow
              key={field.id}
              field={field}
              value={
                (fieldValues as Record<string, string | undefined>)[field.id] ??
                field.value ??
                ''
              }
              aiFlag={!!aiFlags[field.id]}
              prefilledFromLabel={prefilledFrom[field.id]}
              selectedAiSourceIds={aiSourceSelections[field.id]}
              onAiSourcesChange={(next) => onAiSourceChange(field.id, next)}
              onValueChange={(v) => onValueChange(field.id, v)}
              onAiDraft={() => onAiDraft(field.id)}
            />
          ))}
          <div className="flex justify-end border-t pt-4">{reviewToggle}</div>
        </div>
      ) : completed ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 text-xs text-green-700">
            <Check className="h-3.5 w-3.5 text-green-600" />
            <span>
              Completed by {assignedTo.name}
              {completedDate ? ` · ${completedDate}` : ''}
            </span>
          </div>
          <div className="space-y-4">
            {section.fields.map((f) => (
              <div key={f.id}>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  {f.label}
                </p>
                <p className="text-sm leading-relaxed">
                  {completedContent(f.id)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed bg-amber-50/40 px-4 py-2.5 text-xs">
            <span className="flex items-center gap-2 text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              Awaiting input from {assignedTo.name}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.success(`Reminder sent to ${assignedTo.name}`)
              }
            >
              Send reminder
            </Button>
          </div>
          <div className="pointer-events-none space-y-5 select-none opacity-70">
            {section.fields.map((f) => (
              <div key={f.id} className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  {f.label}
                </label>
                {f.value ? (
                  <p className="rounded-lg border bg-muted px-3.5 py-2 text-sm text-muted-foreground">
                    {f.value}
                  </p>
                ) : f.type === 'narrative' ? (
                  <div className="min-h-[120px] rounded-lg border bg-muted" />
                ) : (
                  <div className="h-10 rounded-lg border bg-muted" />
                )}
              </div>
            ))}
            {section.role === 'principal' && (
              <p className="text-xs italic text-muted-foreground">
                Principal's signature will be applied to the exported PDF.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function templateReferenceAsset(template: AgencyTemplate): {
  kind: 'pdf' | 'image'
  src: string
} | null {
  if (template.templateFile?.toLowerCase().endsWith('.pdf')) {
    return { kind: 'pdf', src: template.templateFile }
  }
  const img = templatePreviewImg(template)
  return img ? { kind: 'image', src: img } : null
}


function TemplateReferenceBody({
  template,
  scale,
}: {
  template: AgencyTemplate
  scale: number
}) {
  const asset = templateReferenceAsset(template)
  if (!asset) {
    return (
      <div className="mx-auto w-[680px] max-w-full rounded-md bg-card px-10 py-20 text-center text-sm text-muted-foreground shadow-lg">
        No template preview available for {template.name}.
      </div>
    )
  }

  if (asset.kind === 'pdf') {
    return (
      <iframe
        src={`${asset.src}#toolbar=0&navpanes=0&view=FitH`}
        title={`${template.name} blank template`}
        className="mx-auto block h-[1000px] w-[720px] max-w-full rounded-md border-0 bg-card shadow-lg"
      />
    )
  }

  return (
    <img
      src={asset.src}
      alt={`${template.name} blank template`}
      className="mx-auto block w-[720px] max-w-full rounded-md bg-card shadow-lg"
    />
  )
}

function DocumentPreview({
  template,
  scale,
  onScaleChange,
}: {
  template: AgencyTemplate
  scale: number
  onScaleChange: (s: number) => void
}) {
  return (
    <div className="w-[37%] min-w-0 shrink-0 overflow-auto bg-slate-2 p-5">
      <div className="mb-3 flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Preview</p>
          <p className="text-xs text-muted-foreground">
            This is the agency's report template for reference.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {PREVIEW_SCALES.map((s) => (
            <button
              key={s}
              onClick={() => onScaleChange(s)}
              className={cn(
                'h-6 w-9 rounded-md font-mono text-[10px] font-semibold transition-colors',
                scale === s
                  ? 'bg-foreground text-background'
                  : 'bg-card text-muted-foreground hover:bg-muted',
              )}
            >
              {Math.round(s * 100)}%
            </button>
          ))}
        </div>
      </div>
      <div
        className="origin-top"
        style={{
          transform: `scale(${scale})`,
          width: `${100 / scale}%`,
        }}
      >
        <TemplateReferenceBody template={template} scale={scale} />
      </div>
    </div>
  )
}

function ReportForm({
  template,
  studentName,
  studentClass,
  studentId,
  principalNote,
  currentReportId,
  onBack,
  onSubmittedForReview,
}: {
  template: AgencyTemplate
  studentName: string
  studentClass: string
  studentId: string
  principalNote?: string
  currentReportId?: string
  onBack: () => void
  onSubmittedForReview: () => void
}) {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [aiFlags, setAiFlags] = useState<Record<string, boolean>>({})
  const [prefilledFrom, setPrefilledFrom] = useState<Record<string, string>>({})
  const [completedSections, setCompletedSections] = useState<Set<string>>(
    new Set(),
  )
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewScale, setPreviewScale] = useState<number>(0.68)
  const [savedStatus, setSavedStatus] = useState<'saved' | 'saving'>('saved')
  const [submitOpen, setSubmitOpen] = useState(false)
  const [noteToPrincipal, setNoteToPrincipal] = useState('')
  const [prefillBannerDismissed, setPrefillBannerDismissed] = useState(false)
  const [aiSourceSelections, setAiSourceSelections] = useState<
    Record<string, Set<string>>
  >({})

  // Available source reports — Approved and on the same student.
  const prefillSources = mockAgencyReports.filter(
    (r) =>
      r.studentId === studentId &&
      r.status === 'approved' &&
      r.id !== currentReportId &&
      r.prefillData,
  )

  const prefillFromReport = (source: AgencyReport) => {
    if (!source.prefillData) return
    let count = 0
    const newValues: Record<string, string> = {}
    const newPrefilledFrom: Record<string, string> = {}
    for (const section of template.sections) {
      for (const f of section.fields) {
        if (!f.prefillKey) continue
        const sourceVal = source.prefillData[f.prefillKey]
        if (!sourceVal) continue
        // Don't overwrite if the field already has a non-default user value.
        const existing = fieldValues[f.id]
        if (existing && existing.trim().length > 0) continue
        newValues[f.id] = sourceVal
        newPrefilledFrom[f.id] = source.templateName
        count++
      }
    }
    setFieldValues((prev) => ({ ...prev, ...newValues }))
    setPrefilledFrom((prev) => ({ ...prev, ...newPrefilledFrom }))
    setPrefillBannerDismissed(true)
    toast.success(`${count} fields pre-filled from ${source.templateName}.`)
  }

  // Per-section assignments. Defaults: yh → current user; counsellor → SC
  // (with Mock data marked completed); principal → P (awaiting).
  const [assignments, setAssignments] = useState<
    Record<string, SectionAssignment>
  >(() => {
    const defaults: Record<string, SectionAssignment> = {}
    for (const s of template.sections) {
      if (s.assignedTo) {
        defaults[s.id] = s.assignedTo
        continue
      }
      if (s.role === 'counsellor') {
        const sc = MOCK_STAFF.find((p) => p.role === 'SC')!
        defaults[s.id] = {
          ...sc,
          completed: true,
          completedDate: '15 Apr 2026',
        }
      } else if (s.role === 'principal') {
        const p = MOCK_STAFF.find((p) => p.role === 'P')!
        defaults[s.id] = { ...p, completed: false }
      } else {
        defaults[s.id] = { ...CURRENT_USER, completed: false }
      }
    }
    return defaults
  })

  const reassignSection = (sectionId: string, staff: Staff) => {
    setAssignments((prev) => ({
      ...prev,
      [sectionId]: {
        ...staff,
        // If reassigning back to current user, drop completed marker so they
        // can edit; if reassigning to other, default to "awaiting".
        completed: false,
        completedDate: undefined,
      },
    }))
  }

  const updateField = (id: string, v: string) => {
    setFieldValues((p) => ({ ...p, [id]: v }))
    setSavedStatus('saving')
    setTimeout(() => setSavedStatus('saved'), 800)
  }
  const aiDraft = (id: string) => {
    updateField(
      id,
      AI_DRAFTS[id] ??
        'Based on available case notes and TCI data, the student has shown consistent patterns…',
    )
    setAiFlags((p) => ({ ...p, [id]: true }))
  }
  const toggleReviewed = (sectionId: string) => {
    setCompletedSections((p) => {
      const next = new Set(p)
      if (next.has(sectionId)) {
        next.delete(sectionId)
        return next
      }
      next.add(sectionId)
      return next
    })
  }
  const saveDraft = () => {
    setSavedStatus('saving')
    setTimeout(() => setSavedStatus('saved'), 500)
  }

  // Merged values: field defaults + counsellor mock + user edits (for completion %)
  const mergedValues: Record<string, string> = {}
  for (const section of template.sections) {
    for (const f of section.fields) {
      if (f.value) mergedValues[f.id] = f.value
    }
  }
  for (const [k, val] of Object.entries(
    (MOCK_COUNSELLOR.fields as Record<string, string>) ?? {},
  )) {
    mergedValues[k] = val
  }
  for (const [k, val] of Object.entries(fieldValues)) {
    if (val !== undefined && val !== '') mergedValues[k] = val
    else if (val === '') delete mergedValues[k]
  }

  // Completion %: fraction of non-principal fields with a non-empty value
  const allFields = template.sections
    .filter((s) => s.role !== 'principal')
    .flatMap((s) => s.fields)
  const filledCount = allFields.filter((f) => !!mergedValues[f.id]).length
  const completionPct = allFields.length
    ? Math.round((filledCount / allFields.length) * 100)
    : 0

  // Verified counter only counts sections assigned to the current user.
  const reviewableSections = template.sections.filter((s) => {
    const a = assignments[s.id]
    return a && isSameStaff(a, CURRENT_USER)
  })
  const reviewedCount = reviewableSections.filter((s) =>
    completedSections.has(s.id),
  ).length

  return (
    <div
      className={cn(
        'mx-auto flex h-[calc(100vh-120px)] flex-col overflow-hidden rounded-xl border bg-white transition-[max-width]',
        previewOpen ? 'max-w-none' : 'max-w-5xl',
      )}
    >
      {/* Form header — mirrors Posts new-post top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b bg-card px-4 py-3">
        <AgencyIcon abbrev={template.abbrev} color={template.color} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">
              {template.name}
            </span>
            {(() => {
              const days = template.turnaroundDays
              const cls =
                days < 0
                  ? 'text-red-600'
                  : days <= 2
                    ? 'text-amber-600'
                    : 'text-muted-foreground'
              return (
                <span
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    cls,
                  )}
                >
                  <Clock className="h-3 w-3" />
                  {days < 0
                    ? `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`
                    : `${days} day${days !== 1 ? 's' : ''}`}
                </span>
              )
            })()}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {studentName} · {studentClass}
          </p>
        </div>

        {/* Completion % indicator */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'font-mono text-xs font-semibold tabular-nums',
              completionPct === 100 ? 'text-green-600' : 'text-foreground',
            )}
          >
            {completionPct}%
          </span>
          <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full transition-all',
                completionPct === 100 ? 'bg-green-500' : 'bg-amber-500',
              )}
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {savedStatus === 'saving' ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Check className="h-3 w-3 text-green-600" />
              Saved
            </>
          )}
        </span>
        <div className="h-5 w-px bg-border" />
        <Button
          variant="ghost"
          size="sm"
          onClick={saveDraft}
          className="text-muted-foreground"
        >
          Save as draft
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreviewOpen((p) => !p)}
        >
          <PanelRight className="mr-1.5 h-3.5 w-3.5" />
          {previewOpen ? 'Hide' : 'Show'} Preview
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 bg-muted/10">
        {/* Form cards — scrollable column */}
        <div className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
          {/* Progress chip */}
          <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <ListChecks className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">
              {reviewedCount} of {reviewableSections.length} sections verified
            </span>
          </div>

          {principalNote && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                Principal has requested edits
              </p>
              <p className="text-sm leading-relaxed text-amber-900">
                {principalNote}
              </p>
            </div>
          )}

          {!prefillBannerDismissed && prefillSources.length > 0 && (
            <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    {studentName} has {prefillSources.length} completed report
                    {prefillSources.length !== 1 ? 's' : ''}.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pre-fill matching fields to save time. You can still edit
                    every field afterwards.
                  </p>
                </div>
                <button
                  onClick={() => setPrefillBannerDismissed(true)}
                  className="-mr-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1.5">
                {prefillSources.map((src) => {
                  const date = src.createdAt.toLocaleDateString('en-SG', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                  return (
                    <div
                      key={src.id}
                      className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {src.templateName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {src.agency} · {date}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => prefillFromReport(src)}
                      >
                        Pre-fill from this report
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="space-y-4 pb-16">
            {template.sections.map((s) => (
              <SectionPanel
                key={s.id}
                section={s}
                fieldValues={fieldValues}
                aiFlags={aiFlags}
                prefilledFrom={prefilledFrom}
                aiSourceSelections={aiSourceSelections}
                onAiSourceChange={(fieldId, next) =>
                  setAiSourceSelections((prev) => ({
                    ...prev,
                    [fieldId]: next,
                  }))
                }
                assignedTo={assignments[s.id]}
                onAssignedChange={(staff) => reassignSection(s.id, staff)}
                onValueChange={updateField}
                onAiDraft={aiDraft}
                onToggleReviewed={toggleReviewed}
                isReviewed={completedSections.has(s.id)}
              />
            ))}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSubmitOpen(true)}>
                Submit for P Review
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Submit for Principal Review</DialogTitle>
              <DialogDescription>
                Once submitted, the Principal will be notified to review this
                report. You'll be returned to the student profile.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label
                htmlFor="note-to-principal"
                className="block text-sm font-medium"
              >
                Note to Principal{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <textarea
                id="note-to-principal"
                value={noteToPrincipal}
                onChange={(e) => setNoteToPrincipal(e.target.value)}
                placeholder="e.g. Counselling details needed in Section 5. Housing info may be outdated."
                className="min-h-[100px] w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSubmitOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setSubmitOpen(false)
                  onSubmittedForReview()
                }}
              >
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Section nav — sticky pill list */}
        <aside className="hidden w-48 shrink-0 overflow-y-auto border-x bg-white py-5 lg:block">
          <div className="sticky top-0 px-3">
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sections
            </p>
            <nav className="flex flex-col gap-1">
              {template.sections.map((s) => {
                const done = completedSections.has(s.id)
                const restricted =
                  s.role === 'counsellor' &&
                  !isSameStaff(
                    assignments[s.id] ?? CURRENT_USER,
                    CURRENT_USER,
                  )
                if (restricted) {
                  return (
                    <span
                      key={s.id}
                      aria-disabled
                      className="flex cursor-not-allowed items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground/70"
                    >
                      <Lock className="h-3 w-3 shrink-0" />
                      <span className="truncate">{s.title}</span>
                    </span>
                  )
                }
                return (
                  <a
                    key={s.id}
                    href={`#sec-${s.id}`}
                    className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm hover:bg-muted/80"
                  >
                    {done && (
                      <Check className="h-3 w-3 shrink-0 text-green-600" />
                    )}
                    <span className="truncate">{s.title}</span>
                  </a>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Right: static template reference */}
        {previewOpen && (
          <DocumentPreview
            template={template}
            scale={previewScale}
            onScaleChange={setPreviewScale}
          />
        )}
      </div>
    </div>
  )
}


// ── S10 Export & Password ─────────────────────────────────────

function ExportPassword({
  template,
  studentName,
  onBack,
  onDownload,
}: {
  template: AgencyTemplate
  studentName: string
  onBack: () => void
  onDownload: () => void
}) {
  const [showPw, setShowPw] = useState(false)
  const [pw, setPw] = useState('')
  const [encrypt, setEncrypt] = useState(false)
  const asset = templateReferenceAsset(template)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Export Report</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {template.name} · {studentName}
          </p>
        </div>
        <Badge className="gap-1 bg-green-50 text-green-700 hover:bg-green-50">
          <Check className="h-3 w-3" /> Approved
        </Badge>
      </div>

      {/* Full report preview */}
      <div className="overflow-hidden rounded-xl border bg-slate-2">
        <div className="border-b bg-slate-50 px-5 py-3">
          <p className="text-sm font-semibold">Preview</p>
          <p className="text-xs text-muted-foreground">
            {template.name} for {studentName}
          </p>
        </div>
        <div className="max-h-[640px] overflow-auto p-6">
          {asset?.kind === 'pdf' ? (
            <iframe
              src={`${asset.src}#toolbar=0&navpanes=0&view=FitH`}
              title={`${template.name} preview`}
              className="mx-auto block h-[900px] w-full max-w-[820px] rounded-md border-0 bg-card shadow-lg"
            />
          ) : asset?.kind === 'image' ? (
            <img
              src={asset.src}
              alt={`${template.name} preview`}
              className="mx-auto block w-full max-w-[820px] rounded-md bg-card shadow-lg"
            />
          ) : (
            <div className="rounded-lg bg-card p-10 text-center text-sm text-muted-foreground">
              No preview available.
            </div>
          )}
        </div>
      </div>

      {/* Encryption toggle + (conditional) password */}
      <div className="space-y-4 rounded-xl border bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Encrypt this file?</span>
              <Badge className="gap-1 bg-purple-50 text-purple-700 hover:bg-purple-50 text-[11px]">
                <Lock className="h-2.5 w-2.5" />
                YH, DM &amp; SLs only
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Add a password so only authorised recipients can open the PDF.
            </p>
          </div>
          <Switch
            checked={encrypt}
            onCheckedChange={(v) => {
              setEncrypt(v)
              if (!v) setPw('')
            }}
          />
        </div>

        {encrypt && (
          <div className="space-y-1.5">
            <label
              htmlFor="report-password"
              className="block text-sm font-medium"
            >
              Set a password for this PDF.
            </label>
            <div className="flex items-center gap-2">
              <input
                id="report-password"
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Enter password"
                className="flex-1 rounded-lg border px-3 py-2 font-mono text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPw((p) => !p)}
              >
                {showPw ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {showPw ? 'Hide' : 'Show'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              TW will save this password for future reference.
            </p>
          </div>
        )}
      </div>

      <Button className="w-full" onClick={onDownload}>
        <Download className="mr-1.5 h-4 w-4" />
        Download PDF
      </Button>
    </div>
  )
}

// ── S11 Confirmation ──────────────────────────────────────────

function Confirmation({
  template,
  studentName,
  studentId,
  onStartNext,
}: {
  template: AgencyTemplate
  studentName: string
  studentId: string
  onStartNext: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold">
          Report Exported &amp; Archived
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {template.name} for {studentName}
        </p>
      </div>
      <div className="mt-4 flex w-full max-w-xs flex-col gap-3">
        <Button
          variant="outline"
          className="w-full justify-center"
          render={<Link to="/students/$id" params={{ id: studentId }} />}
        >
          Back to student profile
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-center text-muted-foreground"
          onClick={onStartNext}
        >
          Start another report
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

function AgencyReportWizardPage() {
  const { student } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const agencyReportsEnabled = useFeatureFlag('agency-reports')

  // Reset scroll on mount — TanStack Router can land mid-page when
  // the previous route was scrolled. The app's main scroll container
  // is the [data-scroll-container] in __root.tsx.
  useEffect(() => {
    document.querySelector('[data-scroll-container]')?.scrollTo({ top: 0 })
  }, [])

  // Resolve entry from search params:
  //  ?reportId=X        → look up the report; route by status
  //                       (approved → export, edits_requested → form,
  //                        draft → form, default → form)
  //  ?resume=templateId → form step with that template selected
  //  (none)             → start at templates
  const resumedReport = search.reportId
    ? mockAgencyReports.find((r) => r.id === search.reportId)
    : undefined
  const resumeTemplateId =
    resumedReport?.templateId ??
    (search.resume && AGENCY_TEMPLATES.some((t) => t.id === search.resume)
      ? search.resume
      : undefined)

  const initialStep: WizardStep = resumedReport
    ? resumedReport.status === 'approved'
      ? 'export'
      : 'form'
    : resumeTemplateId
      ? 'form'
      : 'templates'

  const [step, setStep] = useState<WizardStep>(initialStep)
  const [selectedTemplates, setSelectedTemplates] = useState<Array<string>>(
    resumeTemplateId ? [resumeTemplateId] : [],
  )
  const principalNote = resumedReport?.principalNote

  useSetBreadcrumbs([
    { label: 'Home', href: '/' },
    { label: 'Profile', href: '/students' },
    { label: student.name, href: `/students/${student.id}` },
    {
      label: 'New Agency Report',
      href: `/students/${student.id}/agency-report/new`,
    },
  ])

  if (!agencyReportsEnabled) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-semibold">Agency Reports is disabled</h1>
        <p className="text-sm text-muted-foreground">
          This feature is behind a flag. Enable it in Settings → Manage Flags to
          generate agency reports for this student.
        </p>
        <div className="mt-2 flex gap-2">
          <Button
            variant="outline"
            render={
              <Link to="/students/$id" params={{ id: student.id }}>
                Back to profile
              </Link>
            }
          />
          <Button render={<Link to="/flags">Open Manage Flags</Link>} />
        </div>
      </div>
    )
  }

  const toggleTemplate = (id: string) =>
    setSelectedTemplates((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    )

  const activeTemplate =
    AGENCY_TEMPLATES.find((t) => t.id === selectedTemplates[0]) ??
    AGENCY_TEMPLATES[0]

  const showStepBar = step !== 'done'

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      {showStepBar && (
        <StepBar
          step={step}
          canGoBack
          onBack={() => {
            if (step === 'templates')
              navigate({
                to: '/students/$id',
                params: { id: student.id },
              })
            else if (step === 'form') setStep('templates')
            else if (step === 'export') setStep('form')
          }}
          onStepClick={(i) => {
            // Only allow jumping back (or staying on the current step).
            // 0 → Template, 1 → Fill Report, 2 → Export
            if (i === 0) setStep('templates')
            else if (i === 1) setStep('form')
            else if (i === 2) setStep('export')
          }}
        />
      )}

      <main
        className={cn(
          'mx-auto w-full flex-1 py-6',
          step === 'form'
            ? 'max-w-full px-6'
            : step === 'templates'
              ? 'max-w-5xl px-6'
              : 'max-w-2xl px-5',
        )}
      >
        {step === 'templates' && (
          <TemplateSelection
            studentName={student.name}
            studentClass={student.class}
            studentId={student.id}
            selected={selectedTemplates}
            onToggle={toggleTemplate}
            onSelectAndContinue={(id) => {
              setSelectedTemplates([id])
              setStep('form')
            }}
            onBack={() =>
              navigate({ to: '/students/$id', params: { id: student.id } })
            }
            onContinue={() => setStep('form')}
          />
        )}

        {step === 'form' && (
          <ReportForm
            template={activeTemplate}
            studentName={student.name}
            studentClass={student.class}
            studentId={student.id}
            principalNote={principalNote}
            currentReportId={resumedReport?.id}
            onBack={() => setStep('templates')}
            onSubmittedForReview={() => {
              navigate({
                to: '/students/$id',
                params: { id: student.id },
              })
              toast.success('Report submitted for Principal review.', {
                action: {
                  label: 'Start another report',
                  onClick: () => {
                    setSelectedTemplates([])
                    setStep('templates')
                    navigate({
                      to: '/students/$id/agency-report/new',
                      params: { id: student.id },
                    })
                  },
                },
              })
            }}
          />
        )}

        {step === 'export' && (
          <ExportPassword
            template={activeTemplate}
            studentName={student.name}
            onBack={() => setStep('form')}
            onDownload={() => setStep('done')}
          />
        )}

        {step === 'done' && (
          <Confirmation
            template={activeTemplate}
            studentName={student.name}
            studentId={student.id}
            onStartNext={() => {
              setSelectedTemplates([])
              setStep('templates')
            }}
          />
        )}
      </main>
    </div>
  )
}
