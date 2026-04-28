import { useState } from 'react'
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
import type { Student } from '@/types/student'
import type { HolisticReport, ReviewStatus, Term } from '@/types/report'
import type { AgencyReport } from '@/data/mock-agency-reports'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import {
  TERMS,
  filterReports,
  getStudentGradeCounts,
} from '@/data/mock-reports'
import {
  AGENCY_TEMPLATES,
  getAgencyReportsByStudent,
} from '@/data/mock-agency-reports'
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
  className?: string
}

function Field({ label, value, tooltip, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <dt className="flex items-center gap-1 text-sm text-muted-foreground">
        {label}
        {tooltip && <Info className="h-3.5 w-3.5 shrink-0" />}
      </dt>
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
  sideSheetTitle: string
  sideSheetContent: React.ReactNode
  className?: string
}

function FieldWithDetails({
  label,
  value,
  tooltip,
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
          className="sm:max-w-xs"
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
    label: 'Pending Review',
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
  const status = report.status
  const { label, className } = AGENCY_STATUS_CONFIG[status]
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
      const due = addBusinessDaysSimple(report.startedAt, tpl.turnaroundDays)
      const today = new Date(2026, 3, 21) // Apr 21 2026
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
  const isClickable =
    status === 'draft' ||
    status === 'edits_requested' ||
    status === 'approved'

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
  }

  const titleContent = (
    <>
      <p className="text-sm font-medium truncate">{report.templateName}</p>
      <p className="text-xs text-muted-foreground truncate">
        {report.agency} · {createdDate}
      </p>
      {completionSummary && completionSummary.awaiting.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground truncate">
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
              'flex items-center gap-1 text-xs font-medium',
              dueClass,
            )}
          >
            <Clock className="h-3 w-3" />
            {dueLabel}
          </span>
        )}
        <Badge className={className}>{label}</Badge>
        {report.passwordSaved && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowPw((p) => !p)
            }}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
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

