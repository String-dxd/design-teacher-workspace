import { useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  X,
} from 'lucide-react'

import { toast } from 'sonner'

import type { StudentGroup } from '@/types/student-group'
import { MOCK_GROUPS } from '@/data/mock-groups'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/groups/upload')({
  component: GroupsUpload,
})

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_PARSED_ROWS = [
  { row: 1, name: 'Chen Wei Ming', class: '3 Aspiration', valid: true },
  { row: 2, name: 'Tan Mei Ling', class: '3 Aspiration', valid: true },
  { row: 3, name: 'Lim Jun Kai', class: '2 Courage', valid: true },
  { row: 4, name: 'Ahmad Bin Razali', class: '3 Aspiration', valid: true },
  {
    row: 5,
    name: 'Chan Hui Ling',
    class: '3 Creativity',
    valid: false,
    issue: 'not-found' as const,
  },
  { row: 6, name: 'Ng Pei Shan', class: '2 Courage', valid: true },
  { row: 7, name: 'Priya d/o Rajan', class: '3 Creativity', valid: true },
  {
    row: 8,
    name: 'Chen Wei Ming',
    class: '3 Aspiration',
    valid: false,
    issue: 'duplicate' as const,
  },
  { row: 9, name: 'Siti Norzahra', class: '3 Aspiration', valid: true },
  { row: 10, name: 'Marcus Teo Jian Hao', class: '2 Courage', valid: true },
]

const VALIDATION_ISSUES = [
  {
    id: 'not-found',
    title: 'Name not found in school records',
    description: 'Check that names match the School Cockpit format.',
    rows: [5],
  },
  {
    id: 'duplicate',
    title: 'Duplicate entry',
    description: 'Remove repeated student entries.',
    rows: [8],
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <p className="text-sm text-muted-foreground">
      Step {current} of {total}
    </p>
  )
}

function DropZone({
  onFileAccepted,
}: {
  onFileAccepted: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFileAccepted(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
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
        'flex h-full min-h-[320px] w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-input bg-muted/50 hover:border-muted-foreground/40 hover:bg-muted',
      )}
    >
      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full transition-colors',
          isDragging ? 'bg-primary/10' : 'bg-muted',
        )}
      >
        <Upload
          className={cn(
            'h-6 w-6 transition-colors',
            isDragging ? 'text-primary' : 'text-muted-foreground',
          )}
        />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          Drop your file here or{' '}
          <span className="text-primary underline underline-offset-2">
            browse
          </span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Supported file types: .csv, .xls, .xlsx
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xls,.xlsx"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}

// ─── Step 1 ────────────────────────────────────────────────────────────────────

