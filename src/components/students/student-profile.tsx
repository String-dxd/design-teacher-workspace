import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Heart,
  Home,
  Info,
  Languages,
  LayoutGrid,
  Lock,
  PanelRight,
  Phone,
  Plus,
  User,
  X,
} from 'lucide-react'

import { StudentOverviewCards } from './student-overview-cards'
import { AcademicAnalytics } from './academic-analytics'
import { AttendanceAnalytics } from './attendance-analytics'
import { ProfileCriteriaDetailsCard } from './profile-criteria-details-card'
import type { Student } from '@/types/student'
import type { HolisticReport, ReviewStatus, Term } from '@/types/report'
import type { AgencyReport } from '@/data/mock-agency-reports'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { getImportedColumns } from '@/lib/imported-columns'
import {
  TERMS,
  filterReports,
  getStudentGradeCounts,
} from '@/data/mock-reports'
import {
  AGENCY_TEMPLATES,
  getAgencyReportsByStudent,
} from '@/data/mock-agency-reports'
import { AgencyLogo } from '@/components/agency-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GenerateHdpWizard } from '@/components/reports/generate-hdp-wizard'
import { InterventionBanner } from '@/components/students/intervention-banner'
import { useFeatureFlags } from '@/lib/feature-flags'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface StudentProfileProps {
  student: Student
  headerControls?: React.ReactNode
}

interface SectionProps {
  id: string
  title: string
  icon: React.ReactNode
  iconClassName?: string
  headerRight?: React.ReactNode
  children: React.ReactNode
}

function Section({
  id,
  title,
  icon,
  iconClassName,
  headerRight,
  children,
}: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24 rounded-lg border bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            iconClassName,
          )}
        >
          {icon}
        </span>
        <h2 className="text-lg font-semibold flex-1">{title}</h2>
        {headerRight}
      </div>
      {children}
    </section>
  )
}

interface FieldProps {
  label: string
  value: React.ReactNode
  tooltip?: string
  description?: string
  className?: string
}

function Field({ label, value, tooltip, description, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <dt className="flex items-center gap-1 text-sm text-muted-foreground">
        {label}
        {tooltip && <Info className="h-3.5 w-3.5 shrink-0" />}
      </dt>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <dd className="text-sm font-medium">{value ?? '-'}</dd>
    </div>
  )
}

interface RemarksFieldProps {
  label: string
  value: string | null
  tooltip?: string
}

function RemarksField({ label, value, tooltip }: RemarksFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="flex items-center gap-1 text-sm text-muted-foreground">
        {label}
        {tooltip && <Info className="h-3.5 w-3.5 shrink-0" />}
      </dt>
      <dd className="text-sm font-medium">
        {value || <span className="font-normal text-muted-foreground">-</span>}
      </dd>
    </div>
  )
}

interface FieldWithDetailsProps {
  label: string
  value: React.ReactNode
  tooltip: string
  description?: string
  sideSheetTitle: string
  sideSheetContent: React.ReactNode
  className?: string
}

