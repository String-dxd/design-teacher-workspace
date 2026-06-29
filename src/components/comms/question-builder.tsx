import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2, X } from 'lucide-react'
import type { FormQuestion, QuestionType, ResponseType } from '@/types/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const MAX_QUESTIONS = 5
const MAX_OPTIONS = 6
const MIN_OPTIONS = 2

interface QuestionBuilderProps {
  questions: Array<FormQuestion>
  onChange: (questions: Array<FormQuestion>) => void
  responseType?: ResponseType
  onEditQuestion?: (id: string | null) => void
}

export function QuestionBuilder({
  questions,
  onChange,
  responseType,
  onEditQuestion,
}: QuestionBuilderProps) {
  const isYesNo = responseType === 'yes-no'

  function addQuestion() {
    if (questions.length >= MAX_QUESTIONS) return
    const newQ: FormQuestion = {
      id: crypto.randomUUID(),
      text: '',
      type: 'free-text',
      options: ['', ''],
      showAfter: 'both',
    }
    onChange([...questions, newQ])
  }

  function updateQuestion(id: string, patch: Partial<FormQuestion>) {
    onChange(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)))
  }

  function deleteQuestion(id: string) {
    onChange(questions.filter((q) => q.id !== id))
  }

  function moveUp(index: number) {
    if (index === 0) return
    const next = [...questions]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    onChange(next)
  }

  function moveDown(index: number) {
    if (index === questions.length - 1) return
    const next = [...questions]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    onChange(next)
  }

  function addOption(questionId: string) {
    const q = questions.find((q) => q.id === questionId)
    if (!q || (q.options ?? []).length >= MAX_OPTIONS) return
    updateQuestion(questionId, { options: [...(q.options ?? []), ''] })
  }

  function updateOption(questionId: string, optIndex: number, value: string) {
    const q = questions.find((q) => q.id === questionId)
    if (!q) return
    const opts = [...(q.options ?? [])]
    opts[optIndex] = value
    updateQuestion(questionId, { options: opts })
  }

  function removeOption(questionId: string, optIndex: number) {
    const q = questions.find((q) => q.id === questionId)
    if (!q || (q.options ?? []).length <= MIN_OPTIONS) return
    const opts = (q.options ?? []).filter((_, i) => i !== optIndex)
    updateQuestion(questionId, { options: opts })
  }

  const atMax = questions.length >= MAX_QUESTIONS

  return (
    <section className="rounded-xl border bg-white p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Questions
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Custom questions (optional). You may add up to {MAX_QUESTIONS}{' '}
            questions.
          </p>
        </div>
        {!atMax && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={addQuestion}
          >
            <Plus className="h-3.5 w-3.5" />
            Add a Question
          </Button>
        )}
      </div>

      {questions.length === 0 && (
        <p className="text-sm italic text-muted-foreground/60">
          No questions added yet.
        </p>
      )}

      <div className="space-y-3">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
          >
            {/* Question header row */}
            <div className="flex items-start gap-2">
              <GripVertical className="mt-2 h-4 w-4 shrink-0 text-slate-300" />
              <span className="mt-2 w-4 shrink-0 text-xs font-medium text-muted-foreground">
                {i + 1}.
              </span>
              <Input
                value={q.text}
                onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                onFocus={() => onEditQuestion?.(q.id)}
                onBlur={() => onEditQuestion?.(null)}
                placeholder="Enter your question"
                className="h-8 flex-1 text-sm"
              />
              <div className="flex shrink-0 items-center gap-0.5 mt-0.5">
                <button
                  type="button"
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(i)}
                  disabled={i === questions.length - 1}
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteQuestion(q.id)}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  aria-label="Delete question"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Type toggle */}
            <div className="mt-2.5 ml-10 flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Type:</span>
              {(['free-text', 'mcq'] as Array<QuestionType>).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    updateQuestion(q.id, {
                      type: t,
                      options:
                        t === 'mcq' && (!q.options || q.options.length < 2)
                          ? ['', '']
                          : q.options,
                    })
                  }
                  className={cn(
                    'flex items-center gap-1.5 text-xs',
                    q.type === t || (!q.type && t === 'free-text')
                      ? 'font-semibold text-slate-800'
                      : 'text-slate-400 hover:text-slate-600',
                  )}
                >
                  <div
                    className={cn(
                      'h-3.5 w-3.5 rounded-full border-2',
                      q.type === t || (!q.type && t === 'free-text')
                        ? 'border-slate-700 bg-slate-700'
                        : 'border-slate-300',
                    )}
                  >
                    {(q.type === t || (!q.type && t === 'free-text')) && (
                      <div className="h-full w-full rounded-full bg-white scale-[0.4]" />
                    )}
                  </div>
                  {t === 'free-text' ? 'Open-ended' : 'MCQ'}
                </button>
              ))}
            </div>

            {/* MCQ options */}
            {q.type === 'mcq' && (
              <div className="mt-2.5 ml-10 space-y-1.5">
                {(q.options ?? ['', '']).map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-1.5">
                    <div className="h-3 w-3 shrink-0 rounded-full border-2 border-slate-300" />
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(q.id, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className="h-7 flex-1 text-xs"
                    />
                    {(q.options ?? []).length > MIN_OPTIONS && (
                      <button
                        type="button"
                        onClick={() => removeOption(q.id, oi)}
                        className="shrink-0 rounded p-0.5 text-slate-400 hover:text-red-500"
                        aria-label="Remove option"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                {(q.options ?? []).length < MAX_OPTIONS && (
                  <button
                    type="button"
                    onClick={() => addOption(q.id)}
                    className="ml-4 flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                  >
                    <Plus className="h-3 w-3" />
                    Add option
                  </button>
                )}
              </div>
            )}

            {/* Show after (yes-no forms only) */}
            {isYesNo && (
              <div className="mt-2.5 ml-10 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Show after response:
                </span>
                {(['yes', 'no', 'both'] as const).map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => updateQuestion(q.id, { showAfter: choice })}
                    className={cn(
                      'rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
                      (q.showAfter ?? 'both') === choice
                        ? choice === 'yes'
                          ? 'bg-emerald-100 text-emerald-700'
                          : choice === 'no'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-slate-200 text-slate-700'
                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600',
                    )}
                  >
                    {choice === 'yes' ? 'Yes' : choice === 'no' ? 'No' : 'Both'}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