function Step1({ onFileAccepted }: { onFileAccepted: (file: File) => void }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="px-8 pb-6 pt-8">
        <StepIndicator current={1} total={2} />
        <h1 className="mt-1 text-2xl font-bold text-foreground">
          Upload a student list
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Import students from a spreadsheet to create your group.
        </p>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden px-8 pb-8">
        {/* Left panel */}
        <div className="flex w-[380px] shrink-0 flex-col gap-4">
          {/* Prepare card */}
          <div className="rounded-xl border bg-card p-5">
            <p className="mb-3 font-semibold text-foreground">
              Prepare your file
            </p>
            <ul className="space-y-2.5">
              {[
                <>
                  Download the{' '}
                  <span className="font-medium text-primary underline underline-offset-2 cursor-pointer">
                    student list template
                  </span>{' '}
                  and fill it in
                </>,
                'Upload a .csv, .xls, or .xlsx file',
                'Ensure the file is not password-protected',
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <ArrowRight className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Format guide */}
          <div className="rounded-xl border bg-card p-5">
            <p className="mb-3 font-semibold text-foreground">
              Required columns
            </p>
            <ul className="space-y-3">
              {[
                {
                  col: 'Name',
                  desc: 'Full name as registered in School Cockpit',
                },
                { col: 'Class', desc: 'e.g. 3 Aspiration, 2 Courage' },
              ].map(({ col, desc }) => (
                <li key={col} className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted">
                    <FileSpreadsheet className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{col}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right panel — drop zone */}
        <div className="flex flex-1 flex-col">
          <DropZone onFileAccepted={onFileAccepted} />
        </div>
      </div>
    </div>
  )
}

// ─── Step 2 ────────────────────────────────────────────────────────────────────

function Step2({
  fileName,
  groupName,
  onGroupNameChange,
  onBack,
  onSubmit,
}: {
  fileName: string
  groupName: string
  onGroupNameChange: (v: string) => void
  onBack: () => void
  onSubmit: () => void
}) {
  const validCount = MOCK_PARSED_ROWS.filter((r) => r.valid).length
  const hasIssues = VALIDATION_ISSUES.length > 0
  const issueRows = new Set(VALIDATION_ISSUES.flatMap((iss) => iss.rows))

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="px-8 pb-4 pt-8">
        <StepIndicator current={2} total={2} />
        <h1 className="mt-1 text-2xl font-bold text-foreground">
          Review student list
        </h1>
        <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {MOCK_PARSED_ROWS.length} records · {fileName}
        </p>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden px-8 pb-6">
        {/* Left — table */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border bg-card">
          <div className="overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead className="w-12 pl-4 text-right text-xs text-muted-foreground">
                    #
                  </TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Class</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_PARSED_ROWS.map((r) => (
                  <TableRow
                    key={r.row}
                    className={cn(issueRows.has(r.row) && 'bg-destructive/5')}
                  >
                    <TableCell className="pl-4 text-right text-xs tabular-nums text-muted-foreground">
                      {r.row}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span
                        className={cn(
                          issueRows.has(r.row) && 'text-destructive',
                        )}
                      >
                        {r.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.class}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Right — validation panel */}
        <div className="flex w-[320px] shrink-0 flex-col gap-3">
          {hasIssues ? (
            <div className="flex-1 rounded-xl border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold text-foreground">
                  {VALIDATION_ISSUES.length} issue
                  {VALIDATION_ISSUES.length !== 1 ? 's' : ''} found
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={onBack}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload again
                </Button>
              </div>
              <ul className="space-y-3">
                {VALIDATION_ISSUES.map((iss) => (
                  <li
                    key={iss.id}
                    className="rounded-lg border border-destructive/20 bg-destructive/5 p-3"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {iss.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {iss.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {iss.rows.map((row) => (
                            <span
                              key={row}
                              className="rounded bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border"
                            >
                              ROW {row}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                {validCount} of {MOCK_PARSED_ROWS.length} students will be
                added. Rows with issues will be skipped.
              </p>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-xl border bg-lime-3/40 p-8">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-lime-3">
                  <CheckCircle2 className="h-6 w-6 text-lime-11" />
                </div>
                <p className="font-semibold text-foreground">No issues found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your file is good to go!
                </p>
              </div>
            </div>
          )}

          {/* Group name input */}
          <div className="rounded-xl border bg-card p-4">
            <Label htmlFor="group-name" className="text-sm font-semibold">
              Group name
            </Label>
            <Input
              id="group-name"
              placeholder="e.g. Drama Festival Cast 2025"
              value={groupName}
              onChange={(e) => onGroupNameChange(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between border-t bg-card px-8 py-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!groupName.trim()}
          className="gap-2"
        >
          Create group
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

function GroupsUpload() {
  useSetBreadcrumbs([
    { label: 'Student Groups', href: '/groups' },
    { label: 'Upload template', href: '/groups/upload' },
  ])

  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [fileName, setFileName] = useState('')
  const [groupName, setGroupName] = useState('')

  function handleFileAccepted(file: File) {
    setFileName(file.name)
    const toastId = toast.loading('Processing file…')
    setTimeout(() => {
      toast.dismiss(toastId)
      setStep(2)
    }, 1800)
  }

  function handleSubmit() {
    const validRows = MOCK_PARSED_ROWS.filter((r) => r.valid)
    const newGroup: StudentGroup = {
      id: `cg-upload-${Date.now()}`,
      kind: 'regular',
      name: groupName.trim(),
      description: `Imported from ${fileName}`,
      visibility: 'private',
      staffInCharge: [],
      createdBy: { name: 'Mrs Tan Mei Lin', email: 'tanml@school.edu.sg' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sharedWith: [],
      members: validRows.map((r, i) => ({
        id: `upload-member-${i}`,
        name: r.name,
        class: r.class,
        nric: '',
        indexNumber: i + 1,
      })),
    }
    MOCK_GROUPS.push(newGroup)
    toast.success('Group created')
    navigate({ to: '/groups' })
  }

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between border-b bg-card px-8 py-3">
        <span className="text-sm font-medium text-foreground">New group</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => navigate({ to: '/groups' })}
        >
          <X className="mr-1.5 h-4 w-4" />
          Exit
        </Button>
      </div>

      {step === 1 ? (
        <Step1 onFileAccepted={handleFileAccepted} />
      ) : (
        <Step2
          fileName={fileName}
          groupName={groupName}
          onGroupNameChange={setGroupName}
          onBack={() => setStep(1)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
