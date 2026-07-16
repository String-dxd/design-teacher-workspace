import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  BookOpen,
  Calendar,
  ChevronRight,
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
import type { AgencyReport } from '@/data/mock-agency-reports'
import type { ImportedColumn } from '@/lib/imported-columns'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { getImportedColumns } from '@/lib/imported-columns'
import { getStudentGradeCounts } from '@/data/mock-reports'
import {
  AGENCY_TEMPLATES,
  getAgencyReportsByStudent,
} from '@/data/mock-agency-reports'
import { AgencyLogo } from '@/components/agency-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { InterventionBanner } from '@/components/students/intervention-banner'
import { StudentRiver } from '@/components/hdp/student-river'
import { CURRENT_TEACHER } from '@/data/hdp'
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
    <section id={id} className="scroll-mt-24 rounded-3xl border bg-card p-6">
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

// Source/date-period tooltip shown 4px above a field label when the user
// hovers the info icon. Renders the dark popup defined by TooltipContent.
function FieldTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex shrink-0" />}>
        <Info className="h-3.5 w-3.5 text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={4}
        className="max-w-xs whitespace-pre-line"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  )
}

function Field({ label, value, tooltip, description, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <dt className="flex items-center gap-1 text-sm text-muted-foreground">
        {label}
        {tooltip && <FieldTooltip text={tooltip} />}
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
        {tooltip && <FieldTooltip text={tooltip} />}
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
          <FieldTooltip text={tooltip} />
        </dt>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        <dd className="flex items-center gap-1 text-sm font-medium">
          <span className="min-w-0">{value ?? '-'}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </dd>

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
          MSF via Uplift Office • As of 19 Jan 2026
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
                  {`Social Service Offices (SSOs) nearest to student's residential address. MSF via Uplift Office • As of 19 Jan 2026`}
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
          MSF via Uplift Office • As of 19 Jan 2026
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
                  {`Social Service Offices (SSOs) nearest to student's residential address. MSF via Uplift Office • As of 19 Jan 2026`}
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

// Default fields shown in the Others section when the Import Data flag is on
// but no columns have been imported yet. Mirrors the wizard's incoming fields.
const DEFAULT_OTHERS_COLUMNS: Array<ImportedColumn> = [
  { id: 'via_missed', label: 'VIA missed' },
  { id: 'next_steps', label: 'Next steps' },
  { id: 'teacher_remarks', label: "Teacher's remarks" },
]

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

const AGENCY_STATUS_CONFIG: Record<
  AgencyReport['status'],
  { label: string; className: string }
> = {
  draft: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground hover:bg-muted',
  },
  pending_review: {
    label: 'In Review',
    className: 'bg-amber-3 text-amber-11 hover:bg-amber-3',
  },
  edits_requested: {
    label: 'Edits Requested',
    className: 'bg-orange-3 text-orange-11 hover:bg-orange-3',
  },
  approved: {
    label: 'Approved',
    className: 'bg-lime-3 text-lime-11 hover:bg-lime-3',
  },
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
  // Deadlines removed from the agency-report flow entirely.

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
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [academicAnalyticsOpen, setAcademicAnalyticsOpen] = useState(false)
  const [primaryContactOpen, setPrimaryContactOpen] = useState(false)
  const { isEnabled } = useFeatureFlags()

  const agencyReportsEnabled = useFeatureFlag('agency-reports')
  const reportGenerationEnabled = useFeatureFlag('report-generation')
  const studentAnalyticsEnabled = useFeatureFlag('student-analytics')
  const studentAnalyticsBasicEnabled = useFeatureFlag('student-analytics-basic')
  const msfUpliftEnabled = useFeatureFlag('msf-uplift-data')
  const importDataEnabled = useFeatureFlag('import-data')
  const overallPercentageEnabled = useFeatureFlag('overall-percentage')
  const socialLinksEnabled = useFeatureFlag('social-links')
  const primaryContactEnabled = useFeatureFlag('primary-contact')
  const reportsHdpEnabled = useFeatureFlag('reports-hdp')
  const reportsRiverVisibilityEnabled = useFeatureFlag(
    'reports-river-visibility',
  )
  // Default "Student Insights" view — applies when both analytics flags are off
  const isStudentInsightsView =
    !studentAnalyticsEnabled && !studentAnalyticsBasicEnabled
  const savedImportedColumns = useMemo(() => getImportedColumns(), [])
  // The Others section surfaces fields imported without a category tag. Its
  // visibility is gated entirely on the Import Data flag — when the flag is
  // off the section is hidden even if columns were imported in this browser
  // previously. When on, it shows the saved imported columns (falling back to
  // the default uncategorised fields when nothing has been imported yet).
  const importedColumns =
    savedImportedColumns.length > 0
      ? savedImportedColumns
      : DEFAULT_OTHERS_COLUMNS
  const showOthers = importDataEnabled

  const gradeCounts = getStudentGradeCounts(student)
  const agencyReports = getAgencyReportsByStudent(student.id)

  const fasField = (
    <Field label="FAS" value={student.fas || '-'} tooltip="School Cockpit" />
  )
  const custodyField = (
    <Field
      label="Custody"
      value={student.custody || 'Mother (Sole custody with care and control)'}
      tooltip="School Cockpit"
    />
  )
  const housingField = (
    <Field
      label="Housing"
      value={student.housing || '-'}
      tooltip="School Cockpit"
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
      tooltip="School Cockpit"
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
        tooltip="School Cockpit"
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
        tooltip="School Cockpit"
      />
    )

  // Per-CCA attendance, alphabetically ordered. Falls back to the single-CCA
  // value for students without explicit per-CCA details.
  const ccaAttendance = (
    student.ccaDetails ?? [
      { name: student.cca, attendance: 100 - student.ccaMissed * 5 },
    ]
  )
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
  const primaryCca = ccaAttendance[0]
  const extraCcaCount = ccaAttendance.length - 1

  // Single field always. With more than one CCA, show the first plus a "+N"
  // affordance that opens a side sheet listing every CCA's attendance.
  const ccaAttendanceField =
    extraCcaCount > 0 ? (
      <FieldWithDetails
        label="CCA attendance (%)"
        value={
          <>
            {primaryCca.attendance}%{' '}
            <span className="font-normal text-muted-foreground">
              ({primaryCca.name})
            </span>{' '}
            <span className="font-normal text-muted-foreground">
              + {extraCcaCount} more
            </span>
          </>
        }
        tooltip="School Cockpit • Term 2, 2026"
        sideSheetTitle="CCA attendance (%)"
        sideSheetContent={
          <div>
            <p className="mb-2 text-sm font-medium">CCA attendance (%)</p>
            <div className="rounded-lg bg-muted px-4 py-3">
              <ul className="space-y-1 text-sm">
                {ccaAttendance.map((item) => (
                  <li key={item.name} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                    {item.name}: {item.attendance}%
                  </li>
                ))}
              </ul>
            </div>
          </div>
        }
      />
    ) : (
      <Field
        label="CCA attendance (%)"
        value={
          <>
            {primaryCca.attendance}%{' '}
            <span className="font-normal text-muted-foreground">
              ({primaryCca.name})
            </span>
          </>
        }
        tooltip="School Cockpit • Term 2, 2026"
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
    // Reports jump-to link: on whenever ANY report surface is active.
    // Report Generation on its own is enough — regardless of any other
    // flag combination — so the YH can always reach the flow.
    ...(agencyReportsEnabled || reportGenerationEnabled
      ? [{ id: 'reports', label: 'Reports' }]
      : []),
    ...(showOthers ? [{ id: 'others', label: 'Others' }] : []),
  ]

  return (
    <div className="flex gap-8">
      <div className="min-w-0 flex-1 space-y-6">
        {/* Header Controls */}
        {headerControls}

        {/* Student Header Card */}
        <div className="flex items-center gap-4 rounded-3xl border bg-card p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{student.name}</h1>
            <p className="text-muted-foreground">
              Class {student.class} · {student.cca}
            </p>
          </div>
          {primaryContactEnabled && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-sm"
              onClick={() => setPrimaryContactOpen(true)}
            >
              <Phone className="h-3.5 w-3.5" />
              Primary contact
            </Button>
          )}
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

        {/* Overview Cards — only shown when Student Analytics is enabled */}
        {studentAnalyticsEnabled && <StudentOverviewCards student={student} />}

        {/* Criteria details (only when an applied profile group matches) */}
        <ProfileCriteriaDetailsCard student={student} />

        {/* Attendance Section */}
        {(!msfUpliftEnabled || !isStudentInsightsView) && (
          <Section
            id="attendance"
            title="Attendance"
            icon={<Calendar className="h-5 w-5" />}
            iconClassName="bg-amber-3 text-amber-11"
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
                tooltip="School Cockpit • Term 2, 2026"
              />
              <Field
                label="Non-VR absences (days)"
                value={student.absences}
                tooltip="School Cockpit • Term 2, 2026"
              />
              <Field
                label="Private VR absences (days)"
                value={student.privateVrAbsences}
                tooltip="School Cockpit • Term 2, 2026"
              />
              <Field
                label="Late-coming (days)"
                value={student.lateComing}
                tooltip="School Cockpit • Term 2, 2026"
              />
              <Field
                label="MC absences (days)"
                value={student.mcAbsences}
                tooltip="School Cockpit • Term 2, 2026"
              />
              {ccaAttendanceField}
            </dl>

            {analyticsOpen && <AttendanceAnalytics student={student} />}

            {!isStudentInsightsView && (
              <div className="mt-4">
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-twblue-11"
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
          iconClassName="bg-twblue-3 text-twblue-11"
        >
          <dl className="grid grid-cols-3 gap-x-8 gap-y-4">
            {/* In the Uplift default view the standalone Attendance section is
                hidden, so surface its core attendance metrics here. When
                Student Analytics is on, the Attendance section renders on its
                own and these are intentionally omitted to avoid duplication. */}
            {msfUpliftEnabled && isStudentInsightsView && (
              <>
                <Field
                  label="Attendance (%)"
                  value={
                    student.totalSchoolDays > 0
                      ? Math.round(
                          (student.daysPresent / student.totalSchoolDays) * 100,
                        )
                      : 0
                  }
                  tooltip="School Cockpit • Term 2, 2026"
                />
                <Field
                  label="Non-VR absences (days)"
                  value={student.absences}
                  tooltip="School Cockpit • Term 2, 2026"
                />
                <Field
                  label="Private VR absences (days)"
                  value={student.privateVrAbsences}
                  tooltip="School Cockpit • Term 2, 2026"
                />
                <Field
                  label="Late-coming (days)"
                  value={student.lateComing}
                  tooltip="School Cockpit • Term 2, 2026"
                />
                <Field
                  label="MC absences (days)"
                  value={student.mcAbsences}
                  tooltip="School Cockpit • Term 2, 2026"
                />
                {ccaAttendanceField}
              </>
            )}
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
              tooltip="School Cockpit • Term 2, 2026"
            />
            <FieldWithDetails
              label="Offences"
              value={student.offences}
              tooltip="School Cockpit • All records"
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
              label="Counselling"
              value={student.counsellingSessions}
              tooltip="School Cockpit • All records"
              sideSheetTitle="Counselling"
              sideSheetContent={
                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-sm font-medium">Counselling</p>
                    <div className="rounded-lg bg-muted px-4 py-3">
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                          {student.counsellingSessions}
                        </li>
                      </ul>
                    </div>
                  </div>
                  {student.counsellingComplexity && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Remarks</p>
                      <div className="rounded-lg bg-muted px-4 py-3">
                        <ul className="space-y-1.5 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                            <span>
                              {student.counsellingComplexity === 'Complex cases'
                                ? 'Physical Bullying (aggressor) x 1 (latest 15 Aug 2026)'
                                : 'Disruptive Behaviour x 1 (latest 2 Aug 2025)'}
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              }
            />
            <Field
              label="Special Educational Needs (SEN)"
              value={student.sen || '-'}
              tooltip="School Cockpit"
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
          iconClassName="bg-crimson-3 text-crimson-11"
        >
          {(() => {
            const socialLinks = socialLinksEnabled ? (
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
            ) : null
            const riskIndicators = (
              <FieldWithDetails
                label="TCI risk indicators"
                value={`${student.riskIndicators} of 5 indicators`}
                tooltip="Termly Check-in Survey • Term 2, 2026"
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
                tooltip="Termly Check-in Survey • within past 4 terms"
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
          iconClassName="bg-twblue-3 text-twblue-11"
        >
          <dl className="grid grid-cols-3 gap-x-8 gap-y-4">
            {overallPercentageEnabled && (
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
                          <p className="font-medium mb-1.5">
                            Selected subjects
                          </p>
                          <ul className="space-y-1.5">
                            {SUBJECT_COMPUTATION.map((item, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                                {item.subject} - {item.band} ({item.percentage}
                                %)
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />
            )}

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
              tooltip="School Cockpit"
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
                className="h-auto p-0 text-twblue-11"
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
          iconClassName="bg-lime-3 text-lime-11"
        >
          <dl className="grid grid-cols-3 gap-x-8 gap-y-4">
            {msfUpliftEnabled ? (
              <>
                {primaryContactEnabled && primaryContactField}
                {custodyField}
                {(() => {
                  const consideringDivorce =
                    student.parentsConsideringDivorce ?? 'No'
                  const consideringDivorceTooltip = `"Yes" indicates that at least one parent is enrolled in the Mandatory Co-Parenting Programme (CPP). All parents with children below 21 years old are required to attend the CPP before filing for divorce. Under the CPP, parents receive support from counsellors to help them make informed decisions that prioritise the well-being of their children, such as working out co-parenting arrangements arising from a divorce.`
                  return (
                    <FieldWithDetails
                      label="Parent enrolled in CPP"
                      tooltip="MSF via Uplift Office • as of 19 Jan 2026"
                      description="MSF via Uplift Office • 19 Jan 2026"
                      value={consideringDivorce}
                      sideSheetTitle="Parent enrolled in CPP"
                      sideSheetContent={
                        <MsfUpliftSheetContent
                          title="Parent enrolled in CPP"
                          value={consideringDivorce}
                          titleTooltip={consideringDivorceTooltip}
                        />
                      }
                    />
                  )
                })()}
                {(() => {
                  const nonIntact = student.nonIntactFamily ?? 'None'
                  return (
                    <FieldWithDetails
                      label="Parents are divorced"
                      tooltip="MSF via Uplift Office • as of 19 Jan 2026"
                      description="MSF via Uplift Office • 19 Jan 2026"
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
                      tooltip="MSF via Uplift Office • as of 19 Jan 2026"
                      description="MSF via Uplift Office • 19 Jan 2026"
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
                    fsc === 'Yes' ? 'Yes by Fei Yue FSC (Choa Chu Kang)' : fsc
                  return (
                    <FieldWithDetails
                      label="Supported by FSC"
                      tooltip="MSF via Uplift Office • as of 19 Jan 2026"
                      description="MSF via Uplift Office • 19 Jan 2026"
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
                {primaryContactEnabled && primaryContactField}
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
            iconClassName="bg-violet-3 text-violet-11"
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

        {/* Reports Section — the legacy Holistic Development Reports list
            was torn down (plan 034); this is now the Agency Reports
            surface, shown whenever `agencyReportsEnabled` or
            `reportGenerationEnabled` is on. */}
        {(agencyReportsEnabled || reportGenerationEnabled) && (
          <Section
            id="reports"
            title="Reports"
            icon={<FileText className="h-5 w-5" />}
            iconClassName="bg-crimson-3 text-crimson-11"
          >
            <div>
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
          </Section>
        )}
        {/* Observations Section — the HDP river, same Section + flag-gate
            pattern as Reports above (plan 030). */}
        {reportsHdpEnabled && (
          <Section
            id="observations"
            title="Observations"
            icon={<Eye className="h-5 w-5" />}
            iconClassName="bg-orange-3 text-orange-11"
          >
            <StudentRiver
              studentId={student.id}
              viewerId={CURRENT_TEACHER.id}
              fullRiver={reportsRiverVisibilityEnabled}
              embedded
            />
          </Section>
        )}
        {/* Others Section — imported fields */}
        {showOthers && (
          <Section
            id="others"
            title="Others"
            icon={<LayoutGrid className="h-5 w-5" />}
            iconClassName="bg-muted text-muted-foreground"
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
    </div>
  )
}
