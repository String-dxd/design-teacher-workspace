import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowUpDown,
  CalendarDays,
  Check,
  CheckSquare,
  ChevronDown,
  CircleDot,
  GripVertical,
  MessageSquare,
  Plus,
  Trash2,
  Type,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import type { LucideIcon } from 'lucide-react'
import type { FormQuestion, QuestionType, ReminderType } from '@/types/form'
import type { SelectedEntity } from '@/components/comms/entity-selector'
import { StudentRecipientSelector } from '@/components/comms/student-recipient-selector'
import { StaffSelector } from '@/components/comms/staff-selector'
import { EnquiryEmailSelector } from '@/components/comms/enquiry-email-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'

// ---------------------------------------------------------------------------
// Question type config
// ---------------------------------------------------------------------------

const QUESTION_TYPES: Array<{
  value: QuestionType
  label: string
  icon: LucideIcon
  description: string
}> = [
  {
    value: 'yes-no',
    label: 'Yes / No',
    icon: Check,
    description: 'Binary yes or no response',
  },
  {
    value: 'mcq',
    label: 'Multiple Choice',
    icon: CircleDot,
    description: 'Select one option',
  },
  {
    value: 'checkbox',
    label: 'Checkbox',
    icon: CheckSquare,
    description: 'Select multiple options',
  },
  {
    value: 'free-text',
    label: 'Free Text',
    icon: Type,
    description: 'Open-ended text response',
  },
  {
    value: 'ranking',
    label: 'Ranking',
    icon: ArrowUpDown,
    description: 'Order items by preference',
  },
  {
    value: 'date',
    label: 'Date',
    icon: CalendarDays,
    description: 'Pick a date',
  },
  {
    value: 'file-upload',
    label: 'File Upload',
    icon: Upload,
    description: 'Upload a file',
  },
]

const TYPES_WITH_OPTIONS: Array<QuestionType> = ['mcq', 'checkbox', 'ranking']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let nextId = 1
function makeId() {
  return `q-${Date.now()}-${nextId++}`
}