function formatTermList(terms: Array<string>): string {
  if (terms.length === 0) return 'None'
  const sorted = [...terms].sort(
    (a, b) =>
      parseInt(b.replace('Term ', '')) - parseInt(a.replace('Term ', '')),
  )
  return sorted.join(', ')
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

  const gradeCounts = getStudentGradeCounts(student)
  const studentReports = filterReports({ studentId: student.id })
  const existingTerms = new Set(studentReports.map((r) => r.term))
  const missingTerms = TERMS.filter((t): t is Term => !existingTerms.has(t))
  const agencyReports = getAgencyReportsByStudent(student.id)

  const sections = [
    { id: 'attendance', label: 'Attendance' },
    { id: 'behaviour', label: 'Behaviour' },
    { id: 'wellbeing', label: 'Wellbeing' },
    { id: 'academic', label: 'Academic' },
    { id: 'family', label: 'Family' },
    { id: 'personal', label: 'Personal' },
    ...(holisticReportsEnabled ? [{ id: 'reports', label: 'Reports' }] : []),
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
            className="sm:max-w-xs"
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

        {/* Attendance Section */}
        <Section
          id="attendance"
          title="Attendance"
          icon={<Calendar className="h-5 w-5" />}
          iconClassName="bg-yellow-100 text-yellow-600"
        >
          <dl className="grid grid-cols-3 gap-x-8 gap-y-4">
            <Field
              label="Attendance(%)"
              value={
                student.totalSchoolDays > 0
                  ? Math.round(
                      (student.daysPresent / student.totalSchoolDays) * 100,
                    )
                  : 0
              }
            />
            <Field label="Late-coming(%)" value={student.lateComing} />
            <Field label="Non-VR absences(%)" value={student.absences} />
            <Field
              label="CCA attendance(%)"
              value={`${100 - student.ccaMissed * 5}`}
            />
          </dl>

          {analyticsOpen && <AttendanceAnalytics />}

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
        </Section>

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
            <Field label="Conduct grade" value={student.conduct} />
          </dl>

          <div className="mt-6 space-y-4 border-t pt-4">
            <RemarksField
              label="Teacher's remarks"
              value={student.teacherObservations}
            />
            <RemarksField label="Next steps" value={student.nextSteps} />
          </div>
        </Section>

        {/* Wellbeing Section */}
        <Section
          id="wellbeing"
          title="Wellbeing"
          icon={<Heart className="h-5 w-5" />}
          iconClassName="bg-pink-100 text-pink-600"
        >
          <dl className="grid grid-cols-3 gap-x-8 gap-y-4">
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
                        {student.selectedBy && student.selectedBy.length > 0 ? (
                          <ul className="space-y-1.5">
                            {student.selectedBy.map((person, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                                {person.name} ({person.class}, closeness rating:{' '}
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
                                {person.name} ({person.class}, closeness rating:{' '}
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
            <FieldWithDetails
              label="Risk indicators"
              value={student.riskIndicators}
              tooltip="Risk indicators from TCI survey"
              sideSheetTitle="Risk indicators"
              sideSheetContent={
                <div className="space-y-5">
                  <div>
                    <p className="mb-1 text-sm font-medium">Risk indicators</p>
                    <p className="mb-2 text-xs text-muted-foreground">
                      No. of risk indicators flagged in the latest Termly
                      Check-In Survey (All Ears)
                    </p>
                    <div className="rounded-lg bg-muted px-4 py-3">
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                          {student.riskIndicators}
                        </li>
                      </ul>
                    </div>
                  </div>
                  {student.riskIndicatorHistory &&
                    student.riskIndicatorHistory.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-medium">Remarks</p>
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
            <FieldWithDetails
              label="Low mood flagged 2+ terms"
              value={student.lowMoodFlagged || 'No'}
              tooltip="Flagged for persistent low mood"
              sideSheetTitle="Low mood flagged 2+ terms"
              sideSheetContent={
                <div className="space-y-5">
                  <div>
                    <p className="mb-1 text-sm font-medium">
                      Low mood flagged 2+ terms
                    </p>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Flagged in at least 2 terms in the past year, based on
                      Termly Check-In Survey (All Ears).
                    </p>
                    <div className="rounded-lg bg-muted px-4 py-3">
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                          {student.lowMoodFlagged || 'No'}
                        </li>
                      </ul>
                    </div>
                  </div>
                  {student.lowMoodTerms && student.lowMoodTerms.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Remarks</p>
                      <div className="rounded-lg bg-muted px-4 py-3">
                        <ul className="space-y-1.5 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                            {formatTermList(student.lowMoodTerms)}
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              }
            />
          </dl>
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
            <Field label="Approved MTL" value={student.approvedMtl || '-'} />
            <Field
              label="Learning support"
              value={student.learningSupport || '-'}
            />
            <Field
              label="Post-sec eligibility"
              value={student.postSecEligibility || '-'}
            />
          </dl>

          {academicAnalyticsOpen && <AcademicAnalytics />}

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
        </Section>

        {/* Family Section */}
        <Section
          id="family"
          title="Family"
          icon={<Home className="h-5 w-5" />}
          iconClassName="bg-green-100 text-green-600"
        >
          <dl className="grid grid-cols-3 gap-x-8 gap-y-4">
            <Field label="FAS" value={student.fas || '-'} />
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
                    </div>
                  </div>
                </div>
              }
            />
            <Field
              label="Housing ownership"
              value={
                student.housingType === 'Rented'
                  ? 'Rented'
                  : student.housingType === 'Owned'
                    ? 'Owned'
                    : '-'
              }
            />
            <Field label="Custody" value={student.custody || '-'} />
            <Field
              label="Commuter status"
              value={student.commuterStatus || 'Non-commuter'}
            />
            <Field
              label="After-school arrangement"
              value={student.afterSchoolArrangement || 'No arrangement'}
            />
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
            {student.siblingDetails && student.siblingDetails.length > 0 ? (
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
                        {student.siblingDetails.map((s, i) => (
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
                        ))}
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
            )}
          </dl>
        </Section>

        {/* Personal Section */}
        <Section
          id="personal"
          title="Personal"
          icon={<Languages className="h-5 w-5" />}
          iconClassName="bg-purple-100 text-purple-600"
        >
          <dl className="grid grid-cols-3 gap-x-8 gap-y-4">
            <Field label="Health alerts" value="1 from Parent, 1 from SHS" />
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

        {/* Reports Section */}
        {holisticReportsEnabled && (
          <Section
            id="reports"
            title="Reports"
            icon={<FileText className="h-5 w-5" />}
            iconClassName="bg-red-100 text-red-600"
            headerRight={
              studentReports.length > 0 ? (
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
            {studentReports.length > 0 ? (
              <div className="space-y-2">
                {studentReports
                  .sort((a, b) => TERMS.indexOf(a.term) - TERMS.indexOf(b.term))
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
                  <p className="text-sm font-medium">No reports generated</p>
                  <p className="text-xs text-muted-foreground">
                    Generate a Holistic Development Report for this student
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

            {/* Agency Reports subsection */}
            {agencyReportsEnabled && (
              <div className="mt-6 border-t pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Agency Reports
                </p>
                {agencyReports.length > 0 ? (
                  <div className="mb-3 space-y-2">
                    {agencyReports.map((report) => (
                      <AgencyReportRow key={report.id} report={report} />
                    ))}
                  </div>
                ) : (
                  <p className="mb-3 text-xs text-muted-foreground">
                    No agency reports yet.
                  </p>
                )}
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
              </div>
            )}
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
