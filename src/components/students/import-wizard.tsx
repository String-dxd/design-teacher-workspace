import React, { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  ChevronDown,
  ExternalLink,
  List,
  MessageSquareText,
  Plus,
  Settings2,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react'

import { toast } from 'sonner'

import type { ColumnConfig } from './column-visibility-popover'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

// ─── Mock data ──────────────────────────────────────────────────────────────

const INCOMING_FIELDS = [
  { id: 'via_missed', name: 'VIA missed' },
  { id: 'next_steps', name: 'Next steps' },
  { id: 'teacher_remarks', name: "Teacher's remarks" },
]

const MOCK_MANY_FIELDS_BY_CATEGORY: Record<string, Array<string>> = {
  Others: [
    'Math Score',
    'Science Score',
    'English Score',
    'Mother Tongue Score',
    'Humanities Score',
    'Overall GPA',
    'Next steps',
    'Parent contact notes',
    'Counsellor notes',
  ],
  Attendance: [
    'VIA missed',
    'Days absent',
    'Late arrivals',
    'Medical leave',
    'Excused absences',
  ],
  Behaviour: [
    "Teacher's remarks",
    'Conduct grade',
    'Detention records',
    'Commendations',
  ],
  CCA: ['CCA name', 'CCA attendance', 'CCA achievement level'],
}

const MOCK_REVIEW_ROWS = [
  {
    row: 1,
    name: 'Chan Jun Kai',
    class: '3A',
    viaMissed: '2',
    nextSteps: 'Schedule a one-on-one session',
    teacherRemarks:
      'Absent for 3 consecutive VIA sessions without valid reason',
  },
  {
    row: 2,
    name: 'Vincent Koh Kin Yi',
    class: '3A',
    viaMissed: '3',
    nextSteps: 'Watch the recorded session',
    teacherRemarks: 'No visible effort to make up missed sessions',
  },
  {
    row: 3,
    name: 'Lam Wei Jie',
    class: '3A',
    viaMissed: '7',
    nextSteps: 'Join the upcoming cohort',
    teacherRemarks: 'Missing most sessions, needs immediate intervention',
  },
  {
    row: 4,
    name: 'Sarah Chan Jun Kai',
    class: '3A',
    viaMissed: '5',
    nextSteps: 'Review the VIA schedule',
    teacherRemarks: 'Absent without prior notice on multiple occasions',
  },
  {
    row: 5,
    name: 'Kenneth Koh Kin Yi',
    class: '3A',
    viaMissed: '6',
    nextSteps: 'Attend the supplementary class',
    teacherRemarks: 'No sign of engagement in VIA activities this term',
  },
  {
    row: 6,
    name: 'Liang Mei Jie',
    class: '3A',
    viaMissed: '1',
    nextSteps: 'Complete an online module',
    teacherRemarks: 'Medical leave accounted for; follow up on make-up session',
  },
  {
    row: 7,
    name: 'Diana Tan Hui Lin',
    class: '3A',
    viaMissed: '5',
    nextSteps: 'Arrange a peer tutoring session',
    teacherRemarks: 'No valid reasons provided for absences',
  },
  {
    row: 8,
    name: 'Samuel Tan Jun Kai',
    class: '3A',
    viaMissed: '3',
    nextSteps: 'Participate in a future cohort',
    teacherRemarks: 'Missing sessions due to CCA clashes; monitor closely',
  },
  {
    row: 9,
    name: 'Priya Nair',
    class: '3A',
    viaMissed: '2',
    nextSteps: 'Submit a set of reflection notes',
    teacherRemarks: 'Absent on days with no prior communication',
  },
  {
    row: 10,
    name: 'Ethan Ong Wei Ming',
    class: '3A',
    viaMissed: '1',
    nextSteps: 'Access additional resources',
    teacherRemarks: 'Absent once; parent informed and acknowledged',
  },
]

const REVIEW_ISSUES = [
  {
    id: 'not-found',
    title: 'Names not found in MOE records',
    description: 'Check names match the School Cockpit format.',
    ref: 'Row 5, 6, 8',
    highlightRows: [5, 6, 8],
  },
  {
    id: 'duplicate',
    title: 'Duplicate records',
    description: 'Remove repeated records',
    ref: 'Row 3 and 100, 5 and 8',
    highlightRows: [3, 5, 8],
  },
  {
    id: 'same-name-class',
    title: 'Same name and class',
    description:
      'If these are different students, add their NRIC in a separate column',
    ref: 'Row 2 and 3',
    highlightRows: [2, 3],
  },
  {
    id: 'dup-cols',
    title: 'Duplicate columns',
    description: 'Remove or rename repeated columns',
    ref: 'Column 0 and H, I and J',
    highlightRows: [],
  },
  {
    id: 'col-exists',
    title: 'Column header already exist',
    description: 'Rename the column',
    ref: 'Column F',
    highlightRows: [],
  },
]

const DEFAULT_CATEGORIES = [
  'Academics',
  'Attendance',
  'Behaviour',
  'Wellbeing',
  'Family',
  'Personal',
]

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Academics: 'Overall percentage, Learning support...',
  Attendance: 'Attendance, Late-coming...',
  Behaviour: 'Conduct grade, Offences...',
  Wellbeing: 'Social links, Low mood...',
  Family: 'Housing, FAS...',
  Personal: 'Health alerts, Citizenship...',
}

