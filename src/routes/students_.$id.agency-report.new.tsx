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
  Info,
  ListChecks,
  Lock,
  Maximize2,
  PanelRight,
  RefreshCw,
  Search,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react'

import { toast } from 'sonner'
import type {
  AgencyReport,
  AgencyTemplate,
  AiSourceItem,
  Collaborator,
  ReportField,
  ReportSection,
  SectionAssignment,
  Staff,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { AgencyLogo } from '@/components/agency-logo'
import { cn } from '@/lib/utils'
import { getStudentById } from '@/data/mock-students'
import {
  AGENCY_TEMPLATES,
  AI_DRAFTS,
  AI_DRAFT_CITATIONS,
  CURRENT_USER,
  MOCK_AI_SOURCES,
  MOCK_COLLABORATORS,
  MOCK_COUNSELLOR,
  MOCK_STAFF,
  appendSubmittedReport,
  getSourceExcerpt,
  mockAgencyReports,
} from '@/data/mock-agency-reports'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'

export const Route = createFileRoute('/students_/$id/agency-report/new')({
  component: AgencyReportWizardPage,
  validateSearch: (
    search,
  ): {
    resume?: string
    reportId?: string
  } => ({
    resume: typeof search.resume === 'string' ? search.resume : undefined,
    reportId: typeof search.reportId === 'string' ? search.reportId : undefined,
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
    <div className="flex items-center gap-3 border-b bg-card px-4 py-3">
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
                onClick={clickable ? () => onStepClick(i) : undefined}
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
                        ? 'bg-primary text-primary-foreground'
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

// ── Collaborator avatar stack ─────────────────────────────────

// Friendly long-form label for the role acronyms used in MOCK_STAFF.
const ROLE_LABELS: Record<string, string> = {
  YH: 'Year Head',
  SC: 'School Counsellor',
  P: 'Principal',
  VP: 'Vice Principal',
  FT: 'Form Teacher',
  'CCA Teacher': 'CCA Teacher',
  'Subject Teacher': 'Subject Teacher',
}

function CollaboratorAvatars({
  collaborators,
  max = 4,
}: {
  collaborators: Array<Collaborator>
  max?: number
}) {
  if (collaborators.length === 0) return null
  // Most recently added on the right (closest to the Add button), older on
  // the left. The state array is append-only, so the order matches.
  const overflow = Math.max(0, collaborators.length - max)
  const visible = collaborators.slice(-max)
  return (
    <TooltipProvider delay={200}>
      <div className="flex items-center -space-x-1.5">
        {overflow > 0 && (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-semibold text-muted-foreground" />
              }
            >
              +{overflow}
            </TooltipTrigger>
            <TooltipContent>
              {overflow} more collaborator{overflow !== 1 ? 's' : ''}
            </TooltipContent>
          </Tooltip>
        )}
        {visible.map((c) => {
          const roleLabel = ROLE_LABELS[c.role] ?? c.role
          return (
            <Tooltip key={c.email}>
              <TooltipTrigger
                render={
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-primary/10 text-[10px] font-semibold text-primary" />
                }
              >
                {c.initials}
              </TooltipTrigger>
              <TooltipContent>
                {c.name} · {roleLabel}
                {c.isOwner ? ' (owner)' : ''}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

function AddCollaboratorsModal({
  open,
  onOpenChange,
  alreadyAdded,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  alreadyAdded: Array<string>
  onAdd: (collaborator: Collaborator) => void
}) {
  const [email, setEmail] = useState('')
  const [permission, setPermission] =
    useState<Collaborator['permission']>('edit')
  const [message, setMessage] = useState('')
  // Multi-select state for quick-pick suggestions. The YH ticks the staff
  // they want, optionally types a comment, then clicks Send to dispatch
  // them all at once.
  const [picked, setPicked] = useState<Set<string>>(new Set())
  // Reset selection whenever the modal opens for a fresh session.
  useEffect(() => {
    if (open) setPicked(new Set())
  }, [open])
  const suggestions = MOCK_COLLABORATORS.filter(
    (c) => !c.isOwner && !alreadyAdded.includes(c.email),
  )
  const reset = () => {
    setEmail('')
    setMessage('')
    setPermission('edit')
    setPicked(new Set())
  }
  const togglePick = (emailKey: string) => {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(emailKey)) next.delete(emailKey)
      else next.add(emailKey)
      return next
    })
  }
  const sendInvites = () => {
    // Send everyone the YH selected from the quick-pick list…
    suggestions
      .filter((s) => picked.has(s.email))
      .forEach((s) => onAdd({ ...s, permission }))
    // …plus the manual email entry, if they typed one.
    const trimmed = email.trim()
    if (trimmed) {
      const localPart = trimmed.split('@')[0] ?? trimmed
      const niceName = localPart
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
      const initials = niceName
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0] ?? '')
        .join('')
        .toUpperCase()
      onAdd({
        name: niceName,
        role: 'Subject Teacher',
        initials,
        email: trimmed,
        permission,
      })
    }
    reset()
    onOpenChange(false)
  }
  const canSend = picked.size > 0 || email.trim().length > 0
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add collaborator</DialogTitle>
          <DialogDescription>
            Pick teachers below, add a comment, then click Send. They'll get a
            link in their inbox.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {suggestions.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Suggested
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => {
                  const on = picked.has(s.email)
                  return (
                    <button
                      key={s.email}
                      type="button"
                      onClick={() => togglePick(s.email)}
                      aria-pressed={on}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-colors',
                        on
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-input bg-card hover:border-primary/40 hover:bg-muted/40',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                          on
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/10 text-primary',
                        )}
                      >
                        {on ? <Check className="h-3 w-3" /> : s.initials}
                      </span>
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground">
                        · {ROLE_LABELS[s.role] ?? s.role}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <div className="flex items-stretch gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Or add by name or email"
              className="flex-1"
            />
            <select
              value={permission}
              onChange={(e) =>
                setPermission(e.target.value as Collaborator['permission'])
              }
              className="rounded-md border bg-background px-2 text-sm outline-none focus:border-primary"
              aria-label="Permission"
            >
              <option value="edit">Can edit</option>
              <option value="comment">Can comment</option>
              <option value="view">Can view</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="collab-message"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Message <span className="font-normal">(optional)</span>
            </label>
            <textarea
              id="collab-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What do you want them to do?"
              className="min-h-[90px] w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSend} onClick={sendInvites}>
            Send
            {picked.size + (email.trim() ? 1 : 0) > 1
              ? ` (${picked.size + (email.trim() ? 1 : 0)})`
              : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

// Single source of truth for "which templates have an embeddable PDF
// reference?" — only those whose source file is itself a PDF qualify
// today (assq, children-home). Everything else falls back to the PNG
// preview rendered by templatePreviewImg, and only templates with
// neither show the bare "Preview not available" fallback.
function templateReferencePdf(template: AgencyTemplate): string | null {
  if (!template.templateFile) return null
  return /\.pdf$/i.test(template.templateFile) ? template.templateFile : null
}

function TemplatePreviewModal({
  template,
  open,
  onOpenChange,
  onUseTemplate,
}: {
  template: AgencyTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUseTemplate: (id: string) => void
}) {
  if (!template) return null
  const pdf = templateReferencePdf(template)
  const png = templatePreviewImg(template)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 p-0 sm:max-w-[860px]">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-base">{template.name}</DialogTitle>
          <DialogDescription>{template.agency}</DialogDescription>
        </DialogHeader>
        <div className="min-h-[480px] flex-1 overflow-auto bg-muted/30 p-4">
          {pdf ? (
            <iframe
              src={pdf}
              title={`${template.name} preview`}
              className="h-[68vh] w-full rounded-md bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.08)]"
            />
          ) : png ? (
            <div className="flex justify-center">
              <img
                src={png}
                alt={`${template.name} preview`}
                className="max-w-full rounded-md bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.08)]"
              />
            </div>
          ) : (
            <div className="flex h-[480px] items-center justify-center text-sm text-muted-foreground">
              Preview not available for this template.
            </div>
          )}
        </div>
        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => onUseTemplate(template.id)}>
            Use this template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TemplateSelection({
  studentName,
  studentClass,
  studentId,
  selected,
  onToggle,
  onSelectAndContinue,
  onBack: _onBack,
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
  const [previewTemplate, setPreviewTemplate] = useState<AgencyTemplate | null>(
    null,
  )
  // Single-select visual selection (independent of immediate-advance click).
  // Clicking a row in single-select still advances, but this state lets the
  // circular button briefly show the filled-blue selected state.
  const [singleSelected, setSingleSelected] = useState<string | null>(null)

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
      tpl.name.toLowerCase().includes(q) || tpl.agency.toLowerCase().includes(q)
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
                  const lastEdited = (
                    r.startedAt ?? r.createdAt
                  ).toLocaleDateString('en-SG', {
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
                  const filledCount = allFields.filter((f) => !!f.value).length
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
                              className="h-full bg-primary transition-[width] duration-300"
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
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className="gap-2 aria-expanded:bg-accent"
                  />
                }
              >
                <Filter className="h-4 w-4" />
                Filter
                {agencyFilter !== 'all' && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    1
                  </span>
                )}
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
                  const inMultiSelected = selected.includes(tpl.id)
                  const isSingleSelected =
                    !multiSelect && singleSelected === tpl.id
                  const isSelected = multiSelect
                    ? inMultiSelected
                    : isSingleSelected
                  const locked = tpl.locked === true
                  const rowClasses = cn(
                    'group/row relative flex w-full items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer',
                    i > 0 && 'border-t',
                    locked
                      ? 'pointer-events-none opacity-50'
                      : 'hover:bg-muted/40',
                    isSelected && !locked && 'bg-primary/5',
                  )
                  return (
                    <div
                      key={tpl.id}
                      role="button"
                      tabIndex={locked ? -1 : 0}
                      aria-disabled={locked}
                      aria-pressed={isSelected}
                      onClick={() => {
                        if (locked) return
                        if (multiSelect) {
                          onToggle(tpl.id)
                        } else {
                          setSingleSelected(tpl.id)
                          onSelectAndContinue(tpl.id)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (locked) return
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          if (multiSelect) {
                            onToggle(tpl.id)
                          } else {
                            setSingleSelected(tpl.id)
                            onSelectAndContinue(tpl.id)
                          }
                        }
                      }}
                      className={rowClasses}
                    >
                      <AgencyLogo agency={tpl.agency} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {tpl.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {tpl.agency}
                        </p>
                      </div>

                      {!locked && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewTemplate(tpl)
                          }}
                          aria-label="Preview form"
                          title="Preview form"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}

                      {locked ? (
                        <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <span
                          aria-hidden
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors',
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground/30 bg-background text-muted-foreground group-hover/row:border-primary/40 group-hover/row:text-foreground',
                          )}
                        >
                          {multiSelect && isSelected ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </span>
                      )}
                    </div>
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

      <TemplatePreviewModal
        template={previewTemplate}
        open={previewTemplate !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewTemplate(null)
        }}
        onUseTemplate={(id) => {
          setPreviewTemplate(null)
          if (multiSelect) {
            // In multi-select, "Use this template" toggles it on then
            // advances — matches the productive-path intent.
            if (!selected.includes(id)) onToggle(id)
            onContinue()
          } else {
            setSingleSelected(id)
            onSelectAndContinue(id)
          }
        }}
      />

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
                      className="text-twblue-11 underline underline-offset-2 hover:text-twblue-12"
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
          Generate draft
        </Button>
      </div>
    </div>
  )
}

// Source-attribution affordance + side panel. Reuses the same Sheet
// primitive that the student profile's FieldWithDetails uses (showOverlay
// false, sm:max-w-xs, X-button + ESC + click-outside dismissal).
function FieldSourceLink({
  fieldId,
  source,
}: {
  fieldId: string
  source: string
}) {
  const [open, setOpen] = useState(false)
  const excerpt = getSourceExcerpt(fieldId, source)
  if (!excerpt) return null
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Source: ${source}`}
        aria-label={`Source: ${source}`}
        className="relative ml-1 inline-flex h-3.5 w-3.5 align-text-bottom items-center justify-center rounded-sm text-muted-foreground/60 transition-colors hover:text-foreground before:absolute before:-inset-3 before:content-['']"
      >
        <Info className="h-3 w-3" />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          showOverlay={false}
          showCloseButton={false}
          className="sm:max-w-xs"
        >
          <SheetHeader className="border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border">
                <Info className="h-3.5 w-3.5" />
              </div>
              <SheetTitle className="flex-1">{excerpt.system}</SheetTitle>
              <SheetClose
                render={
                  <button className="text-muted-foreground transition-colors hover:text-foreground" />
                }
              >
                <X className="h-5 w-5" />
              </SheetClose>
            </div>
          </SheetHeader>
          <div className="space-y-4 p-6">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Source excerpt
              </p>
              <p className="rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed">
                {excerpt.excerpt}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Last updated {excerpt.lastUpdated}
            </p>
            <a
              href={excerpt.href}
              onClick={(e) => e.preventDefault()}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
            >
              Open in {excerpt.system}
              <ChevronRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function FieldRow({
  field,
  value,
  aiFlag,
  isDrafted,
  prefilledFromLabel,
  selectedAiSourceIds,
  onAiSourcesChange,
  onValueChange,
  onAiDraft,
}: {
  field: ReportField
  value: string
  aiFlag: boolean
  // True when the field is showing AI-drafted content the user hasn't
  // verified yet — apply a subtle purple tint to distinguish from
  // user-entered values.
  isDrafted: boolean
  prefilledFromLabel?: string
  selectedAiSourceIds?: Set<string>
  onAiSourcesChange?: (next: Set<string>) => void
  onValueChange: (v: string) => void
  onAiDraft: () => void
}) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const selectedIds =
    selectedAiSourceIds ??
    new Set(MOCK_AI_SOURCES.filter((s) => s.defaultSelected).map((s) => s.id))
  // Empty-state highlight for not-yet-filled fields (Change 4). Signature
  // fields are stamped on export and never need user input — exempt them.
  const isEmpty = field.type !== 'signature' && value.trim() === ''
  const emptyInputBorder = isEmpty
    ? 'border-amber-6 bg-amber-3/60'
    : isDrafted
      ? 'border-violet-6 bg-violet-3/40'
      : 'border-input bg-background'
  // Source-link visibility: show only when the field has an upstream source
  // AND the current value still matches the originally pre-filled value
  // (i.e. the user hasn't edited it). Once edited, the field becomes a
  // plain user-entered field with no attribution.
  const showSourceLink =
    !!field.source && !!field.value && value === field.value
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <label className="text-sm font-medium">{field.label}</label>
        {field.stale && (
          <Badge className="gap-1 bg-amber-3 text-amber-11 hover:bg-amber-3 text-[11px]">
            <AlertTriangle className="h-2.5 w-2.5" />
            {field.staleMsg}
          </Badge>
        )}
        {field.restricted && (
          <Badge className="gap-1 bg-crimson-3 text-crimson-11 hover:bg-crimson-3 text-[11px]">
            <Lock className="h-2.5 w-2.5" />
            {field.restrictedMsg}
          </Badge>
        )}
        {aiFlag && (
          <Badge className="gap-1 bg-violet-3 text-violet-11 hover:bg-violet-3 text-[11px]">
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
              emptyInputBorder,
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
                  )
                    [field.id]!.filter((c) => {
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
                              className="text-twblue-11 underline underline-offset-2 hover:text-twblue-12"
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
        <div
          className={cn(
            'flex flex-wrap gap-3 rounded-lg px-2 py-1.5 transition-colors',
            isEmpty && 'bg-amber-3/60',
          )}
        >
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
        <div
          className={cn(
            'flex flex-wrap gap-3 rounded-lg px-2 py-1.5 transition-colors',
            isEmpty && 'bg-amber-3/60',
          )}
        >
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
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder="Enter details..."
              className={cn(
                'w-full rounded-lg border px-3.5 py-2 text-sm outline-none transition-colors',
                'focus:border-primary focus:ring-1 focus:ring-primary',
                showSourceLink && 'pr-9',
                field.stale
                  ? 'border-amber-7 bg-amber-3'
                  : isEmpty
                    ? 'border-amber-6 bg-amber-3/60'
                    : '',
              )}
            />
            {showSourceLink && field.source && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2">
                <FieldSourceLink fieldId={field.id} source={field.source} />
              </span>
            )}
          </div>
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

function isSameStaff(a: Staff, b: Staff): boolean {
  return a.name === b.name && a.role === b.role
}

function SectionPanel({
  section,
  fieldValues,
  aiFlags,
  autoFilled,
  prefilledFrom,
  aiSourceSelections,
  onAiSourceChange,
  assignedTo,
  onAssignedChange: _onAssignedChange,
  onValueChange,
  onAiDraft,
  onToggleReviewed,
  isReviewed,
}: {
  section: ReportSection
  fieldValues: Record<string, string>
  aiFlags: Record<string, boolean>
  // When false the form is in its pristine pre-Auto-fill state — no
  // source-system values (EduHub particulars, School Cockpit
  // attendance, radio/checkbox defaults) are shown yet.
  autoFilled: boolean
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

  // Resolve a field's currently-displayed value. User edits always win;
  // structural template defaults only surface after Auto-fill. Narrative
  // fields never draw from f.value — their content comes from the
  // per-field AI Draft flow, written into fieldValues.
  const resolveValue = (f: ReportField): string => {
    const userVal = (fieldValues as Record<string, string | undefined>)[f.id]
    if (userVal !== undefined) return userVal
    if (autoFilled && f.type !== 'narrative') return f.value ?? ''
    return ''
  }
  // Purple tint only for narrative fields that the YH has AI-drafted
  // and not yet edited past / marked verified. Structural auto-filled
  // fields keep their neutral appearance — they're system-of-record
  // data, not AI content.
  const isFieldDrafted = (f: ReportField): boolean =>
    f.type === 'narrative' && !!aiFlags[f.id] && !isReviewed

  // Live count of unfilled fields for the section header indicator.
  // Signature fields are stamped on export and not counted as user input.
  const emptyCount = isMine
    ? section.fields.filter((f) => {
        if (f.type === 'signature') return false
        return resolveValue(f).trim() === ''
      }).length
    : 0

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
      className={cn(isReviewed && 'text-lime-11')}
    >
      {isReviewed ? (
        <>
          <Check className="mr-1.5 h-3.5 w-3.5 text-lime-11" />
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
      className="scroll-mt-24 rounded-xl border bg-card p-6"
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {section.title}
        </h2>
        {emptyCount > 0 && (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-amber-3 px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-amber-11">
            <AlertTriangle className="h-3 w-3" />
            {emptyCount} empty field{emptyCount !== 1 ? 's' : ''}
          </span>
        )}
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
              value={resolveValue(field)}
              aiFlag={!!aiFlags[field.id]}
              isDrafted={isFieldDrafted(field)}
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
          <div className="flex items-center gap-2 rounded-lg bg-lime-3 px-4 py-2.5 text-xs text-lime-11">
            <Check className="h-3.5 w-3.5 text-lime-11" />
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
          {section.role === 'principal' ? (
            // Fresh-draft principal section: the principal hasn't been
            // asked yet (the YH hasn't submitted), so "Awaiting input"
            // + Send reminder reads as if she's overdue. Use a neutral
            // "will review after submission" note instead.
            <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              <span>
                {assignedTo.name} will review and sign this section after
                you submit the report.
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed bg-amber-3/40 px-4 py-2.5 text-xs">
              <span className="flex items-center gap-2 text-amber-11">
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
          )}
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

// ── Filled report rendering ───────────────────────────────────────────
// The preview must look like a faithful reproduction of the agency's
// actual blank PDF, with the demo data dropped in — same fonts, gray
// section bars, bordered tick boxes, conduct grid, RESTRICTED-style
// headers. The Children's Home + MSF School Report templates get a
// pixel-faithful renderer below; every other template falls back to a
// simpler list view.

function stripSuperscripts(s: string): string {
  return s.replace(/[°-¹⁰-₟]+/g, '').trim()
}

// Demo prose is authored against the original placeholder student
// (full name + given name pair). Swap both in for the active student so
// the form / preview reads correctly when the YH lands here from a
// different student's profile.
const DEMO_FULL_NAME = 'Chen Jun Kai'
const DEMO_GIVEN_NAME = 'Jun Kai'

function givenNameOf(fullName: string): string {
  // Singapore convention varies: "Chen Jun Kai" (surname first → given is
  // everything after the first token) versus "Mei Lin Huang" (surname
  // last → given is everything before the last token). We can't tell
  // them apart without a registry, so take a pragmatic middle path:
  // strip the last token only when there are 3+ whitespace tokens and
  // every token capitalises like a word. For 2-token names, return the
  // first token. Otherwise return the whole name.
  const tokens = fullName.trim().split(/\s+/).filter(Boolean)
  if (tokens.length >= 3) return tokens.slice(0, -1).join(' ')
  if (tokens.length === 2) return tokens[0]
  return fullName
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function personalizeText(text: string, studentName: string): string {
  if (!text || !studentName) return text
  const fullName = studentName
  const givenName = givenNameOf(studentName)
  // Longest match first so 'Chen Jun Kai' substitutes before 'Jun Kai'.
  return text
    .replace(new RegExp(escapeRegExp(DEMO_FULL_NAME), 'g'), fullName)
    .replace(new RegExp(escapeRegExp(DEMO_GIVEN_NAME), 'g'), givenName)
}

// Override field.value where prefillKey matches a known Student
// attribute, so a template authored against the demo placeholder shows
// the active student's particulars on the Fill Report page + preview.
function personalizeTemplate(
  template: AgencyTemplate,
  student: { name: string; class: string; nric: string; schoolName?: string },
): AgencyTemplate {
  const lookup: Record<string, string | undefined> = {
    studentName: student.name,
    nric: student.nric,
    class: student.class,
    school: student.schoolName,
  }
  return {
    ...template,
    sections: template.sections.map((s) => ({
      ...s,
      fields: s.fields.map((f) => {
        if (!f.prefillKey) return f
        const v = lookup[f.prefillKey]
        if (v === undefined || v === '') return f
        return { ...f, value: v }
      }),
    })),
  }
}

function fieldValue(
  template: AgencyTemplate,
  fieldId: string,
  studentName?: string,
): string | undefined {
  for (const section of template.sections) {
    const f = section.fields.find((x) => x.id === fieldId)
    if (f) {
      if (f.value && f.value.trim().length > 0) return f.value
      const ai = AI_DRAFTS[f.id]
      if (ai) {
        const stripped = stripSuperscripts(ai)
        return studentName ? personalizeText(stripped, studentName) : stripped
      }
      if (section.role === 'counsellor') {
        const v = (MOCK_COUNSELLOR.fields as Record<string, string>)[f.id]
        if (v) return studentName ? personalizeText(v, studentName) : v
      }
      return undefined
    }
  }
  return undefined
}

// ── Building blocks for the faithful PDF replication ──────────────────

function ConfidentialHeader({ pageNum }: { pageNum: number }) {
  return (
    <div className="relative mb-4">
      <div className="text-center text-[12px] font-bold">CONFIDENTIAL</div>
      <div className="absolute right-0 top-0 text-[12px]">{pageNum}</div>
    </div>
  )
}

function SectionBar({ numeral, title }: { numeral: string; title: string }) {
  return (
    <div className="my-3 flex bg-[#D9D9D9] px-2 py-1 text-[12px] font-bold">
      <span className="w-12 shrink-0">{numeral}</span>
      <span>{title}</span>
    </div>
  )
}

function TickBox({ on }: { on?: boolean }) {
  return (
    <span className="inline-flex h-[14px] w-[14px] shrink-0 items-center justify-center border border-black align-middle text-[10px] leading-none">
      {on ? '✓' : ''}
    </span>
  )
}

function FieldBox({ label, value }: { label: string; value?: string }) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <span className="w-[140px] shrink-0 pt-1 text-[12px]">{label}</span>
      <span className="flex min-h-[24px] flex-1 items-center border border-black px-2 py-1 text-[12px]">
        {value ?? ''}
      </span>
    </div>
  )
}

function YesNoNaRow({
  label,
  value,
  showHeader,
  hasNa = true,
}: {
  label: string | React.ReactNode
  value?: string
  showHeader?: boolean
  hasNa?: boolean
}) {
  return (
    <div className="grid grid-cols-[1fr_28px_28px_28px] items-center gap-1 text-[12px]">
      <div>
        {showHeader && (
          <div className="grid grid-cols-[1fr_28px_28px_28px] gap-1 text-[12px] font-bold">
            <span />
            <span className="text-center">Yes</span>
            <span className="text-center">No</span>
            {hasNa ? <span className="text-center">NA*</span> : <span />}
          </div>
        )}
        <span>{label}</span>
      </div>
      <span className="flex justify-center">
        <TickBox on={value === 'Yes'} />
      </span>
      <span className="flex justify-center">
        <TickBox on={value === 'No'} />
      </span>
      {hasNa ? (
        <span className="flex justify-center">
          <TickBox on={value === 'NA'} />
        </span>
      ) : (
        <span />
      )}
    </div>
  )
}

function AttendanceBlock({
  template,
  studentName,
  yearLabel,
  ratingId,
  presentId,
  lateId,
  absentId,
}: {
  template: AgencyTemplate
  studentName: string
  yearLabel: string
  ratingId: string
  presentId: string
  lateId: string
  absentId: string
}) {
  const rating = fieldValue(template, ratingId, studentName)
  return (
    <div className="mb-3 space-y-1.5">
      <p className="text-[12px] font-bold underline">{yearLabel}</p>
      <div className="ml-6 grid grid-cols-3 items-center gap-2 text-[12px]">
        <div className="flex items-center justify-between gap-2">
          <span>Very Regular</span>
          <TickBox on={rating === 'Very Regular'} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Regular</span>
          <TickBox on={rating === 'Regular'} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Irregular</span>
          <TickBox on={rating === 'Irregular'} />
        </div>
      </div>
      <div className="ml-6 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-[12px]">
        <span>No. of days present during the year (e.g. 90/100)</span>
        <span>: {fieldValue(template, presentId, studentName) ?? ''}</span>
        <span>No. of days late for school</span>
        <span>: {fieldValue(template, lateId, studentName) ?? ''}</span>
        <span>No. of days absent without valid reasons</span>
        <span>: {fieldValue(template, absentId, studentName) ?? ''}</span>
      </div>
    </div>
  )
}

function ConductTickGrid({
  rows,
}: {
  rows: Array<{ n: number; label: string; value?: string }>
}) {
  const left = rows.slice(0, 10)
  const right = rows.slice(10)
  return (
    <div className="mb-4">
      <div className="ml-6 grid grid-cols-[1fr_1fr] gap-x-8 text-[12px]">
        <div className="grid grid-cols-[20px_1fr_28px_28px] gap-x-2 gap-y-1">
          <span />
          <span />
          <span className="text-center font-bold">Yes</span>
          <span className="text-center font-bold">No</span>
          {left.map((r) => (
            <ConductRow key={r.n} {...r} />
          ))}
        </div>
        <div className="grid grid-cols-[20px_1fr_28px_28px] gap-x-2 gap-y-1">
          <span />
          <span />
          <span className="text-center font-bold">Yes</span>
          <span className="text-center font-bold">No</span>
          {right.map((r) => (
            <ConductRow key={r.n} {...r} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ConductRow({
  n,
  label,
  value,
}: {
  n: number
  label: string
  value?: string
}) {
  return (
    <>
      <span>{n}</span>
      <span>{label}</span>
      <span className="flex justify-center">
        <TickBox on={value === 'Yes'} />
      </span>
      <span className="flex justify-center">
        <TickBox on={value === 'No'} />
      </span>
    </>
  )
}

function OverallConductRow({
  template,
  studentName,
  yearLabel,
  fieldId,
}: {
  template: AgencyTemplate
  studentName: string
  yearLabel: string
  fieldId: string
}) {
  const v = fieldValue(template, fieldId, studentName)
  return (
    <div className="mb-2">
      <p className="text-[12px] font-bold underline">{yearLabel}</p>
      <div className="ml-6 mt-1 grid grid-cols-4 items-center gap-2 text-[12px]">
        {(['Excellent', 'Good', 'Fair', 'Poor'] as const).map((opt) => (
          <div key={opt} className="flex items-center justify-between gap-2">
            <span>{opt}</span>
            <TickBox on={v === opt} />
          </div>
        ))}
      </div>
    </div>
  )
}

function AcademicPerfRow({
  template,
  studentName,
  yearLabel,
  fieldId,
}: {
  template: AgencyTemplate
  studentName: string
  yearLabel: string
  fieldId: string
}) {
  const v = fieldValue(template, fieldId, studentName)
  return (
    <div className="mb-2">
      <p className="text-[12px] font-bold underline">{yearLabel}</p>
      <div className="ml-6 mt-1 grid grid-cols-3 items-center gap-2 text-[12px]">
        {(['Good', 'Satisfactory', 'Poor'] as const).map((opt) => (
          <div key={opt} className="flex items-center justify-between gap-2">
            <span>{opt}</span>
            <TickBox on={v === opt} />
          </div>
        ))}
      </div>
    </div>
  )
}

// Children's Home School Report — faithful replication of the blank
// reference PDF (8 pages condensed into one continuous flow for the
// modal preview). Layout mirrors the source PDF exactly; only the
// "XXX" placeholders and empty boxes are populated with demo data.
function ChildrenHomeFilledRendering({
  template,
  studentName,
  approved = false,
}: {
  template: AgencyTemplate
  studentName: string
  approved?: boolean
}) {
  const purpose = fieldValue(template, 'ch-purpose-type', studentName)
  const conductRows: Array<{ n: number; label: string; value?: string }> = [
    {
      n: 1,
      label: 'Responsive',
      value: fieldValue(template, 'ch-cond-responsive', studentName),
    },
    {
      n: 2,
      label: 'Responsible',
      value: fieldValue(template, 'ch-cond-responsible', studentName),
    },
    { n: 3, label: 'Polite', value: fieldValue(template, 'ch-cond-polite', studentName) },
    { n: 4, label: 'Honest', value: fieldValue(template, 'ch-cond-honest', studentName) },
    { n: 5, label: 'Helpful', value: fieldValue(template, 'ch-cond-helpful', studentName) },
    {
      n: 6,
      label: 'Attentive',
      value: fieldValue(template, 'ch-cond-attentive', studentName),
    },
    {
      n: 7,
      label: 'Hardworking',
      value: fieldValue(template, 'ch-cond-hardworking', studentName),
    },
    {
      n: 8,
      label: 'Respectful',
      value: fieldValue(template, 'ch-cond-respectful', studentName),
    },
    {
      n: 9,
      label: 'Problems with peers',
      value: fieldValue(template, 'ch-cond-peers', studentName),
    },
    {
      n: 10,
      label: 'Problems with teachers',
      value: fieldValue(template, 'ch-cond-teachers', studentName),
    },
    {
      n: 11,
      label: 'Associates with Gangs',
      value: fieldValue(template, 'ch-cond-gangs', studentName),
    },
    { n: 12, label: 'Truancy', value: fieldValue(template, 'ch-cond-truancy', studentName) },
    {
      n: 13,
      label: 'Engages in Fights',
      value: fieldValue(template, 'ch-cond-fights', studentName),
    },
    {
      n: 14,
      label: 'Pilfers/Steals',
      value: fieldValue(template, 'ch-cond-pilfers', studentName),
    },
    { n: 15, label: 'Smokes', value: fieldValue(template, 'ch-cond-smokes', studentName) },
    {
      n: 16,
      label: 'Abuses other Substances',
      value: fieldValue(template, 'ch-cond-substances', studentName),
    },
    {
      n: 17,
      label: 'Defies Authority',
      value: fieldValue(template, 'ch-cond-defies', studentName),
    },
    {
      n: 18,
      label: 'Resists School counselling',
      value: fieldValue(template, 'ch-cond-resists-counselling', studentName),
    },
    { n: 19, label: 'Bullies', value: fieldValue(template, 'ch-cond-bullies', studentName) },
  ]

  return (
    <div
      className="mx-auto bg-white px-12 py-8 text-black shadow-sm"
      style={{
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        maxWidth: 760,
      }}
    >
      <ConfidentialHeader pageNum={1} />

      {/* TO / TEL / EMAIL block */}
      <div className="mb-1 grid grid-cols-[64px_16px_1fr] gap-y-0.5 text-[12px] font-bold">
        <span>TO</span>
        <span>:</span>
        <span />
        <span>TEL</span>
        <span>:</span>
        <span />
        <span>EMAIL</span>
        <span>:</span>
        <span />
      </div>
      <div className="mb-6 border-b-[1.5px] border-black" />

      {/* Title */}
      <h1 className="mb-1 text-center text-[22px] font-bold tracking-wide">
        SCHOOL REPORT
      </h1>
      <p className="mb-8 text-center text-[12px] font-bold">
        (Period <span className="underline">2024</span> to{' '}
        <span className="underline">2026 Term 2 Week 4</span>)
      </p>

      {/* I. Purpose */}
      <SectionBar numeral="I" title="PURPOSE" />
      <div className="ml-6 mt-2 space-y-2 text-[12px]">
        <div className="flex items-center gap-3">
          <span className="w-[260px] font-bold">Pre-FGO Screening</span>
          <TickBox on={purpose === 'Pre-FGO Screening'} />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-[260px] font-bold">FGO Social Investigation</span>
          <TickBox on={purpose === 'FGO Social Investigation'} />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-[260px] font-bold">
            Others:{' '}
            <span className="font-normal underline">
              {fieldValue(template, 'ch-purpose-other', studentName) ??
                '                      '}
            </span>
          </span>
          <TickBox on={purpose === 'Others'} />
        </div>
      </div>

      {/* II. Personal Particulars */}
      <SectionBar numeral="II" title="STUDENT'S PERSONAL PARTICULARS" />
      <FieldBox
        label="Name:"
        value={fieldValue(template, 'ch-name', studentName) ?? studentName}
      />
      <FieldBox label="NRIC/BC No.:" value={fieldValue(template, 'ch-nric', studentName)} />
      <FieldBox label="Class:" value={fieldValue(template, 'ch-class', studentName)} />
      <FieldBox label="School:" value={fieldValue(template, 'ch-school', studentName)} />
      <FieldBox
        label="School's Address:"
        value={fieldValue(template, 'ch-school-address', studentName)}
      />

      {/* III. Academic Performance & Conduct */}
      <SectionBar
        numeral="III"
        title="STUDENT'S ACADEMIC PERFORMANCE & CONDUCT"
      />
      <p className="mb-3 text-[12px] font-bold">
        A&nbsp;&nbsp;&nbsp;&nbsp;Attendance (please attach attendance for all
        years in school)
      </p>
      <AttendanceBlock
        studentName={studentName}
        template={template}
        yearLabel="Secondary 1"
        ratingId="ch-att-rating-sec1"
        presentId="ch-att-present-sec1"
        lateId="ch-att-late-sec1"
        absentId="ch-att-absent-sec1"
      />
      <AttendanceBlock
        studentName={studentName}
        template={template}
        yearLabel="Secondary 2"
        ratingId="ch-att-rating-sec2"
        presentId="ch-att-present-sec2"
        lateId="ch-att-late-sec2"
        absentId="ch-att-absent-sec2"
      />
      <AttendanceBlock
        studentName={studentName}
        template={template}
        yearLabel="Secondary 3"
        ratingId="ch-att-rating-sec3"
        presentId="ch-att-present-sec3"
        lateId="ch-att-late-sec3"
        absentId="ch-att-absent-sec3"
      />
      <div className="ml-6 mt-1 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-[12px]">
        <span>Date left School (for ex-students)</span>
        <span>: {fieldValue(template, 'ch-att-date-left', studentName) ?? ''}</span>
        <span>Reason for leaving School</span>
        <span>: {fieldValue(template, 'ch-att-reason-leaving', studentName) ?? ''}</span>
        <span>Withdrawn by (if applicable)</span>
        <span>: {fieldValue(template, 'ch-att-withdrawn-by', studentName) ?? ''}</span>
      </div>

      <p className="mt-5 text-[12px] font-bold">
        B&nbsp;&nbsp;&nbsp;&nbsp;Conduct:{' '}
        <span className="font-normal italic">
          (Please tick where appropriate)*
        </span>
      </p>
      <div className="mt-2">
        <ConductTickGrid rows={conductRows} />
      </div>
      <p className="mb-2 text-[12px]">
        Overall Conduct (
        <span className="italic">
          Please attach copies of student's conduct slips for all years in
          school
        </span>
        )
      </p>
      <OverallConductRow
        studentName={studentName}
        template={template}
        yearLabel="Secondary 1"
        fieldId="ch-cond-overall-sec1"
      />
      <OverallConductRow
        studentName={studentName}
        template={template}
        yearLabel="Secondary 2"
        fieldId="ch-cond-overall-sec2"
      />
      <OverallConductRow
        studentName={studentName}
        template={template}
        yearLabel="Secondary 3"
        fieldId="ch-cond-overall-sec3"
      />
      <p className="mt-2 text-[12px]">Comments, if any:</p>
      <p className="mb-4 mt-1 whitespace-pre-line text-[12px] leading-relaxed">
        {fieldValue(template, 'ch-cond-comments', studentName) ?? ''}
      </p>

      <p className="mt-4 text-[12px] font-bold">
        C&nbsp;&nbsp;&nbsp;&nbsp;Academic Performance{' '}
        <span className="font-normal italic">
          (Please attach copies of academic results for all years in school)
        </span>
      </p>
      <div className="mt-2">
        <AcademicPerfRow
        studentName={studentName}
          template={template}
          yearLabel="Secondary 1"
          fieldId="ch-acad-sec1"
        />
        <AcademicPerfRow
        studentName={studentName}
          template={template}
          yearLabel="Secondary 2"
          fieldId="ch-acad-sec2"
        />
        <AcademicPerfRow
        studentName={studentName}
          template={template}
          yearLabel="Secondary 3"
          fieldId="ch-acad-sec3"
        />
      </div>
      <p className="mt-3 text-[12px]">
        Other Remarks Pertaining to Academic Performance
      </p>
      <p className="mb-4 mt-1 whitespace-pre-line text-[12px] leading-relaxed">
        {fieldValue(template, 'ch-acad-remarks', studentName) ?? ''}
      </p>

      <p className="mt-4 text-[12px] font-bold">
        D&nbsp;&nbsp;&nbsp;&nbsp;Co-Curricular Activities{' '}
        <span className="font-normal italic">
          (Please list down activities student participated in)
        </span>
      </p>
      <div className="ml-6 mt-2 grid grid-cols-[140px_1fr] gap-y-1 text-[12px]">
        <span>CCA/Activities</span>
        <span>: {fieldValue(template, 'ch-cca-activities', studentName) ?? ''}</span>
        <span>Position/s Held</span>
        <span>: {fieldValue(template, 'ch-cca-positions', studentName) ?? ''}</span>
        <span>Attendance</span>
        <span>: {fieldValue(template, 'ch-cca-attendance', studentName) ?? ''}</span>
        <span>Behaviour at CCA</span>
        <span className="whitespace-pre-line">
          : {fieldValue(template, 'ch-cca-behaviour', studentName) ?? ''}
        </span>
      </div>

      <p className="mt-5 text-[12px] font-bold">
        E&nbsp;&nbsp;&nbsp;&nbsp;Other Comments
      </p>

      <p className="ml-6 mt-3 text-[12px] font-bold">
        1&nbsp;&nbsp;&nbsp;&nbsp;Parents'/Guardians' Involvement
      </p>
      <p className="ml-6 mt-1 text-[12px]">
        (Whether the school has the support and co-operation of the student's
        parents/guardians in matters relating to his education and school
        conduct)
      </p>
      <p className="ml-6 mb-2 text-[12px] italic">
        (Please tick the appropriate boxes)
      </p>
      <div className="ml-12 space-y-1.5">
        <YesNoNaRow
          showHeader
          label="a)  The parents/guardians are co-operative"
          value={fieldValue(template, 'ch-par-cooperative', studentName)}
        />
        <YesNoNaRow
          label="b)  The parents/guardians are able to exert control"
          value={fieldValue(template, 'ch-par-control', studentName)}
        />
        <YesNoNaRow
          label={`c)  The parents/guardians acknowledge the offender's wrongdoing`}
          value={fieldValue(template, 'ch-par-acknowledge', studentName)}
        />
        <YesNoNaRow
          label="d)  The parents/guardians are inconsistent in their approach to discipline"
          value={fieldValue(template, 'ch-par-inconsistent', studentName)}
        />
      </div>
      <p className="ml-12 mt-2 text-[12px]">
        e) Others <span className="italic">(Please provide details)</span>
      </p>
      <p className="ml-12 mt-1 whitespace-pre-line text-[12px] leading-relaxed">
        {fieldValue(template, 'ch-par-other', studentName) ?? ''}
      </p>

      <p className="ml-6 mt-4 text-[12px] font-bold">
        2&nbsp;&nbsp;&nbsp;&nbsp;Other Information
      </p>
      <p className="ml-6 mt-1 text-[12px]">
        Whether the student comes from a family background where members are
        known to have any adverse records as follows (if such information is
        available to the school)
      </p>
      <p className="ml-6 mb-2 text-[12px] italic">
        (Please tick the appropriate boxes)
      </p>
      <div className="ml-12 space-y-1.5">
        <YesNoNaRow
          showHeader
          label="a)  An immediate family member/members has a criminal record"
          value={fieldValue(template, 'ch-fam-criminal', studentName)}
        />
        <YesNoNaRow
          label="b)  There is information of drug abuse in the family"
          value={fieldValue(template, 'ch-fam-drug', studentName)}
        />
        <YesNoNaRow
          label="c)  There is information of sexual abuse in the family"
          value={fieldValue(template, 'ch-fam-sexual', studentName)}
        />
        <YesNoNaRow
          label="d)  There is information of physical abuse in the family"
          value={fieldValue(template, 'ch-fam-physical', studentName)}
        />
      </div>
      <p className="ml-12 mt-2 text-[12px]">
        e) Others <span className="italic">(please provide details)</span>
      </p>
      <p className="ml-12 mt-1 whitespace-pre-line text-[12px] leading-relaxed">
        {fieldValue(template, 'ch-fam-other', studentName) ?? ''}
      </p>
      <p className="ml-6 mt-3 text-[11px] italic">
        NA* — Information is not available to the school.
      </p>

      {/* IV. Care Arrangements */}
      <SectionBar numeral="IV" title="CARE ARRANGEMENTS" />
      <p className="ml-6 mt-1 text-[12px]">
        The student's care arrangements, if known to the school (eg. whether the
        student is staying with someone with whom he shares a strong emotional
        bond)
      </p>
      <p className="ml-6 mt-2 whitespace-pre-line text-[12px] leading-relaxed">
        {fieldValue(template, 'ch-care-arrangements', studentName) ?? ''}
      </p>

      {/* V. Student's Health */}
      <SectionBar numeral="V" title="STUDENT'S HEALTH" />
      <p className="ml-6 mt-1 text-[12px]">
        The student's medical, mental, physical ailments if known to the school
      </p>
      <p className="ml-6 mt-2 text-[12px]">
        a) Any known medical problems{' '}
        <span className="italic">(please provide details)</span>
      </p>
      <p className="ml-12 mt-1 whitespace-pre-line text-[12px] leading-relaxed">
        {fieldValue(template, 'ch-health-medical', studentName) ?? ''}
      </p>
      <p className="ml-6 mt-3 text-[12px]">
        b) Student displays extreme symptoms of psychiatric disorder, (eg. any
        known changes in behaviour){' '}
        <span className="italic">(please tick the appropriate boxes)</span>
      </p>
      <div className="ml-12 mt-2 space-y-1.5">
        <YesNoNaRow
          showHeader
          label="a)  Extremely bizarre behaviour (hallucinations, delusions, etc)"
          value={fieldValue(template, 'ch-health-bizarre', studentName)}
        />
        <YesNoNaRow
          label="b)  Extremely violent behaviour"
          value={fieldValue(template, 'ch-health-violent', studentName)}
        />
        <YesNoNaRow
          label="c)  Suicidal inclinations/attempt or clear plan to commit suicide"
          value={fieldValue(template, 'ch-health-suicidal', studentName)}
        />
        <YesNoNaRow
          label="d)  Obvious addiction to substances"
          value={fieldValue(template, 'ch-health-substance', studentName)}
        />
        <YesNoNaRow
          label="e)  Depression"
          value={fieldValue(template, 'ch-health-depression', studentName)}
        />
      </div>
      <p className="ml-12 mt-2 text-[12px]">
        f) Others <span className="italic">(please provide details)</span>
      </p>
      <p className="ml-12 mt-1 whitespace-pre-line text-[12px] leading-relaxed">
        {fieldValue(template, 'ch-health-other', studentName) ?? ''}
      </p>

      {/* VI. Counselling */}
      <SectionBar numeral="VI" title="COUNSELLING" />
      <p className="ml-6 mt-1 text-[12px]">
        If the student has obtained, or is presently undergoing counselling from
        the school.{' '}
        <span className="italic">
          Please provide details, including particulars of counsellor, nature of
          counselling and the offender's attendance at counselling sessions.
        </span>
      </p>
      <div className="ml-6 mt-3 grid grid-cols-[260px_1fr] gap-y-1 text-[12px]">
        <span>Name/type of programme</span>
        <span>: {fieldValue(template, 'ch-couns-programme', studentName) ?? ''}</span>
        <span>Duration/frequency (start/end date)</span>
        <span>: {fieldValue(template, 'ch-couns-duration', studentName) ?? ''}</span>
        <span>Persons involved (e.g. parent, friend, etc.)</span>
        <span>: {fieldValue(template, 'ch-couns-persons', studentName) ?? ''}</span>
        <span>Name of counsellor</span>
        <span>: {fieldValue(template, 'ch-couns-name', studentName) ?? ''}</span>
        <span>Qualifications of counsellor</span>
        <span>: {fieldValue(template, 'ch-couns-quals', studentName) ?? ''}</span>
        <span>Counsellor's contact details</span>
        <span>: {fieldValue(template, 'ch-couns-contact', studentName) ?? ''}</span>
      </div>
      <p className="ml-6 mt-3 text-[12px]">
        Any other details which will be of assistance
      </p>
      <p className="ml-6 mt-1 whitespace-pre-line text-[12px] leading-relaxed">
        {fieldValue(template, 'ch-couns-other', studentName) ?? ''}
      </p>

      {/* VII. Other Information */}
      <SectionBar numeral="VII" title="OTHER INFORMATION" />
      <p className="ml-6 mt-1 text-[12px]">
        Any other information which may assist the student and the person in
        charge of the present investigation{' '}
        <span className="italic">
          (Examples include whether there are any history/current police
          reports, requests that the student be given a second chance, be sent
          to a Home, be placed on GP, etc).
        </span>
      </p>
      <p className="ml-6 mt-2 whitespace-pre-line text-[12px] leading-relaxed">
        {fieldValue(template, 'ch-other-info', studentName) ?? ''}
      </p>

      {/* VIII. Teacher / Person Preparing the Report */}
      <SectionBar
        numeral="VIII"
        title="TEACHER / PERSON PREPARING THE REPORT"
      />
      <div className="ml-6 mt-2 grid grid-cols-[160px_1fr] gap-y-2 text-[12px]">
        <span>Name:</span>
        <span>{fieldValue(template, 'ch-teacher-name', studentName) ?? ''}</span>
        <span>Appointment:</span>
        <span>
          {fieldValue(template, 'ch-teacher-appointment', studentName) ?? ''}
          {'    '}
          <span className="ml-6">
            No. of Years student known:{' '}
            {fieldValue(template, 'ch-teacher-years', studentName) ?? ''}
          </span>
        </span>
      </div>
      <div className="ml-6 mt-6 flex items-end justify-between text-[12px]">
        <div>
          <p className="border-t border-black pt-1">
            Signature of Teacher / Person
          </p>
        </div>
        <div className="text-right">
          <p>Date: {fieldValue(template, 'ch-teacher-date', studentName) ?? ''}</p>
        </div>
      </div>

      {/* IX. Principal / Head of Institution */}
      <SectionBar numeral="IX" title="PRINCIPAL / HEAD OF INSTITUTION" />
      <div className="ml-6 mt-2 grid grid-cols-[80px_1fr_120px_1fr] gap-x-2 gap-y-2 text-[12px]">
        <span>Name:</span>
        <span className="border-b border-black">
          {approved ? ' Mrs Jenny Lim' : ''}
        </span>
        <span>Tel/Fax Numbers:</span>
        <span className="border-b border-black">
          {approved ? ' 6441 3143' : ''}
        </span>
      </div>
      <p className="ml-6 mt-3 text-[12px]">Comments on Report, if any:</p>
      <div className="ml-6 mt-1 space-y-3 text-[12px]">
        <div className="border-b border-black pb-3">&nbsp;</div>
        <div className="border-b border-black pb-3">&nbsp;</div>
        <div className="border-b border-black pb-3">&nbsp;</div>
      </div>

      {/* Sign-off area — blank placeholder until approval, then a
          script-font signature + date stamp. */}
      <div className="ml-6 mt-6 flex items-end justify-between text-[12px]">
        <div>
          {approved ? (
            <p
              className="mb-1 text-[20px] leading-none text-blue-900"
              style={{
                fontFamily:
                  '"Brush Script MT", "Lucida Handwriting", "Snell Roundhand", cursive',
              }}
            >
              Jenny Lim
            </p>
          ) : (
            <p className="mb-1 text-[10px] italic text-muted-foreground">
              Pending sign-off
            </p>
          )}
          <p className="border-t border-black pt-1">
            Signature of Principal / Head
          </p>
        </div>
        <div className="text-right">
          <p>Date: {approved ? '8 May 2026' : ''}</p>
        </div>
      </div>
    </div>
  )
}