function FieldWithDetails({
  label,
  value,
  tooltip,
  description,
  sideSheetTitle,
  sideSheetContent,
  className,
}: FieldWithDetailsProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div
        className={cn(
          'group relative flex cursor-pointer flex-col gap-1 rounded-xl p-3 -m-3 transition-colors',
          isOpen ? 'bg-muted' : 'hover:bg-muted',
          className,
        )}
        onClick={() => setIsOpen(true)}
      >
        <dt className="flex items-center gap-1 text-sm text-muted-foreground">
          {label}
          <Info className="h-3.5 w-3.5 shrink-0" />
        </dt>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        <dd className="text-sm font-medium">{value ?? '-'}</dd>

        {isOpen ? (
          <button
            className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-xl bg-background px-3 py-2 text-sm text-foreground shadow-sm"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
            }}
          >
            <X className="h-3.5 w-3.5" />
            Close
          </button>
        ) : (
          <span className="invisible absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-xl bg-background px-3 py-2 text-sm text-foreground shadow-sm group-hover:visible">
            <PanelRight className="h-3.5 w-3.5" />
            View
          </span>
        )}
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          showOverlay={false}
          showCloseButton={false}
          className="rounded-l-3xl sm:max-w-xs"
        >
          <SheetHeader className="border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border">
                <Info className="h-3.5 w-3.5" />
              </div>
              <SheetTitle className="flex-1">{sideSheetTitle}</SheetTitle>
              <SheetClose
                render={
                  <button className="text-muted-foreground transition-colors hover:text-foreground" />
                }
              >
                <X className="h-5 w-5" />
              </SheetClose>
            </div>
          </SheetHeader>
          <div className="space-y-5 p-6">{sideSheetContent}</div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function MsfUpliftSheetContent({
  title,
  value,
  titleTooltip,
  fscCaseStartDate,
  fscCaseEndDate,
}: {
  title: string
  value: string
  titleTooltip?: string
  fscCaseStartDate?: string
  fscCaseEndDate?: string
}) {
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 flex items-center gap-1">
          <p className="text-sm font-medium">{title}</p>
          {titleTooltip && (
            <Tooltip>
              <TooltipTrigger
                render={<span className="inline-flex shrink-0" />}
              >
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-xs whitespace-pre-line"
              >
                {titleTooltip}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className="mb-2 text-xs text-muted-foreground">
          MSF via Uplift Office • As of 19 May 2025
        </p>
        <div className="rounded-lg bg-muted px-4 py-3">
          <ul className="space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
              {value}
            </li>
          </ul>
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Remarks</p>
        <div className="rounded-lg bg-muted px-4 py-3 space-y-4 text-sm">
          {fscCaseStartDate && (
            <div>
              <p className="mb-1.5 font-medium">FSC Case start date</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                  {fscCaseStartDate}
                </li>
              </ul>
            </div>
          )}
          {fscCaseEndDate && (
            <div>
              <p className="mb-1.5 font-medium">FSC Case end date</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                  {fscCaseEndDate}
                </li>
              </ul>
            </div>
          )}
          <div>
            <div className="mb-1.5 flex items-start gap-1">
              <p className="font-medium">Nearest SSO</p>
              <Tooltip>
                <TooltipTrigger
                  render={<span className="mt-0.5 inline-flex shrink-0" />}
                >
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs whitespace-pre-line"
                >
                  {`Social Service Offices (SSOs) nearest to student's residential address. MSF via Uplift Office • As of 19 Sep 2026`}
                </TooltipContent>
              </Tooltip>
            </div>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                SSO Woodlands
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function NonIntactFamilySheetContent({ value }: { value: string }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 flex items-center gap-1">
          <p className="text-sm font-medium">Parents are divorced</p>
        </div>
        <p className="mb-2 text-xs text-muted-foreground">
          MSF via Uplift Office • As of 1 May 2026
        </p>
        <div className="rounded-lg bg-muted px-4 py-3">
          <ul className="space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
              {value}
            </li>
          </ul>
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Remarks</p>
        <div className="rounded-lg bg-muted px-4 py-3 space-y-4 text-sm">
          <div>
            <div className="mb-1.5 flex items-start gap-1">
              <p className="font-medium">Nearest SSO</p>
              <Tooltip>
                <TooltipTrigger
                  render={<span className="mt-0.5 inline-flex shrink-0" />}
                >
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs whitespace-pre-line"
                >
                  {`Social Service Offices (SSOs) nearest to student's residential address. MSF via Uplift Office • As of 19 Sep 2026`}
                </TooltipContent>
              </Tooltip>
            </div>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                SSO Woodlands
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Subject data used to compute Overall % across selected subjects
const SUBJECT_COMPUTATION = [
  { subject: 'EL', band: 'G3', percentage: 80 },
  { subject: 'MT', band: 'G2', percentage: 85 },
  { subject: 'Maths', band: 'G3', percentage: 70 },
  { subject: 'Sci', band: 'G3', percentage: 86 },
  { subject: 'Geog', band: 'G2', percentage: 63 },
  { subject: 'Hist', band: 'G3', percentage: 72 },
]

const COMPUTED_OVERALL_PERCENTAGE = Math.round(
  SUBJECT_COMPUTATION.reduce((sum, s) => sum + s.percentage, 0) /
    SUBJECT_COMPUTATION.length,
)

const REVIEW_STATUS_CONFIG: Record<
  ReviewStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
  },
  in_review: {
    label: 'In Review',
    className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
  },
}

function ReportRow({ report }: { report: HolisticReport }) {
  const { label, className } = REVIEW_STATUS_CONFIG[report.reviewStatus]
  const generatedDate = report.generatedAt.toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <Link
      to="/reports/$id"
      params={{ id: report.id }}
      className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center gap-3">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">
            {report.term} — {report.academicYear}
          </p>
          <p className="text-xs text-muted-foreground">
            Generated {generatedDate}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={className}>{label}</Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  )
}

const AGENCY_STATUS_CONFIG: Record<
  AgencyReport['status'],
  { label: string; className: string }
> = {
  draft: {
    label: 'Draft',
    className: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
  },
  pending_review: {
    label: 'In Review',
    className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  },
  edits_requested: {
    label: 'Edits Requested',
    className: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
  },
}

function addBusinessDaysSimple(from: Date, days: number): Date {
  const d = new Date(from)
  let added = 0
  while (added < days) {
    d.setDate(d.getDate() + 1)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  return d
}

function AgencyReportRow({ report }: { report: AgencyReport }) {
  const [showPw, setShowPw] = useState(false)
  // The mock store is mutable — we toggle the status here for the demo and
  // bump a local tick so the row re-renders. No upstream re-fetch needed.
  const [, setTick] = useState(0)
  const status = report.status
  const { label, className } = AGENCY_STATUS_CONFIG[status]
  const approve = () => {
    report.status = 'approved'
    setTick((t) => t + 1)
  }
  const createdDate = report.createdAt.toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  // Due date: clock icon + bare "N days" (no "Due in" prefix)
  let dueLabel: string | null = null
  let dueClass = ''
  if (report.startedAt && (status === 'draft' || status === 'pending_review')) {
    const tpl = AGENCY_TEMPLATES.find((t) => t.id === report.templateId)
    if (tpl) {
      // Two windows here:
      // - Drafts: count down to the agency's turnaround (e.g. 7 days for MSF).
      // - Pending review: the principal has a fixed 2-business-day review
      //   window. Hardcoded so demos always show "2 days" right after
      //   submission regardless of the calendar date.
      const PRINCIPAL_REVIEW_DAYS = 2
      const windowDays =
        status === 'pending_review' ? PRINCIPAL_REVIEW_DAYS : tpl.turnaroundDays
      const due = addBusinessDaysSimple(report.startedAt, windowDays)
      const today = new Date()
      const diffMs = due.getTime() - today.getTime()
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
      if (diffDays < 0) {
        const abs = Math.abs(diffDays)
        dueLabel = `${abs} day${abs !== 1 ? 's' : ''} overdue`
        dueClass = 'text-red-600'
      } else {
        dueLabel = `${diffDays} day${diffDays !== 1 ? 's' : ''}`
        dueClass = diffDays <= 2 ? 'text-amber-600' : 'text-muted-foreground'
      }
    }
  }

  // Click target: drafts/edits resume the form; approved jumps to Export.
  // pending_review rows are not click-through — but the badge itself is a
  // demo button that flips them to Approved.
  const isClickable =
    status === 'draft' || status === 'edits_requested' || status === 'approved'

  // Mock per-section completion summary for in-progress reports
  // (Counsellor's Input + Principal's Remarks are typical "awaiting" sections.)
  let completionSummary: {
    completed: number
    total: number
    awaiting: Array<string>
  } | null = null
  if (status === 'draft' || status === 'edits_requested') {
    const tpl = AGENCY_TEMPLATES.find((t) => t.id === report.templateId)
    if (tpl) {
      const total = tpl.sections.length
      const awaiting = tpl.sections
        .filter((s) => s.role !== 'yh')
        .map((s) => s.title)
      completionSummary = {
        completed: total - awaiting.length - (status === 'draft' ? 0 : 0),
        total,
        awaiting,
      }
    }
  } else if (status === 'pending_review') {
    // Just-submitted card: every section is filled by the YH; only the
    // Principal's review remains.
    const tpl = AGENCY_TEMPLATES.find((t) => t.id === report.templateId)
    if (tpl) {
      const total = tpl.sections.length
      completionSummary = {
        completed: total,
        total,
        awaiting: ["Principal's review"],
      }
    }
  }

  const titleContent = (
    <>
      <p className="text-sm font-medium truncate">{report.templateName}</p>
      <p className="text-xs text-muted-foreground truncate">
        {report.agency} · {createdDate}
      </p>
      {completionSummary && completionSummary.awaiting.length > 0 && (
        <p className="mt-1 text-xs tabular-nums text-muted-foreground truncate">
          {completionSummary.completed} of {completionSummary.total} sections
          completed
          {completionSummary.awaiting.length > 0 && (
            <>
              {' · '}
              <span>Awaiting: {completionSummary.awaiting.join(', ')}</span>
            </>
          )}
        </p>
      )}
    </>
  )

  return (
    <div className="group flex flex-col gap-1.5 rounded-lg border transition-colors hover:border-primary/40 hover:bg-muted/20">
      <div className="flex items-center gap-3 px-4 py-3">
        <AgencyLogo agency={report.agency} size="sm" />
        {isClickable ? (
          <Link
            to="/students/$id/agency-report/new"
            params={{ id: report.studentId }}
            search={{ reportId: report.id }}
            className="flex-1 min-w-0 text-left"
          >
            {titleContent}
          </Link>
        ) : (
          <div className="flex-1 min-w-0">{titleContent}</div>
        )}
        {dueLabel && (
          <span
            className={cn(
              'flex items-center gap-1 text-xs font-medium tabular-nums',
              dueClass,
            )}
          >
            <Clock className="h-3 w-3" />
            {dueLabel}
          </span>
        )}
        {status === 'pending_review' ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              approve()
            }}
            title="Click to mark as approved (demo)"
            className="rounded-full transition-transform active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          >
            <Badge className={cn(className, 'cursor-pointer')}>{label}</Badge>
          </button>
        ) : (
          <Badge className={className}>{label}</Badge>
        )}
        {report.passwordSaved && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowPw((p) => !p)
            }}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={showPw ? 'Hide password' : 'View password'}
          >
            <Lock className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {showPw && report.password && (
        <div className="mx-4 mb-3 flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 text-xs">
          <span className="text-muted-foreground">PDF password:</span>
          <span className="flex-1 font-mono">{report.password}</span>
          <button
            onClick={() => setShowPw(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <EyeOff className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}

function formatTermList(
  records: Array<{ year: number; terms: Array<string> }>,
): string {
  if (records.length === 0) return 'None'
  return records
    .slice()
    .sort((a, b) => b.year - a.year)
    .map(({ year, terms }) => {
      const numbers = terms
        .map((t) => parseInt(t.replace('Term ', '')))
        .sort((a, b) => a - b)
      return `${year} (Term ${numbers.join(', ')})`
    })
    .join(', ')
}

export function StudentProfile({
  student,
  headerControls,
}: StudentProfileProps) {
  const [wizardOpen, setWizardOpen] = useState(false)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [academicAnalyticsOpen, setAcademicAnalyticsOpen] = useState(false)
  const [primaryContactOpen, setPrimaryContactOpen] = useState(false)
  const { isEnabled } = useFeatureFlags()

  const holisticReportsEnabled = useFeatureFlag('holistic-reports')
  const agencyReportsEnabled = useFeatureFlag('agency-reports')
  const reportGenerationEnabled = useFeatureFlag('report-generation')
  const studentAnalyticsEnabled = useFeatureFlag('student-analytics')
  const studentAnalyticsBasicEnabled = useFeatureFlag('student-analytics-basic')
  const msfUpliftEnabled = useFeatureFlag('msf-uplift-data')
  // Default "Student Insights" view — applies when both analytics flags are off
  const isStudentInsightsView =
    !studentAnalyticsEnabled && !studentAnalyticsBasicEnabled
  const importedColumns = useMemo(() => getImportedColumns(), [])

  const gradeCounts = getStudentGradeCounts(student)
  const studentReports = filterReports({ studentId: student.id })
  const existingTerms = new Set(studentReports.map((r) => r.term))
  const missingTerms = TERMS.filter((t): t is Term => !existingTerms.has(t))
  const agencyReports = getAgencyReportsByStudent(student.id)

  const fasField = <Field label="FAS" value={student.fas || '-'} />
  const custodyField = (
    <Field
      label="Custody"
      value={student.custody || 'Mother (Sole custody with care and control)'}
    />
  )
  const housingField = (
    <FieldWithDetails
      label="Housing"
      value={student.housing || '-'}
      tooltip="Housing details"
      sideSheetTitle="Housing"
      sideSheetContent={
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium">Housing</p>
            <div className="rounded-lg bg-muted px-4 py-3">
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                  {student.housing || '-'}
                </li>
              </ul>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Remarks</p>
            <div className="rounded-lg bg-muted px-4 py-3 space-y-4 text-sm">
              <div>
                <p className="font-medium mb-1.5">Address</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                    Blk/Hse-1 #1-1 MOE St Singapore 111111
                  </li>
                </ul>
              </div>
              {!isStudentInsightsView && (
                <div>
                  <p className="font-medium mb-1.5">Living arrangement</p>
                  <ul className="space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                      Not staying with parents
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                      Father deceased
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      }
    />
  )
  const housingOwnershipField = (
    <Field
      label="Housing ownership"
      value={
        student.housingType === 'Rented'
          ? 'Rented'
          : student.housingType === 'Owned'
            ? 'Owner-occupied'
            : '-'
      }
    />
  )
  const primaryContactField = (
    <FieldWithDetails
      label="Primary contact"
      value="Mother"
      tooltip="Primary emergency contact details"
      sideSheetTitle="Primary contact"
      sideSheetContent={
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium">Primary contact</p>
            <div className="rounded-lg bg-muted px-4 py-3">
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                  Mother
                </li>
              </ul>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Remarks</p>
            <div className="rounded-lg bg-muted px-4 py-3 space-y-4 text-sm">
              <div>
                <p className="font-medium mb-1.5">Name</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                    Ai Mee Tiam
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1.5">Mobile</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                    +65 1111 1111
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1.5">Home</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                    +65 1111 1111
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1.5">Email</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                    test@gmail.com.sg
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      }
    />
  )
  const siblingsField =
    student.siblingDetails && student.siblingDetails.length > 0 ? (
      <FieldWithDetails
        label="Siblings"
        value={student.siblings}
        tooltip="Sibling details"
        sideSheetTitle="Siblings"
        sideSheetContent={
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">Siblings</p>
              <div className="rounded-lg bg-muted px-4 py-3">
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                    {student.siblings}
                  </li>
                </ul>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Remarks</p>
              <div className="rounded-lg bg-muted px-4 py-3 space-y-4 text-sm">
                {isStudentInsightsView ? (
                  <ul className="space-y-1.5">
                    {student.siblingDetails.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                        {s.name} ({s.class})
                      </li>
                    ))}
                  </ul>
                ) : (
                  student.siblingDetails.map((s, i) => (
                    <div key={i}>
                      <p className="font-medium mb-1.5">
                        {s.name} ({s.class})
                      </p>
                      {s.relationship ? (
                        <ul className="space-y-1.5">
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                            {s.relationship}
                          </li>
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">None</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        }
      />
    ) : (
      <Field
        label="Siblings"
        value={student.siblings > 0 ? student.siblings : '-'}
      />
    )

  const sections = [
    ...(msfUpliftEnabled && isStudentInsightsView
      ? []
      : [{ id: 'attendance', label: 'Attendance' }]),
    { id: 'behaviour', label: 'Behaviour' },
    { id: 'wellbeing', label: 'Wellbeing' },
    { id: 'academic', label: 'Academic' },
    { id: 'family', label: 'Family' },
    ...(isStudentInsightsView ? [] : [{ id: 'personal', label: 'Personal' }]),
    ...(!msfUpliftEnabled && (holisticReportsEnabled || agencyReportsEnabled)
      ? [{ id: 'reports', label: 'Reports' }]
      : []),
    ...(importedColumns.length > 0 ? [{ id: 'others', label: 'Others' }] : []),
  ]

  return (
    <div className="flex gap-8">
      <div className="min-w-0 flex-1 space-y-6">
        {/* Header Controls */}
        {headerControls}

        {/* Student Header Card */}
        <div className="flex items-center gap-4 rounded-3xl border bg-white p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{student.name}</h1>
            <p className="text-muted-foreground">
              Class {student.class} · {student.cca}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-sm"
            onClick={() => setPrimaryContactOpen(true)}
          >
            <Phone className="h-3.5 w-3.5" />
            Primary contact
          </Button>
        </div>

        <Sheet open={primaryContactOpen} onOpenChange={setPrimaryContactOpen}>
          <SheetContent
            showOverlay={false}
            showCloseButton={false}
            className="rounded-l-3xl sm:max-w-xs"
          >
            <SheetHeader className="border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border">
                  <Phone className="h-3.5 w-3.5" />
                </div>
                <SheetTitle className="flex-1">Primary contact</SheetTitle>
                <SheetClose
                  render={
                    <button className="text-muted-foreground transition-colors hover:text-foreground" />
                  }
                >
                  <X className="h-5 w-5" />
                </SheetClose>
              </div>
            </SheetHeader>
            <div className="space-y-5 p-6">
              <div>
                <p className="mb-2 text-sm font-medium">Primary contact</p>
                <div className="rounded-lg bg-muted px-4 py-3">
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                      Mother
                    </li>
                  </ul>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Remarks</p>
                <div className="rounded-lg bg-muted px-4 py-3 space-y-4 text-sm">
                  <div>
                    <p className="font-medium mb-1.5">Name</p>
                    <ul className="space-y-1">
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                        Ai Mee Tiam
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1.5">Mobile</p>
                    <ul className="space-y-1">
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                        +65 9123 4567
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1.5">Home</p>
                    <ul className="space-y-1">
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                        6769 0000
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1.5">Email</p>
                    <ul className="space-y-1">
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                        ai_mee_tiam@gmail.com
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Intervention Banner — only surfaces for students with support needs */}
        {isEnabled('lta-intervention') && (
          <InterventionBanner student={student} />
        )}

        {/* Overview Cards */}
        <StudentOverviewCards student={student} />

        {/* Criteria details (only when an applied profile group matches) */}
        <ProfileCriteriaDetailsCard student={student} />

        {/* Attendance Section */}
        {(!msfUpliftEnabled || !isStudentInsightsView) && (
          <Section
            id="attendance"
            title="Attendance"
            icon={<Calendar className="h-5 w-5" />}
            iconClassName="bg-yellow-100 text-yellow-600"
          >
            <dl className="grid grid-cols-3 gap-x-8 gap-y-4">
              <Field
                label="Attendance (%)"
                value={
                  student.totalSchoolDays > 0
                    ? Math.round(
                        (student.daysPresent / student.totalSchoolDays) * 100,
                      )
                    : 0
                }
              />
              <Field label="Late-coming (days)" value={student.lateComing} />
              <Field label="Non-VR absences (days)" value={student.absences} />
              <Field
                label="CCA attendance(%)"
                value={`${100 - student.ccaMissed * 5}`}
              />
            </dl>

            {analyticsOpen && <AttendanceAnalytics student={student} />}

            {!isStudentInsightsView && (
              <div className="mt-4">
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-blue-600"
                  onClick={() => setAnalyticsOpen((prev) => !prev)}
                >
                  {analyticsOpen ? 'Show less ∧' : 'View analytics ∨'}
                </Button>
              </div>
            )}
          </Section>
        )}

        {/* Behaviour Section */}
        <Section
          id="behaviour"
          title="Behaviour"
          icon={<BookOpen className="h-5 w-5" />}
          iconClassName="bg-indigo-100 text-indigo-600"
        >
          <dl className="grid grid-cols-3 gap-x-8 gap-y-4">
            <FieldWithDetails
              label="Offences"
              value={student.offences}
              tooltip="Total disciplinary offences this year"
              sideSheetTitle="Offences"
              sideSheetContent={
                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-sm font-medium">Offences</p>
                    <div className="rounded-lg bg-muted px-4 py-3">
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                          {student.offences}
                        </li>
                      </ul>
                    </div>
                  </div>
                  {student.offenceDetails &&
                    student.offenceDetails.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-medium">Remarks</p>
                        <div className="rounded-lg bg-muted px-4 py-3">
                          <ul className="space-y-1.5 text-sm">
                            {student.offenceDetails.map((d, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                                {d.type} x {d.count} (latest {d.latestDate})
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                </div>
              }
            />
            <FieldWithDetails
              label="Counselling cases"
              value={student.counsellingSessions}
              tooltip="Number of counselling sessions this year"
              sideSheetTitle="Counselling cases"
              sideSheetContent={
                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      Counselling cases
                    </p>
                    <div className="rounded-lg bg-muted px-4 py-3">
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                          {student.counsellingSessions}
                        </li>
                      </ul>
                    </div>
                  </div>
                  {student.counsellingCases &&
                    student.counsellingCases.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-medium">Remarks</p>
                        <div className="rounded-lg bg-muted px-4 py-3">
                          <ul className="space-y-1.5 text-sm">
                            {student.counsellingCases.map((c, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                                {c.subcases && c.subcases.length > 0 ? (
                                  <span>
                                    {c.category}:{' '}
                                    {c.subcases
                                      .map(
                                        (s) =>
                                          `${s.name} x${s.count} (latest ${s.latestDate})`,
                                      )
                                      .join(', ')}
                                  </span>
                                ) : (
                                  <span>
                                    {c.category} x{c.count} (latest{' '}
                                    {c.latestDate})
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                </div>
              }
            />
            <Field label="SEN" value={student.sen || '-'} />
            <Field
              label="Conduct grade"
              value={
                student.conduct ? (
                  <>
                    {student.conduct}{' '}
                    <span className="font-normal text-muted-foreground">
                      (2025, Overall)
                    </span>
                  </>
                ) : (
                  '-'
                )
              }
            />
          </dl>

          {!isStudentInsightsView && (
            <div className="mt-6 space-y-4 border-t pt-4">
              <RemarksField
                label="Teacher's remarks"
                value={student.teacherObservations}
              />
              <RemarksField label="Next steps" value={student.nextSteps} />
            </div>
          )}
        </Section>

        {/* Wellbeing Section */}
        <Section
          id="wellbeing"
          title="Wellbeing"
          icon={<Heart className="h-5 w-5" />}
          iconClassName="bg-pink-100 text-pink-600"
        >
          {(() => {
            const socialLinks = (
              <FieldWithDetails
                label="Social links"
                value={student.socialLinks}
                tooltip="Number of social connections"
                sideSheetTitle="Social links"
                sideSheetContent={
                  <div className="space-y-5">
                    <div>
                      <p className="mb-2 text-sm font-medium">Social links</p>
                      <div className="rounded-lg bg-muted px-4 py-3">
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                            {student.socialLinks}
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-medium">Remarks</p>
                      <div className="rounded-lg bg-muted px-4 py-3 space-y-4 text-sm">
                        <div>
                          <p className="font-medium mb-1.5">Selected by</p>
                          {student.selectedBy &&
                          student.selectedBy.length > 0 ? (
                            <ul className="space-y-1.5">
                              {student.selectedBy.map((person, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                                  {person.name} ({person.class}, closeness
                                  rating:{' '}
                                  {person.closenessRating != null
                                    ? `${person.closenessRating}/5`
                                    : 'N/A'}
                                  )
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted-foreground">None</p>
                          )}
                        </div>
                        <div>
                          <p className="font-medium mb-1.5">Selected friends</p>
                          {student.selectedFriends &&
                          student.selectedFriends.length > 0 ? (
                            <ul className="space-y-1.5">
                              {student.selectedFriends.map((person, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                                  {person.name} ({person.class}, closeness
                                  rating:{' '}
                                  {person.closenessRating != null
                                    ? `${person.closenessRating}/5`
                                    : 'N/A'}
                                  )
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted-foreground">None</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />
            )
            const riskIndicators = (
              <FieldWithDetails
                label="TCI risk indicators"
                value={`${student.riskIndicators} of 5 indicators`}
                tooltip="Risk indicators from TCI survey"
                sideSheetTitle="TCI risk indicators"
                sideSheetContent={
                  <div className="space-y-5">
                    <div>
                      <p className="mb-1 text-sm font-medium">Latest term</p>
                      <p className="mb-2 text-xs text-muted-foreground">
                        No. of risk indicators flagged in latest Termly Check-In
                        Survey
                      </p>
                      <div className="rounded-lg bg-muted px-4 py-3">
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                            {student.riskIndicators} of 5 indicators
                          </li>
                        </ul>
                      </div>
                    </div>
                    {student.riskIndicatorHistory &&
                      student.riskIndicatorHistory.length > 0 && (
                        <div>
                          <p className="mb-2 text-sm font-medium">
                            Past 4 terms (if any)
                          </p>
                          <div className="rounded-lg bg-muted px-4 py-3 space-y-4 text-sm">
                            {student.riskIndicatorHistory.map((record, i) => (
                              <div key={i}>
                                <p className="font-medium mb-1.5">
                                  {record.year}, {record.term}
                                </p>
                                <ul className="space-y-1.5">
                                  {record.indicators.map((indicator, j) => (
                                    <li
                                      key={j}
                                      className="flex items-start gap-2"
                                    >
                                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                                      {indicator}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                }
              />
            )
            const lowMoodValue =
              student.lowMoodTerms && student.lowMoodTerms.length > 0
                ? formatTermList(student.lowMoodTerms)
                : student.lowMoodFlagged || 'No'
            const lowMood = (
              <FieldWithDetails
                label="Low mood flagged 2+ terms"
                value={lowMoodValue}
                tooltip="Flagged for persistent low mood"
                sideSheetTitle="Low mood flagged 2+ terms"
                sideSheetContent={
                  <div className="space-y-5">
                    <div>
                      <p className="mb-1 text-sm font-medium">
                        Past 4 terms (if any)
                      </p>
                      <p className="mb-2 text-xs text-muted-foreground">
                        Flagged in at least 2 terms in the past 4 terms, based
                        on Termly Check-In Survey (All Ears).
                      </p>
                      <div className="rounded-lg bg-muted px-4 py-3">
                        <ul className="space-y-1 text-sm">
                          {student.lowMoodTerms &&
                          student.lowMoodTerms.length > 0 ? (
                            student.lowMoodTerms
                              .slice()
                              .sort((a, b) => b.year - a.year)
                              .map(({ year, terms }) => {
                                const numbers = terms
                                  .map((t) => parseInt(t.replace('Term ', '')))
                                  .sort((a, b) => a - b)
                                return (
                                  <li
                                    key={year}
                                    className="flex items-center gap-2"
                                  >
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                                    {year} (Term {numbers.join(', ')})
                                  </li>
                                )
                              })
                          ) : (
                            <li className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                              {lowMoodValue}
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                }
              />
            )
            return (
              <dl className="grid grid-cols-3 gap-x-8 gap-y-4">
                {isStudentInsightsView ? (
                  <>
                    {riskIndicators}
                    {lowMood}
                    {socialLinks}
                  </>
                ) : (
                  <>
                    {socialLinks}
                    {riskIndicators}
                    {lowMood}
                  </>
                )}
              </dl>
            )
          })()}
        </Section>

        {/* Academic Section */}
        <Section
          id="academic"
          title="Academic"
          icon={<GraduationCap className="h-5 w-5" />}
          iconClassName="bg-blue-100 text-blue-600"
        >
          <dl className="grid grid-cols-3 gap-x-8 gap-y-4">
            <FieldWithDetails
              label="Overall % across selected subjects"
              value={`${COMPUTED_OVERALL_PERCENTAGE}%`}
              tooltip="Average percentage across subjects selected for computation"
              sideSheetTitle="Overall % across selected subjects"
              sideSheetContent={
                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      Overall % across selected subjects
                    </p>
                    <div className="rounded-lg bg-muted px-4 py-3">
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                          {COMPUTED_OVERALL_PERCENTAGE}%
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">Remarks</p>
                    <div className="rounded-lg bg-muted px-4 py-3 space-y-4 text-sm">
                      <div>
                        <p className="font-medium mb-1.5">Selected subjects</p>
                        <ul className="space-y-1.5">
                          {SUBJECT_COMPUTATION.map((item, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                              {item.subject} - {item.band} ({item.percentage}%)
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              }
            />

            {!isStudentInsightsView && (
              <>
                <Field
                  label="No. of subjects"
                  value={gradeCounts !== null ? gradeCounts.total : '-'}
                />
                {gradeCounts !== null && (
                  <>
                    <Field
                      label="No. of Distinctions"
                      value={gradeCounts.distinctions}
                    />
                    <Field label="No. of Passes" value={gradeCounts.passes} />
                  </>
                )}
                <Field
                  label="Approved MTL"
                  value={student.approvedMtl || '-'}
                />
              </>
            )}
            <Field
              label="Learning support"
              value={student.learningSupport || '-'}
            />
            {!isStudentInsightsView && (
              <Field
                label="Post-sec eligibility"
                value={student.postSecEligibility || '-'}
              />
            )}
          </dl>

          {academicAnalyticsOpen && <AcademicAnalytics />}

          {!isStudentInsightsView && (
            <div className="mt-4">
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-blue-600"
                onClick={() => setAcademicAnalyticsOpen((prev) => !prev)}
              >
                {academicAnalyticsOpen ? 'Show less ∧' : 'View analytics ∨'}
              </Button>
            </div>
          )}
        </Section>

        {/* Family Section */}
        <Section
          id="family"
          title="Family"
          icon={<Home className="h-5 w-5" />}
          iconClassName="bg-green-100 text-green-600"
        >
          <dl className="grid grid-cols-3 gap-x-8 gap-y-4">
            {msfUpliftEnabled ? (
              <>
                {primaryContactField}
                {custodyField}
                {(() => {
                  const consideringDivorce =
                    student.parentsConsideringDivorce ?? 'No'
                  const consideringDivorceTooltip = `"Yes" indicates that at least one parent is enrolled in the Mandatory Co-Parenting Programme (CCP). All parents with children below 21 years old are required to attend the CCP before filing for divorce. Under the CCP, parents receive support from counsellors to help them make informed decisions that prioritise the well-being of their children, such as working out co-parenting arrangements arising from a divorce.`
                  return (
                    <FieldWithDetails
                      label="Parent enrolled in CCP"
                      tooltip="Parent enrolled in CCP"
                      description="MSF via Uplift Office • 19 May 2025"
                      value={consideringDivorce}
                      sideSheetTitle="Parent enrolled in CCP"
                      sideSheetContent={
                        <MsfUpliftSheetContent
                          title="Parent enrolled in CCP"
                          value={consideringDivorce}
                          titleTooltip={consideringDivorceTooltip}
                        />
                      }
                    />
                  )
                })()}
                {(() => {
                  const nonIntact = student.nonIntactFamily ?? '-'
                  return (
                    <FieldWithDetails
                      label="Parents are divorced"
                      tooltip="Parents are divorced"
                      description="MSF via Uplift Office • 19 May 2025"
                      value={nonIntact}
                      sideSheetTitle="Parents are divorced"
                      sideSheetContent={
                        <NonIntactFamilySheetContent value={nonIntact} />
                      }
                    />
                  )
                })()}
                {(() => {
                  const comLink = student.supportedByComLink ?? 'No'
                  const comLinkDisplay =
                    comLink === 'Yes'
                      ? `Yes by ${student.supportedByComLinkBy ?? 'SSO Woodlands'}`
                      : comLink
                  return (
                    <FieldWithDetails
                      label="Supported by ComLink+"
                      tooltip="Supported by ComLink+"
                      description="MSF via Uplift Office • 19 May 2025"
                      value={comLinkDisplay}
                      sideSheetTitle="Supported by ComLink+"
                      sideSheetContent={
                        <MsfUpliftSheetContent
                          title="Supported by ComLink+"
                          value={comLinkDisplay}
                        />
                      }
                    />
                  )
                })()}
                {(() => {
                  const fsc = student.supportedByFsc ?? 'No'
                  const fscDisplay =
                    fsc === 'Yes'
                      ? 'Yes by Fei Yue FSC (Choa Chu Kang)'
                      : fsc
                  return (
                    <FieldWithDetails
                      label="Supported by FSC"
                      tooltip="Supported by FSC"
                      description="MSF via Uplift Office • 19 May 2025"
                      value={fscDisplay}
                      sideSheetTitle="Supported by FSC"
                      sideSheetContent={
                        <MsfUpliftSheetContent
                          title="Supported by FSC"
                          value={fscDisplay}
                          fscCaseStartDate="11 Jan 2025"
                          fscCaseEndDate={
                            student.name === 'Sim Xin Yi'
                              ? 'Ongoing'
                              : '22 May 2026'
                          }
                        />
                      }
                    />
                  )
                })()}
                {fasField}
                {housingField}
                {housingOwnershipField}
                {siblingsField}
              </>
            ) : (
              <>
                {fasField}
                {housingField}
                {housingOwnershipField}
                {!isStudentInsightsView && (
                  <Field
                    label="Commuter status"
                    value={student.commuterStatus || 'Non-commuter'}
                  />
                )}
                {!isStudentInsightsView && (
                  <Field
                    label="After-school arrangement"
                    value={student.afterSchoolArrangement || 'No arrangement'}
                  />
                )}
                {primaryContactField}
                {siblingsField}
              </>
            )}
          </dl>
        </Section>

        {/* Personal Section */}
        {!isStudentInsightsView && (
          <Section
            id="personal"
            title="Personal"
            icon={<Languages className="h-5 w-5" />}
            iconClassName="bg-purple-100 text-purple-600"
          >
            <dl className="grid grid-cols-3 gap-x-8 gap-y-4">
              {!isStudentInsightsView && (
                <Field
                  label="Health alerts"
                  value="1 from Parent, 1 from SHS"
                />
              )}
              <Field label="Citizenship" value={student.citizenship ?? '-'} />
              <Field
                label="Language spoken"
                value={student.languagesSpoken ?? '-'}
              />
              <Field
                label="Age"
                value={
                  student.birthday
                    ? (() => {
                        const [day, month, year] = student.birthday.split(' ')
                        const birthYear = parseInt(year)
                        const birthMonth = new Date(`${month} 1`).getMonth()
                        const today = new Date(2026, 2, 4) // 2026-03-04
                        let age = today.getFullYear() - birthYear
                        if (
                          today.getMonth() < birthMonth ||
                          (today.getMonth() === birthMonth &&
                            today.getDate() < parseInt(day))
                        ) {
                          age--
                        }
                        return `${age} years old (${student.birthday})`
                      })()
                    : '-'
                }
              />
            </dl>
          </Section>
        )}

        {/* Reports Section — shown whenever EITHER the holistic flag or
            the agency-reports flag is on. The Holistic part is gated on
            `holisticReportsEnabled`; the Agency Reports subsection on
            `agencyReportsEnabled`. */}
        {!msfUpliftEnabled &&
          (holisticReportsEnabled || agencyReportsEnabled) && (
            <Section
              id="reports"
              title="Reports"
              icon={<FileText className="h-5 w-5" />}
              iconClassName="bg-red-100 text-red-600"
              headerRight={
                holisticReportsEnabled && studentReports.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    render={
                      <Link
                        to="/reports"
                        search={{ studentId: student.id, groupBy: 'student' }}
                      />
                    }
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    View all in Reports
                  </Button>
                ) : undefined
              }
            >
              {/* Holistic Development Reports — gated on holistic flag. */}
              {holisticReportsEnabled && (
                <>
                  {studentReports.length > 0 ? (
                    <div className="space-y-2">
                      {studentReports
                        .sort(
                          (a, b) =>
                            TERMS.indexOf(a.term) - TERMS.indexOf(b.term),
                        )
                        .map((report) => (
                          <ReportRow key={report.id} report={report} />
                        ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          No reports generated
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Generate a Holistic Development Report for this
                          student
                        </p>
                      </div>
                    </div>
                  )}

                  {missingTerms.length > 0 && (
                    <div className="mt-4 flex items-center gap-2 border-t pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWizardOpen(true)}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Generate HDP
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {missingTerms.length === TERMS.length
                          ? 'All terms'
                          : missingTerms.join(', ')}{' '}
                        not yet generated
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Agency Reports subsection. */}
              {agencyReportsEnabled && (
                <div
                  className={cn(holisticReportsEnabled && 'mt-6 border-t pt-5')}
                >
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Agency Reports
                  </p>
                  {agencyReports.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {agencyReports.map((report) => (
                        <AgencyReportRow key={report.id} report={report} />
                      ))}
                    </div>
                  )}
                  {reportGenerationEnabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      render={
                        <Link
                          to="/students/$id/agency-report/new"
                          params={{ id: student.id }}
                        />
                      }
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      New Agency Report
                    </Button>
                  )}
                </div>
              )}
            </Section>
          )}
        {/* Others Section — imported fields */}
        {importedColumns.length > 0 && (
          <Section
            id="others"
            title="Others"
            icon={<LayoutGrid className="h-5 w-5" />}
            iconClassName="bg-slate-100 text-slate-600"
          >
            <dl className="grid grid-cols-3 gap-x-8 gap-y-6">
              {importedColumns.map((col) => (
                <div key={col.id} className="flex flex-col gap-1">
                  <dt className="text-sm font-semibold">{col.label}</dt>
                  <dd className="text-sm text-muted-foreground">
                    Field that is uploaded without category tag to it
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        )}
      </div>

      {/* Jump to Navigation */}
      <aside className="hidden w-40 shrink-0 lg:block">
        <div className="sticky top-24">
          <p className="mb-2 text-sm text-muted-foreground">Jump to</p>
          <nav className="flex flex-col gap-1">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full bg-muted px-3 py-1.5 text-sm hover:bg-muted/80"
              >
                {section.label}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      <GenerateHdpWizard
        student={student}
        missingTerms={missingTerms}
        open={wizardOpen}
        onOpenChange={setWizardOpen}
      />
    </div>
  )
}