const EXISTING_FIELDS_MAP: Record<string, Array<string>> = {
  Academics: [
    'Overall % across selected subjects',
    'No. of subjects',
    'Learning support',
  ],
  Attendance: ['Attendance(%)', 'Late-coming(%)', 'Non-VR absences(%)'],
  Behaviour: ['Offences', 'Counselling cases', 'Conduct grade'],
  Wellbeing: ['Social links', 'Risk indicators', 'Low mood flagged 2+ terms'],
  Family: ['FAS', 'Housing', 'Custody'],
  Personal: ['Health alerts', 'Citizenship', 'Language spoken'],
}

const STEP1_UPLOAD_ERRORS = [
  'File cannot be processed for security reasons',
  'Unsupported file format. Upload a .xlsx, .xls, or .xls file',
  'File has more than 1,000 columns',
  'First row must contain headers',
  'File must include a "Name" column matching the format used in School Cockpit',
  'Missing headers for column 0 and V',
]

// ─── Types ──────────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3 | 4

interface FieldState {
  // 'unset' | 'selected' | 'skipped' | 'creating'
  mode: 'unset' | 'selected' | 'skipped' | 'creating'
  selected: string | null
  newValue: string
  newError: string
}

function makeFieldState(): FieldState {
  return { mode: 'unset', selected: null, newValue: '', newError: '' }
}

// ─── Wizard stepper ──────────────────────────────────────────────────────────

const WIZARD_STEPS = ['Upload', 'Review', 'Organise'] as const