// Generic fallback for templates without a faithful renderer. Lists the
// fields with values; not pixel-faithful but still demo-usable.
function GenericFilledRendering({
  template,
  studentName,
}: {
  template: AgencyTemplate
  studentName: string
}) {
  return (
    <div
      className="mx-auto bg-white px-12 py-8 text-black shadow-sm"
      style={{
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        maxWidth: 760,
      }}
    >
      <ConfidentialHeader pageNum={1} />
      <h1 className="mb-1 text-center text-[22px] font-bold tracking-wide">
        {template.name.toUpperCase()}
      </h1>
      <p className="mb-6 text-center text-[12px]">
        {template.agency} — {studentName}
      </p>
      {template.sections.map((section, idx) => {
        const numeral = [
          'I',
          'II',
          'III',
          'IV',
          'V',
          'VI',
          'VII',
          'VIII',
          'IX',
          'X',
          'XI',
          'XII',
        ]
        return (
          <div key={section.id}>
            <SectionBar
              numeral={numeral[idx] ?? `${idx + 1}`}
              title={section.title.toUpperCase()}
            />
            <div className="ml-6 mt-2 space-y-2 text-[12px]">
              {section.fields.map((f) => {
                const v = fieldValue(template, f.id, studentName)
                if (f.type === 'narrative') {
                  return (
                    <div key={f.id}>
                      <p className="font-semibold">{f.label}</p>
                      <p className="mt-1 whitespace-pre-line leading-relaxed">
                        {v ?? ''}
                      </p>
                    </div>
                  )
                }
                return (
                  <div key={f.id}>
                    <span className="font-semibold">{f.label}:</span>{' '}
                    <span>{v ?? ''}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FilledReportRendering({
  template,
  studentName,
  approved = false,
}: {
  template: AgencyTemplate
  studentName: string
  // When true, the Principal's sign-off area is stamped with a
  // script-font signature + date. Defaults to false so the in-progress
  // Show Preview from the Fill page renders unsigned.
  approved?: boolean
}) {
  if (template.id === 'children-home') {
    return (
      <ChildrenHomeFilledRendering
        template={template}
        studentName={studentName}
        approved={approved}
      />
    )
  }
  return (
    <GenericFilledRendering template={template} studentName={studentName} />
  )
}

// Full-screen preview modal showing the filled-in version of the active
// report. Centred overlay + dimmed backdrop; ESC, X-button, and backdrop
// click all dismiss. The body renders <FilledReportRendering /> so the
// preview reflects the demo data the YH would send (auto-populated
// values + AI-drafted narratives + restricted counsellor content).
function DocumentPreviewModal({
  template,
  studentName,
  open,
  onOpenChange,
  approved = false,
}: {
  template: AgencyTemplate
  studentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  approved?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-[900px]">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-base">
            {template.name} — {studentName}
          </DialogTitle>
          <DialogDescription>
            Preview of your filled-in report
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-[480px] flex-1 overflow-auto bg-muted/30 p-6">
          <FilledReportRendering
            template={template}
            studentName={studentName}
            approved={approved}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ReportForm({
  template,
  studentName,
  studentClass,
  studentId,
  principalNote,
  currentReportId,
  onBack: _onBack,
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
  const [savedStatus, setSavedStatus] = useState<'saved' | 'saving'>('saved')
  const [submitOpen, setSubmitOpen] = useState(false)
  const [sentOpen, setSentOpen] = useState(false)
  // Once submitted, the form locks into a read-only / pending state. The
  // YH can either return to the profile or stay on this page to view what
  // they sent. Cleared if the YH starts a new report (component unmounts).
  const [submitted, setSubmitted] = useState(false)
  // Auto-fill: whether the YH has pressed the top-toolbar Auto-fill
  // button. While false, the form renders as a pristine blank report
  // — no source-system values are pre-filled. Once true, EduHub /
  // School Cockpit / TCI-sourced particulars, attendance counts,
  // radio/checkbox defaults etc surface. Narrative (qualitative)
  // fields still stay empty until the YH triggers per-field AI Draft
  // and picks sources — the top-bar button never writes prose.
  const [autoFilled, setAutoFilled] = useState(false)
  const [addCollaboratorsOpen, setAddCollaboratorsOpen] = useState(false)
  // Start empty — the YH invites collaborators after creating the report.
  // MOCK_COLLABORATORS is exposed in the modal as quick-pick suggestions.
  const [collaborators, setCollaborators] = useState<Array<Collaborator>>([])
  // Hardcoded for the demo — the principal's name is not pulled from a
  // real source on this prototype branch.
  const PRINCIPAL_NAME = 'Mrs Tan'
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
    const draft = AI_DRAFTS[id]
    if (!draft) {
      // No bespoke draft for this field — fail loud in dev rather than
      // pollute the textarea with a generic placeholder. Demo paths
      // (MSF School Report + MSF Children's Home) have full coverage in
      // AI_DRAFTS; any miss here is a data-config gap, not a fallback.
      console.warn(`[agency-report] No AI_DRAFTS entry for field "${id}"`)
      return
    }
    updateField(id, personalizeText(draft, studentName))
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

  // Verified counter only counts sections assigned to the current user.
  const reviewableSections = template.sections.filter((s) => {
    const a = assignments[s.id]
    return a && isSameStaff(a, CURRENT_USER)
  })
  const reviewedCount = reviewableSections.filter((s) =>
    completedSections.has(s.id),
  ).length

  // Progress bar tracks VERIFIED sections, not population. 0% at fresh
  // open → 100% once every YH-owned section is marked verified.
  const progressPct = reviewableSections.length
    ? Math.round((reviewedCount / reviewableSections.length) * 100)
    : 0

  // Auto-fill only reveals the structural / auto-populated defaults
  // (particulars, attendance counts, radio/checkbox picks). Narrative
  // fields deliberately stay empty — those live behind the per-field
  // AI Draft button + source picker so the YH stays in control of the
  // qualitative content.
  const autoFill = () => {
    setAutoFilled(true)
    setSavedStatus('saving')
    setTimeout(() => setSavedStatus('saved'), 800)
  }

  return (
    <div
      className={cn(
        'mx-auto flex h-[calc(100vh-120px)] flex-col overflow-hidden rounded-xl border bg-card transition-[max-width]',
        'max-w-5xl',
      )}
    >
      {/* Form header — mirrors Posts new-post top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b bg-card px-4 py-3">
        <AgencyLogo agency={template.agency} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">
              {template.name}
            </span>
            {(() => {
              const days = template.turnaroundDays
              const cls =
                days < 0
                  ? 'text-destructive'
                  : days <= 2
                    ? 'text-amber-11'
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

        {/* Verification progress indicator */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'font-mono text-xs font-semibold tabular-nums',
              progressPct === 100 ? 'text-lime-11' : 'text-foreground',
            )}
          >
            {progressPct}%
          </span>
          <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full transition-[width] duration-300',
                progressPct === 100 ? 'bg-lime-9' : 'bg-amber-9',
              )}
              style={{ width: `${progressPct}%` }}
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
              <Check className="h-3 w-3 text-lime-11" />
              Saved
            </>
          )}
        </span>
        <div className="h-5 w-px bg-border" />
        {!autoFilled && !submitted && (
          <Button size="sm" onClick={autoFill}>
            Auto-fill
          </Button>
        )}
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
          {/* Progress chip + collaborators */}
          <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5" />
              <span className="font-medium tabular-nums text-foreground">
                {reviewedCount} of {reviewableSections.length} sections verified
              </span>
            </span>
            <span className="h-3 w-px bg-border" />
            <CollaboratorAvatars collaborators={collaborators} />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs"
              onClick={() => setAddCollaboratorsOpen(true)}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add collaborator
            </Button>
          </div>

          <AddCollaboratorsModal
            open={addCollaboratorsOpen}
            onOpenChange={setAddCollaboratorsOpen}
            alreadyAdded={collaborators.map((c) => c.email)}
            onAdd={(c) => {
              setCollaborators((prev) => [...prev, c])
              toast.success(`Invite sent to ${c.name}`)
            }}
          />

          {submitted && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-6 bg-amber-3 px-4 py-3">
              <Clock className="h-4 w-4 shrink-0 text-amber-11" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-12">
                  Report submitted · Awaiting principal review
                </p>
                <p className="text-xs text-amber-11/80">
                  This report is locked while {PRINCIPAL_NAME} reviews it.
                </p>
              </div>
              <Badge className="bg-amber-4 text-amber-11 hover:bg-amber-4">
                In Review
              </Badge>
            </div>
          )}

          {principalNote && !submitted && (
            <div className="mb-4 rounded-xl border border-amber-6 bg-amber-3 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-11">
                Principal has requested edits
              </p>
              <p className="text-sm leading-relaxed text-amber-12">
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
            <div
              className={cn(
                'space-y-4',
                submitted && 'pointer-events-none select-none opacity-70',
              )}
              aria-disabled={submitted}
            >
              {template.sections.map((s) => (
                <SectionPanel
                  key={s.id}
                  section={s}
                  fieldValues={fieldValues}
                  aiFlags={aiFlags}
                  autoFilled={autoFilled}
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
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {submitted ? (
                <Badge className="bg-amber-4 px-3 py-1 text-amber-11 hover:bg-amber-4">
                  <Clock className="mr-1.5 h-3 w-3" />
                  In Review · Awaiting {PRINCIPAL_NAME}
                </Badge>
              ) : (
                <Button onClick={() => setSubmitOpen(true)}>
                  Submit for P Review
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
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
              <Button variant="outline" onClick={() => setSubmitOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Persist the submission into the mock store so the
                  // student profile picks up a fresh "In Review" card.
                  appendSubmittedReport({
                    studentId,
                    templateId: template.id,
                    templateName: template.name,
                    agency: template.agency,
                    totalSections: template.sections.length,
                  })
                  setSubmitOpen(false)
                  setSubmitted(true)
                  setSentOpen(true)
                }}
              >
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={sentOpen} onOpenChange={setSentOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-lime-11" />
                Sent to {PRINCIPAL_NAME} for review
              </DialogTitle>
              <DialogDescription>
                {PRINCIPAL_NAME} has been notified. You'll see this report on{' '}
                {studentName}'s profile while it's awaiting review.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSentOpen(false)}>
                Done
              </Button>
              <Button
                onClick={() => {
                  setSentOpen(false)
                  onSubmittedForReview()
                }}
              >
                Return to profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Section nav — sticky pill list */}
        <aside className="hidden w-48 shrink-0 overflow-y-auto border-x bg-card py-5 lg:block">
          <div className="sticky top-0 px-3">
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sections
            </p>
            <nav className="flex flex-col gap-1">
              {template.sections.map((s) => {
                const done = completedSections.has(s.id)
                // Principal's Comments are never written by the YH — they
                // sign off after submission. Lock the nav entry to match
                // the Counsellor pattern for clarity.
                const restricted =
                  s.role === 'principal' ||
                  (s.role === 'counsellor' &&
                    !isSameStaff(
                      assignments[s.id] ?? CURRENT_USER,
                      CURRENT_USER,
                    ))
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
                      <Check className="h-3 w-3 shrink-0 text-lime-11" />
                    )}
                    <span className="truncate">{s.title}</span>
                  </a>
                )
              })}
            </nav>
          </div>
        </aside>
      </div>

      {/* Full-screen template preview modal */}
      <DocumentPreviewModal
        template={template}
        studentName={studentName}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  )
}

// ── S10 Export & Password ─────────────────────────────────────

function ExportPassword({
  template,
  studentName,
  onBack: _onBack,
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
  const [previewOpen, setPreviewOpen] = useState(false)

  // Suggest a memorable but high-entropy password: agency abbrev + month-
  // year + 4 random alphanumerics. Matches the format the existing demo
  // mock data uses (e.g. "SCRUBBED").
  const generatePassword = () => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    const now = new Date()
    const slug = template.abbrev
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .slice(0, 4)
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    const tail = Array.from(
      { length: 4 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('')
    setPw(`${slug}${months[now.getMonth()]}${now.getFullYear()}${tail}`)
    setShowPw(true)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Export Report</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {template.name} · {studentName}
          </p>
        </div>
        <Badge className="gap-1 bg-lime-3 text-lime-11 hover:bg-lime-3">
          <Check className="h-3 w-3" /> Approved
        </Badge>
      </div>

      {/* Full report preview */}
      <div className="overflow-hidden rounded-xl border bg-slate-2">
        <div className="border-b bg-muted px-5 py-3">
          <p className="text-sm font-semibold">Preview</p>
          <p className="text-xs text-muted-foreground">
            {template.name} for {studentName}
          </p>
        </div>
        <div className="relative max-h-[640px] overflow-auto p-6">
          {/* Floating expand-to-fullscreen affordance — opens the same
              DocumentPreviewModal the report-filling page uses. */}
          <TooltipProvider delay={200}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    aria-label="Expand preview"
                    className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-md bg-card/95 text-muted-foreground shadow-[0_2px_8px_rgba(0,0,0,0.12)] backdrop-blur transition-colors hover:bg-card hover:text-foreground"
                  />
                }
              >
                <Maximize2 className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>Expand preview</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Filled-in rendering — same component the Show Preview modal
              uses on the Fill page, so the export view and the modal
              show identical content. The Export step only renders after
              Principal approval, so the rendering is signed. */}
          <FilledReportRendering
            template={template}
            studentName={studentName}
            approved
          />
        </div>
      </div>

      <DocumentPreviewModal
        template={template}
        studentName={studentName}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        approved
      />

      {/* Encryption toggle + (conditional) password */}
      <div className="space-y-4 rounded-xl bg-card p-5 shadow-[0_1px_0_rgba(0,0,0,0.04),0_8px_16px_-12px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">Encrypt with password</span>
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
              Set a password for this PDF
            </label>
            <div className="relative">
              <input
                id="report-password"
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-lg border px-3 py-2 pr-20 font-mono text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <div className="absolute inset-y-0 right-2 flex items-center gap-0.5">
                <TooltipProvider delay={200}>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          onClick={generatePassword}
                          aria-label="Generate password"
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                        />
                      }
                    >
                      <RefreshCw className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>Generate password</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider delay={200}>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          onClick={() => setShowPw((p) => !p)}
                          aria-label={
                            showPw ? 'Hide password' : 'Show password'
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                        />
                      }
                    >
                      {showPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </TooltipTrigger>
                    <TooltipContent>
                      {showPw ? 'Hide password' : 'Show password'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              TW will save this password for future reference
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
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-3">
        <Check className="h-8 w-8 text-lime-11" />
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
  const reportGenerationEnabled = useFeatureFlag('report-generation')

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

  if (!agencyReportsEnabled || !reportGenerationEnabled) {
    const featureLabel = !agencyReportsEnabled
      ? 'Agency Reports'
      : 'Report Generation'
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-semibold">{featureLabel} is disabled</h1>
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

  const activeTemplate = personalizeTemplate(
    AGENCY_TEMPLATES.find((t) => t.id === selectedTemplates[0]) ??
      AGENCY_TEMPLATES[0],
    student,
  )

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
              // The wizard already showed a "Sent to Mrs Tan for review"
              // confirmation modal before calling this — just navigate back
              // to the student profile, where the new In-Review card now
              // appears.
              navigate({
                to: '/students/$id',
                params: { id: student.id },
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