function createQuestion(type: QuestionType): FormQuestion {
  return {
    id: makeId(),
    text: '',
    type,
    options: TYPES_WITH_OPTIONS.includes(type)
      ? ['Option 1', 'Option 2']
      : undefined,
    required: false,
  }
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute('/forms/new')({
  component: NewFormPage,
})

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function NewFormPage() {
  const navigate = useNavigate()

  useSetBreadcrumbs([
    { label: 'Forms', href: '/forms' },
    { label: 'New Form', href: '/forms/new' },
  ])

  // State
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [questions, setQuestions] = useState<Array<FormQuestion>>([])
  const [dueDate, setDueDate] = useState('')
  const [reminderType, setReminderType] = useState<ReminderType>('none')
  const [recipients, setRecipients] = useState<Array<SelectedEntity>>([])
  const [staffInCharge, setStaffInCharge] = useState<Array<SelectedEntity>>([])
  const [enquiryEmail, setEnquiryEmail] = useState('')

  // Validation
  const canActivate =
    title.trim().length > 0 && dueDate.length > 0 && questions.length > 0

  function handleActivate() {
    if (!canActivate) {
      const missing: Array<string> = []
      if (!title.trim()) missing.push('title')
      if (!dueDate) missing.push('due date')
      if (questions.length === 0) missing.push('at least 1 question')
      toast.error(`Missing required fields: ${missing.join(', ')}`)
      return
    }
    toast.success('Form activated successfully')
    navigate({ to: '/forms' })
  }

  // Question CRUD
  function addQuestion(type: QuestionType) {
    setQuestions((prev) => [...prev, createQuestion(type)])
  }

  function updateQuestion(id: string, patch: Partial<FormQuestion>) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    )
  }

  function removeQuestion(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  function addOption(questionId: string) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q
        const opts = q.options ?? []
        if (opts.length >= 6) return q
        return { ...q, options: [...opts, `Option ${opts.length + 1}`] }
      }),
    )
  }

  function updateOption(questionId: string, index: number, value: string) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId || !q.options) return q
        const opts = [...q.options]
        opts[index] = value
        return { ...q, options: opts }
      }),
    )
  }

  function removeOption(questionId: string, index: number) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId || !q.options) return q
        if (q.options.length <= 2) return q
        return { ...q, options: q.options.filter((_, i) => i !== index) }
      }),
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* ---------------------------------------------------------------- */}
      {/* Sticky header                                                    */}
      {/* ---------------------------------------------------------------- */}
      <div className="sticky top-0 z-10 bg-white">
        <div className="flex items-center gap-3 border-b px-6 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            render={<Link to="/forms" />}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <h1 className="flex-1 text-base font-semibold">New Form</h1>

          <Button size="sm" onClick={handleActivate}>
            <Check className="mr-2 h-3.5 w-3.5" />
            Activate Form
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Body                                                              */}
      {/* ---------------------------------------------------------------- */}
      <div className="mx-auto w-full max-w-2xl px-6 py-8">
        <div className="space-y-6">
          {/* -------------------------------------------------------------- */}
          {/* Section 1: Recipients                                           */}
          {/* -------------------------------------------------------------- */}
          <section className="rounded-xl border bg-white p-6">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recipients
            </h2>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label>
                  Students <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Parents of the selected students will receive this form via
                  Parents Gateway.
                </p>
                <StudentRecipientSelector
                  value={recipients}
                  onChange={setRecipients}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Staff-in-charge</Label>
                <p className="text-xs text-muted-foreground">
                  These staff will be able to view responses and manage this
                  form.
                </p>
                <StaffSelector
                  value={staffInCharge}
                  onChange={setStaffInCharge}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Enquiry email</Label>
                <p className="text-xs text-muted-foreground">
                  Select the preferred email address to receive enquiries from
                  parents.
                </p>
                <EnquiryEmailSelector
                  value={enquiryEmail}
                  onChange={setEnquiryEmail}
                />
              </div>
            </div>
          </section>

          {/* -------------------------------------------------------------- */}
          {/* Section 2: Content                                               */}
          {/* -------------------------------------------------------------- */}
          <section className="rounded-xl border bg-white p-6">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Content
            </h2>
            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <Label htmlFor="title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      title.length > 120
                        ? 'text-destructive'
                        : 'text-muted-foreground',
                    )}
                  >
                    {title.length}/120
                  </span>
                </div>
                <Input
                  id="title"
                  placeholder="e.g. School Camp Consent Form"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                />
              </div>

              {/* Instructions */}
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <Label htmlFor="instructions">Instructions</Label>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {instructions.length}/2000
                  </span>
                </div>
                <textarea
                  id="instructions"
                  placeholder="Write instructions or context for parents filling out this form."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  maxLength={2000}
                  rows={5}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>
            </div>
          </section>

          {/* -------------------------------------------------------------- */}
          {/* Section 3: Questions                                            */}
          {/* -------------------------------------------------------------- */}
          <section className="rounded-xl border bg-white p-6">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Questions
            </h2>

            {questions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-300 py-10 text-center">
                <MessageSquare className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-muted-foreground">
                  Add your first question
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, qIndex) => {
                  const typeConfig = QUESTION_TYPES.find(
                    (t) => t.value === question.type,
                  )
                  const TypeIcon = typeConfig?.icon ?? Type
                  const hasOptions = TYPES_WITH_OPTIONS.includes(question.type)

                  return (
                    <div
                      key={question.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      {/* Question header row */}
                      <div className="mb-3 flex items-start gap-2">
                        <GripVertical className="mt-2.5 h-4 w-4 shrink-0 cursor-grab text-slate-300" />
                        <div className="flex-1 space-y-3">
                          {/* Question text */}
                          <Input
                            placeholder={`Question ${qIndex + 1}`}
                            value={question.text}
                            onChange={(e) =>
                              updateQuestion(question.id, {
                                text: e.target.value,
                              })
                            }
                          />

                          {/* Type selector */}
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <button
                                  type="button"
                                  className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm transition-colors hover:bg-slate-50"
                                >
                                  <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>{typeConfig?.label}</span>
                                  <ChevronDown className="ml-1 h-3 w-3 text-muted-foreground" />
                                </button>
                              }
                            />
                            <DropdownMenuContent align="start" className="w-56">
                              {QUESTION_TYPES.map((qt) => {
                                const Icon = qt.icon
                                return (
                                  <DropdownMenuItem
                                    key={qt.value}
                                    onClick={() => {
                                      const patch: Partial<FormQuestion> = {
                                        type: qt.value,
                                      }
                                      if (
                                        TYPES_WITH_OPTIONS.includes(qt.value)
                                      ) {
                                        if (!question.options?.length) {
                                          patch.options = [
                                            'Option 1',
                                            'Option 2',
                                          ]
                                        }
                                      } else {
                                        patch.options = undefined
                                      }
                                      updateQuestion(question.id, patch)
                                    }}
                                  >
                                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <div className="text-sm">{qt.label}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {qt.description}
                                      </div>
                                    </div>
                                  </DropdownMenuItem>
                                )
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* Options list for MCQ / Checkbox / Ranking */}
                          {hasOptions && question.options && (
                            <div className="space-y-2">
                              {question.options.map((opt, optIndex) => (
                                <div
                                  key={optIndex}
                                  className="flex items-center gap-2"
                                >
                                  <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">
                                    {optIndex + 1}.
                                  </span>
                                  <Input
                                    value={opt}
                                    onChange={(e) =>
                                      updateOption(
                                        question.id,
                                        optIndex,
                                        e.target.value,
                                      )
                                    }
                                    className="flex-1"
                                  />
                                  {question.options!.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeOption(question.id, optIndex)
                                      }
                                      className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
                                      aria-label={`Remove option ${optIndex + 1}`}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}

                              {question.options.length < 6 && (
                                <button
                                  type="button"
                                  onClick={() => addOption(question.id)}
                                  className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-slate-200 hover:text-foreground"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add option
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Right side controls */}
                        <div className="flex items-center gap-2">
                          {/* Required toggle */}
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={question.required ?? false}
                              onChange={(e) =>
                                updateQuestion(question.id, {
                                  required: e.target.checked,
                                })
                              }
                              className="h-3.5 w-3.5 accent-primary"
                            />
                            <span className="text-xs text-muted-foreground">
                              Required
                            </span>
                          </label>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => removeQuestion(question.id)}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                            aria-label="Delete question"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add question button */}
            <div className="mt-4">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      Add Question
                    </Button>
                  }
                />
                <DropdownMenuContent align="start" className="w-64">
                  {QUESTION_TYPES.map((qt) => {
                    const Icon = qt.icon
                    return (
                      <DropdownMenuItem
                        key={qt.value}
                        onClick={() => addQuestion(qt.value)}
                      >
                        <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm">{qt.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {qt.description}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </section>

          {/* -------------------------------------------------------------- */}
          {/* Section 4: Settings                                             */}
          {/* -------------------------------------------------------------- */}
          <section className="rounded-xl border bg-white p-6">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Settings
            </h2>
            <div className="space-y-5">
              {/* Due date */}
              <div className="space-y-1.5">
                <Label>
                  Due date <span className="text-destructive">*</span>
                </Label>
                <input
                  type="date"
                  value={dueDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Reminder type */}
              <div className="space-y-2">
                <Label>Reminder</Label>
                <div className="space-y-2">
                  {(
                    [
                      { value: 'none', label: 'None' },
                      { value: 'one-time', label: 'One Time' },
                      { value: 'daily', label: 'Daily' },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="reminder"
                        value={opt.value}
                        checked={reminderType === opt.value}
                        onChange={() => setReminderType(opt.value)}
                        className="h-3.5 w-3.5 accent-primary"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