function WizardStepper({ current }: { current: number }) {
  return (
    <div className="flex h-fit items-center">
      {WIZARD_STEPS.map((label, i) => {
        const stepNum = i + 1
        const isActive = stepNum === current
        const isCompleted = stepNum < current
        const isDimmed = stepNum > current

        return (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white transition-colors',
                  (isActive || isCompleted) &&
                    'bg-[var(--color-twblue-9,#0064ff)]',
                  isDimmed && 'bg-[var(--btn-color-fill-disabled,#b9bbc6)]',
                )}
              >
                {isCompleted ? (
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                ) : (
                  <span className="text-[11px]">{stepNum}</span>
                )}
              </div>
              <span
                className={cn(
                  'hidden text-sm min-[562px]:inline',
                  (isActive || isCompleted) &&
                    'text-[var(--color-slate-12,#1c2024)]',
                  isDimmed &&
                    'text-[var(--btn-color-foreground-disabled,#b9bbc6)]',
                )}
              >
                {label}
              </span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <Separator className="mx-2 data-[orientation=horizontal]:w-[16px] min-[562px]:mx-3 min-[562px]:data-[orientation=horizontal]:w-[24px]" />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── DropZone ───────────────────────────────────────────────────────────────

function DropZone({
  onFileAccepted,
  className,
}: {
  onFileAccepted: (file: File) => void
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFileAccepted(file)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex h-full min-h-[320px] w-full cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed transition-colors',
        className,
        isDragging
          ? 'border-blue-400 bg-blue-100/60'
          : 'border-blue-300 bg-blue-50/60 hover:border-blue-400 hover:bg-blue-50',
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
        <Upload className="h-5 w-5 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-800">
          Drop your files here or{' '}
          <span className="text-primary underline underline-offset-2">
            browse
          </span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Supported file types: .csv, .xls, .xlsx
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xls,.xlsx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFileAccepted(file)
        }}
      />
    </div>
  )
}

// ─── Step 1 ─────────────────────────────────────────────────────────────────

function Step1({
  hasError,
  onFileAccepted,
}: {
  hasError: boolean
  onFileAccepted: (file: File) => void
}) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="px-8 pb-6 pt-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Upload student data
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Add your own data for a more complete student view
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-6 px-8 pb-8 sm:flex-row">
        {/* Left panel — second on mobile, first on desktop */}
        <div className="order-2 flex shrink-0 flex-col gap-4 sm:order-1 sm:w-[340px]">
          {hasError && (
            <Alert className="rounded-3xl border-[var(--slate-6)] bg-white [&>svg]:text-[var(--crimson-11)]">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-semibold text-[var(--crimson-11)]">
                File upload failed
              </AlertTitle>
              <AlertDescription className="text-[var(--slate-12)]">
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {STEP1_UPLOAD_ERRORS.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          {/* Prepare your file */}
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4">
            <p className="mb-3 text-base font-semibold text-slate-600">
              Prepare your file
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <Check className="h-4 w-4 shrink-0 text-slate-400" />
                <span>
                  Use the{' '}
                  <a className="cursor-pointer text-twblue-9 underline underline-offset-2">
                    template
                  </a>
                  , or check your{' '}
                  <a className="cursor-pointer text-twblue-9 underline underline-offset-2">
                    file is ready
                  </a>
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <Check className="h-4 w-4 shrink-0 text-slate-400" />
                File is a spreadsheet (.csv, .xls, .xlsx)
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600">
                <Check className="h-4 w-4 shrink-0 text-slate-400" />
                File is not password-protected
              </li>
            </ul>
            <div className="mt-4 flex items-center gap-2 border-t border-[var(--color-slate-4)] pt-3">
              <ShieldCheck className="h-4 w-4 shrink-0 text-slate-400" />
              <p className="text-sm text-slate-400">
                We'll check your file before importing
              </p>
            </div>
          </div>

          {/* Required columns */}
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4">
            <p className="mb-3 text-base font-semibold text-slate-600">
              Required columns
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    Name and Class
                  </p>
                  <p className="text-xs text-slate-500">
                    As shown in School Cockpit
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    Or NRIC
                  </p>
                  <p className="text-xs text-slate-500">
                    As shown in School Cockpit
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Frequently uploaded */}
          <div className="px-2">
            <p className="mb-3 text-sm text-slate-500">Frequently uploaded</p>
            <ul className="space-y-2">
              {[
                {
                  icon: MessageSquareText,
                  label: "Teacher's remarks",
                  desc: 'Observations and interactions',
                },
                {
                  icon: List,
                  label: 'Follow-up notes',
                  desc: 'Next steps and actions',
                },
                {
                  icon: Award,
                  label: 'Awards and enrichment',
                  desc: 'Programmes, enrichment activities, awards',
                },
              ].map(({ icon: Icon, label, desc }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-2xl bg-slate-100 p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200">
                    <Icon className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">
                      {label}
                    </p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right panel — first on mobile (above left), second on desktop */}
        <div className="order-1 flex flex-1 flex-col sm:order-2 py-3 sm:py-0">
          <DropZone
            onFileAccepted={onFileAccepted}
            className="min-h-0 h-[132px] sm:h-full sm:min-h-[320px]"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Step 2 ─────────────────────────────────────────────────────────────────

function Step2({
  hasIssues,
  onBack,
  onNext,
}: {
  hasIssues: boolean
  onBack: () => void
  onNext: () => void
}) {
  const issueRows = new Set(REVIEW_ISSUES.flatMap((i) => i.highlightRows))

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 pb-2 pt-8">
          <h1 className="text-2xl font-semibold text-slate-900">Review</h1>
          <Badge
            variant="outline"
            className="mt-6 border-transparent bg-[var(--color-slate-3)] text-[var(--color-slate-11)] text-sm"
          >
            1023 records, 5 columns
          </Badge>
        </div>

        <div className="flex flex-col gap-4 px-8 pb-6 sm:flex-row sm:items-start">
          {/* Table — second on mobile, first on desktop */}
          <div className="order-2 flex min-w-0 flex-1 flex-col gap-2 sm:order-1">
            <div className="overflow-hidden rounded-2xl border bg-white">
              <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:border-t [&::-webkit-scrollbar]:border-[var(--color-slate-6)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--color-slate-5)] [&::-webkit-scrollbar-track]:ml-4 [&::-webkit-scrollbar-track]:mr-4 [&::-webkit-scrollbar-track]:rounded-full">
                <Table>
                  <TableHeader className="bg-[var(--color-slate-2)]">
                    <TableRow className="hover:bg-[var(--color-slate-2)]">
                      <TableHead className="w-10 text-center text-base font-semibold text-[var(--color-slate-11)]">
                        #
                      </TableHead>
                      <TableHead className="text-base font-semibold text-[var(--color-slate-11)]">
                        Name
                      </TableHead>
                      <TableHead className="text-base font-semibold text-[var(--color-slate-11)]">
                        Class
                      </TableHead>
                      <TableHead className="text-base font-semibold text-[var(--color-slate-11)]">
                        VIA missed
                      </TableHead>
                      <TableHead className="text-base font-semibold text-[var(--color-slate-11)]">
                        Next steps
                      </TableHead>
                      <TableHead className="text-base font-semibold text-[var(--color-slate-11)]">
                        Teacher's remarks
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_REVIEW_ROWS.map((r) => (
                      <TableRow key={r.row} className="hover:bg-transparent">
                        <TableCell className="text-center text-base tabular-nums text-slate-400">
                          {r.row}
                        </TableCell>
                        <TableCell className="text-base text-slate-700">
                          {r.name}
                        </TableCell>
                        <TableCell className="text-base text-slate-500">
                          {r.class}
                        </TableCell>
                        <TableCell className="text-base text-slate-500">
                          {r.viaMissed}
                        </TableCell>
                        <TableCell className="max-w-0 text-base text-slate-500">
                          <span className="block truncate">{r.nextSteps}</span>
                        </TableCell>
                        <TableCell className="max-w-0 text-base text-slate-500">
                          <span className="block truncate">
                            {r.teacherRemarks}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <p className="text-sm text-[var(--color-slate-11)]">
              Preview of first 10 rows
            </p>
          </div>

          {/* Validation panel — first on mobile (top), second on desktop (right) */}
          <div className="order-1 w-full sm:order-2 sm:h-[620px] sm:w-[412px] sm:shrink-0">
            {hasIssues ? (
              <div className="flex flex-col rounded-2xl border bg-white px-6 py-6 sm:min-h-[620px] sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-lg font-semibold text-[var(--color-slate-11)]">
                    Few issues found
                  </p>
                  <Button size="sm" className="gap-1.5" onClick={onBack}>
                    Upload again
                    <Upload className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <ul className="flex flex-col gap-3">
                  {REVIEW_ISSUES.map((iss) => (
                    <li
                      key={iss.id}
                      className="flex items-start gap-3 rounded-xl border border-[var(--color-slate-3)] bg-slate-50 p-3"
                    >
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--crimson-11)]" />
                      <div className="flex min-w-0 flex-col gap-2">
                        <div className="flex flex-col gap-1">
                          <p className="text-base font-semibold text-[var(--crimson-11)]">
                            {iss.title}
                          </p>
                          <p className="text-sm text-slate-500">
                            {iss.description}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-transparent bg-[var(--color-slate-3)] text-[var(--color-slate-11)] text-sm"
                        >
                          {iss.ref}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[var(--radius-3xl,24px)] border border-[var(--color-slate-6)] bg-white px-6 py-6 sm:h-full sm:py-5">
                <div className="flex flex-col items-center">
                  <img
                    src="/no-issues-illustration.png"
                    alt="No issues found"
                    className="size-[200px] object-cover"
                  />
                  <div className="mt-3 flex flex-col items-center gap-3 text-center">
                    <p className="text-[23px] font-semibold leading-7 text-[var(--color-slate-12)]">
                      No issues found
                    </p>
                    <p className="text-base text-[var(--color-slate-11)]">
                      Your file is good to go!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between border-t bg-white px-8 py-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext} disabled={hasIssues} className="gap-2">
          Next
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Category select row ─────────────────────────────────────────────────────

function CategorySelectRow({
  fieldName,
  state,
  categories,
  onChange,
  onAddCategory,
}: {
  fieldName: string
  state: FieldState
  categories: Array<string>
  onChange: (next: Partial<FieldState>) => void
  onAddCategory: (name: string) => void
}) {
  const [open, setOpen] = useState(false)

  function handleConfirmNew() {
    const trimmed = state.newValue.trim()
    if (!trimmed) return
    const exists = categories.some(
      (c) => c.toLowerCase() === trimmed.toLowerCase(),
    )
    if (exists) {
      onChange({ newError: 'This section already exist' })
      return
    }
    onAddCategory(trimmed)
    onChange({
      mode: 'selected',
      selected: trimmed,
      newValue: '',
      newError: '',
    })
  }

  // "creating" mode: show inline input + confirm button
  if (state.mode === 'creating') {
    return (
      <TableRow className="hover:bg-transparent">
        <TableCell className="w-1/2 py-4 pl-5">
          <span className="text-sm font-medium text-slate-800">
            {fieldName}
          </span>
        </TableCell>
        <TableCell className="w-1/2 py-4 pr-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={state.newValue}
                placeholder="Name this section"
                onChange={(e) =>
                  onChange({ newValue: e.target.value, newError: '' })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmNew()
                  if (e.key === 'Escape')
                    onChange({ mode: 'unset', newValue: '', newError: '' })
                }}
                className={cn(
                  'h-9 flex-1 rounded-lg border bg-white px-3 text-sm outline-none transition-colors',
                  state.newError
                    ? 'border-[var(--crimson-9)] ring-1 ring-[var(--crimson-9)]'
                    : 'border-blue-400 ring-1 ring-blue-300',
                )}
              />
              <button
                type="button"
                onClick={handleConfirmNew}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:text-slate-600"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
            {state.newError && (
              <p className="text-xs text-[var(--crimson-11)]">
                {state.newError}
              </p>
            )}
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="w-1/2 py-4 pl-5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">
            {fieldName}
          </span>
          {state.mode === 'selected' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#E0F8F3] px-2 py-0.5 text-xs font-medium text-[#008573]">
              <Check className="h-3 w-3" />
              Done
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="w-1/2 py-4 pr-5">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            className={cn(
              'flex h-9 w-full items-center justify-between rounded-lg border border-[var(--color-slate-6)] px-3 text-sm',
              state.mode === 'skipped'
                ? 'bg-[var(--color-slate-2)]'
                : 'bg-white',
            )}
          >
            <span
              className={
                state.selected || state.mode === 'skipped'
                  ? 'text-[var(--color-slate-12)]'
                  : 'text-[var(--color-slate-11)]'
              }
            >
              {state.mode === 'skipped'
                ? 'Skip for now'
                : (state.selected ?? 'Select')}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-slate-11)]" />
          </PopoverTrigger>
          <PopoverContent
            className="w-[280px] rounded-3xl border-[var(--color-slate-6)] p-3 shadow-[0px_4px_6px_0px_rgba(0,0,45,0.09),0px_2px_4px_0px_rgba(0,0,45,0.09)]"
            align="start"
            sideOffset={4}
          >
            <div className="flex flex-col gap-1">
              {categories
                .slice()
                .sort()
                .map((cat) => {
                  const isSelected = state.selected === cat
                  const description = CATEGORY_DESCRIPTIONS[cat]
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        onChange({ mode: 'selected', selected: cat })
                        setOpen(false)
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-xl p-2 text-left transition-colors',
                        isSelected
                          ? 'bg-[var(--color-slate-5)]'
                          : 'hover:bg-[var(--color-slate-4)]',
                      )}
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span
                          className={cn(
                            'text-base text-[var(--color-slate-12)]',
                            isSelected && 'font-semibold',
                          )}
                        >
                          {cat}
                        </span>
                        {description && (
                          <span className="truncate text-sm text-[var(--color-slate-11)]">
                            {description}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 shrink-0 text-[var(--color-slate-11)]" />
                      )}
                    </button>
                  )
                })}

              <div className="my-1 h-px bg-[var(--color-slate-6)]" />

              <button
                type="button"
                onClick={() => {
                  onChange({ mode: 'creating', newValue: '', newError: '' })
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-xl p-2 text-left hover:bg-[var(--color-slate-4)]"
              >
                <Plus className="h-4 w-4 shrink-0 text-[var(--color-slate-12)]" />
                <span className="text-base text-[var(--color-slate-12)]">
                  Create new section
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onChange({ mode: 'skipped', selected: null })
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-xl p-2 text-left hover:bg-[var(--color-slate-4)]"
              >
                <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-slate-12)]" />
                <span className="text-base text-[var(--color-slate-12)]">
                  Skip for now
                </span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>
    </TableRow>
  )
}

// ─── Step 3 ─────────────────────────────────────────────────────────────────

function Step3({
  onBack,
  onComplete,
  onSkipAll,
}: {
  onBack: () => void
  onComplete: (mappings: Record<string, string>) => void
  onSkipAll: (mappings: Record<string, string>) => void
}) {
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>(
    () =>
      Object.fromEntries(INCOMING_FIELDS.map((f) => [f.id, makeFieldState()])),
  )
  const [categories, setCategories] =
    useState<Array<string>>(DEFAULT_CATEGORIES)

  function updateField(id: string, patch: Partial<FieldState>) {
    setFieldStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }))
  }

  function addCategory(name: string) {
    setCategories((prev) => [...prev, name])
  }

  const allResolved = INCOMING_FIELDS.every(
    (f) =>
      fieldStates[f.id].mode === 'selected' ||
      fieldStates[f.id].mode === 'skipped',
  )

  function buildMappings(): Record<string, string> {
    return Object.fromEntries(
      INCOMING_FIELDS.map((f) => {
        const s = fieldStates[f.id]
        return [
          f.id,
          s.mode === 'selected' && s.selected ? s.selected : 'Others',
        ]
      }),
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-[632px] pt-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            Choose where new fields appear
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Pick the section where each field should appear in the student
            profile
          </p>
        </div>

        {/* Hint note */}
        <div className="mx-auto mb-4 mt-12 w-[632px] border-l-2 border-slate-300 pl-3">
          <p className="text-sm text-slate-500">
            If a field fits more than one section, pick the best match. You can
            edit it later
          </p>
        </div>

        {/* Table */}
        <div className="mx-auto mb-6 w-[632px] overflow-hidden rounded-xl border bg-white">
          <Table>
            <TableHeader className="bg-[var(--color-slate-2)]">
              <TableRow className="hover:bg-[var(--color-slate-2)]">
                <TableHead className="w-1/2 pl-5 pr-0 typography-label-md-strong text-[var(--color-slate-11)]">
                  <span className="flex items-center justify-between">
                    New fields
                    <ArrowRight className="h-3.5 w-3.5 text-[var(--color-slate-9)]" />
                  </span>
                </TableHead>
                <TableHead className="w-1/2 pr-5 typography-label-md-strong text-[var(--color-slate-11)]">
                  Place under
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {INCOMING_FIELDS.map((field) => (
                <CategorySelectRow
                  key={field.id}
                  fieldName={field.name}
                  state={fieldStates[field.id]}
                  categories={categories}
                  onChange={(patch) => updateField(field.id, patch)}
                  onAddCategory={addCategory}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex shrink-0 items-center justify-between border-t bg-white px-8 py-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => onSkipAll(buildMappings())}
              >
                Skip for now
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              New fields go under "Others" for now
            </TooltipContent>
          </Tooltip>
          <Button
            onClick={() => onComplete(buildMappings())}
            disabled={!allResolved}
            className="gap-2"
          >
            Complete
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Confirmation page ───────────────────────────────────────────────────────

const CONFIRMATION_ILLUSTRATION =
  'https://www.figma.com/api/mcp/asset/81a60440-2f7c-4dce-ac01-8e5e7e8517ea'

function ConfirmationPage({
  fieldsByCategory,
  onExplore,
}: {
  fieldsByCategory: Record<string, Array<string>>
  onExplore: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const categories = Object.keys(fieldsByCategory)
  const totalFields = Object.values(fieldsByCategory).flat().length

  useEffect(() => {
    setExpanded(false)
    if (contentRef.current) {
      setOverflows(contentRef.current.scrollHeight > 238)
    }
  }, [fieldsByCategory])

  return (
    <div className="relative flex flex-1 overflow-hidden bg-[var(--color-slate-1,#fcfcfd)]">
      {/* Left: content centered vertically */}
      <div className="flex flex-1 items-start justify-end px-8">
        <div className="flex w-[412px] flex-col gap-8 pt-[140px]">
          {/* Heading */}
          <div className="flex flex-col gap-3">
            <h1 className="text-[26px] font-semibold leading-8 text-[var(--color-slate-12,#1c2024)]">
              You're all set, import done!
            </h1>
            <p className="text-lg font-semibold leading-7 text-[var(--color-twblue-9,#0064ff)]">
              1023 records updated, {totalFields} fields added
            </p>
          </div>

          {/* Category card */}
          <div
            className={cn(
              'relative overflow-hidden rounded-3xl bg-[var(--color-slate-3,#f0f0f3)] p-6',
              overflows && !expanded && 'h-[238px]',
            )}
          >
            <div ref={contentRef} className="flex flex-col gap-4">
              {categories.map((cat) => (
                <div key={cat} className="flex flex-col gap-1">
                  <p className="text-sm font-semibold leading-5 text-[var(--color-slate-11,#60646c)]">
                    {cat}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {fieldsByCategory[cat].map((field, i) => (
                      <div key={i} className="flex items-center gap-2 py-1">
                        <Check className="h-4 w-4 shrink-0 text-[var(--color-slate-11,#60646c)]" />
                        <p className="text-sm leading-5 text-[var(--color-slate-11,#60646c)]">
                          {field}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Show all overlay */}
            {overflows && !expanded && (
              <div className="absolute bottom-0 left-0 right-0 flex h-[64px] items-center justify-end bg-[rgba(240,240,243,0.85)] px-6">
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="flex items-center gap-1 text-sm font-medium text-[var(--color-slate-12,#1c2024)]"
                >
                  Show all
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* CTA */}
          <Button onClick={onExplore} className="w-fit gap-2 rounded-full px-6">
            View student data
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right: illustration */}
      <div className="flex flex-1 items-start justify-start pt-[380px]">
        <img
          src={CONFIRMATION_ILLUSTRATION}
          alt=""
          className="pointer-events-none h-[360px] w-[360px] object-cover ml-[48px]"
        />
      </div>
    </div>
  )
}

// ─── Wizard root ─────────────────────────────────────────────────────────────

export function ImportWizard({
  onClose,
  onImportComplete,
}: {
  onClose: () => void
  onImportComplete?: (columns: Array<ColumnConfig>) => void
}) {
  const [step, setStep] = useState<WizardStep>(1)
  const [uploadError, setUploadError] = useState(false)
  const [hasIssues, setHasIssues] = useState(false)
  const [confirmationShowAll, setConfirmationShowAll] = useState(false)
  const [fieldsByCategory, setFieldsByCategory] = useState<
    Record<string, Array<string>>
  >({})

  function handleFileAccepted(file: File) {
    setUploadError(false)
    const toastId = toast.loading('Processing file…')
    setTimeout(() => {
      toast.dismiss(toastId)
      const willError = file.name.includes('bad')
      if (willError) {
        setUploadError(true)
      } else {
        setStep(2)
      }
    }, 1800)
  }

  function buildFieldsByCategory(
    mappings: Record<string, string>,
  ): Record<string, Array<string>> {
    const result: Record<string, Array<string>> = {}
    for (const field of INCOMING_FIELDS) {
      const category = mappings[field.id] ?? 'Others'
      if (!result[category]) result[category] = []
      result[category].push(field.name)
    }
    return result
  }

  function handleComplete(mappings: Record<string, string>) {
    const toastId = toast.loading('Merging data…')
    setTimeout(() => {
      toast.dismiss(toastId)
      setFieldsByCategory(buildFieldsByCategory(mappings))
      setStep(4)
    }, 2000)
  }

  function handleSkipAll(mappings: Record<string, string>) {
    // All fields go to "Others"
    const allOthers = Object.fromEntries(
      INCOMING_FIELDS.map((f) => [f.id, 'Others']),
    )
    const toastId = toast.loading('Merging data…')
    setTimeout(() => {
      toast.dismiss(toastId)
      setFieldsByCategory(buildFieldsByCategory({ ...mappings, ...allOthers }))
      setStep(4)
    }, 2000)
  }

  const isConfirmation = step === 4

  return (
    <>
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-6 px-6 py-4">
        <div className="flex items-center gap-4">
          <span className="text-base font-semibold text-slate-900">
            Import data
          </span>
          {!isConfirmation && (
            <>
              <div className="h-4 w-px bg-slate-200" />
              <WizardStepper current={step} />
            </>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Step content */}
      {step === 1 && (
        <Step1 hasError={uploadError} onFileAccepted={handleFileAccepted} />
      )}
      {step === 2 && (
        <Step2
          hasIssues={hasIssues}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <Step3
          onBack={() => setStep(2)}
          onComplete={handleComplete}
          onSkipAll={handleSkipAll}
        />
      )}
      {step === 4 && (
        <ConfirmationPage
          fieldsByCategory={
            confirmationShowAll
              ? MOCK_MANY_FIELDS_BY_CATEGORY
              : fieldsByCategory
          }
          onExplore={() => {
            if (onImportComplete) {
              const now = new Date()
              const dateStr = now.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
              onImportComplete(
                INCOMING_FIELDS.map((f) => ({
                  id: f.id,
                  label: f.name,
                  visible: true,
                  sortable: true,
                  imported: true,
                  source: 'Imported by user',
                  lastUpdated: `${dateStr} by You`,
                })),
              )
            }
            onClose()
          }}
        />
      )}

      {/* Floating design tools — dev only */}
      <Popover>
        <PopoverTrigger
          render={
            <button className="fixed bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-lg transition-shadow hover:shadow-xl">
              <Settings2 className="h-4 w-4 text-slate-500" />
            </button>
          }
        />
        <PopoverContent side="top" sideOffset={8} align="end" className="w-64">
          <PopoverHeader>
            <PopoverTitle>Design Tools</PopoverTitle>
          </PopoverHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-500">
                Step 1 — Upload state
              </label>
              <Select
                value={uploadError ? 'error' : 'idle'}
                onValueChange={(val) => setUploadError(val === 'error')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="error">Upload error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-slate-500">
                Step 2 — Review state
              </label>
              <Select
                value={hasIssues ? 'issues' : 'clean'}
                onValueChange={(val) => setHasIssues(val === 'issues')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clean">No issues</SelectItem>
                  <SelectItem value="issues">Few issues found</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-500">
                Step 4 — Overflow state
              </label>
              <button
                type="button"
                onClick={() => setConfirmationShowAll((v) => !v)}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none',
                  confirmationShowAll ? 'bg-slate-900' : 'bg-slate-200',
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform',
                    confirmationShowAll ? 'translate-x-4' : 'translate-x-0',
                  )}
                />
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
