import { ChevronDown, ChevronUp, Plus, Trash2, X } from 'lucide-react'
import type { FormQuestion } from '@/types/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const MAX_QUESTIONS = 5
const MAX_OPTIONS = 6
const MIN_OPTIONS = 2

interface QuestionBuilderProps {
  questions: Array<FormQuestion>
  onChange: (questions: Array<FormQuestion>) => void
  onEditQuestion?: (id: string | null) => void
}

export function QuestionBuilder({
  questions,
  onChange,
  onEditQuestion,
}: QuestionBuilderProps) {
  function addQuestion() {
    if (questions.length >= MAX_QUESTIONS) return
    const newQ: FormQuestion = {
      id: crypto.randomUUID(),
      text: '',
      type: 'free-text',
      options: ['', ''],
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
    <section className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
        {questions.map((q, i) => {
          const isOpenEnded = q.type === 'free-text' || !q.type
          const isMcq = q.type === 'mcq'
          return (
            <div
              key={q.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              {/* Question row */}
              <div className="flex items-center gap-2">
                <Input
                  value={q.text}
                  onChange={(e) =>
                    updateQuestion(q.id, { text: e.target.value })
                  }
                  onFocus={() => onEditQuestion?.(q.id)}
                  onBlur={() => onEditQuestion?.(null)}
                  placeholder={`Question ${i + 1}`}
                  className="h-10 flex-1 rounded-full"
                />
                <div className="flex shrink-0 flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(i)}
                    disabled={i === questions.length - 1}
                    className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Helper text row */}
              <div className="mt-2.5 flex items-center gap-2">
                <Textarea
                  value={q.helperText ?? ''}
                  onChange={(e) =>
                    updateQuestion(q.id, { helperText: e.target.value })
                  }
                  placeholder="Helper text (optional)"
                  className="min-h-24 flex-1 resize-none bg-muted py-2.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => deleteQuestion(q.id)}
                  className="shrink-0 rounded p-1.5 text-destructive hover:bg-destructive/10"
                  aria-label="Delete question"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Type toggle */}
              <div className="mt-3 flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={isOpenEnded ? 'default' : 'outline'}
                  onClick={() => updateQuestion(q.id, { type: 'free-text' })}
                >
                  Open-ended
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={isMcq ? 'default' : 'outline'}
                  onClick={() =>
                    updateQuestion(q.id, {
                      type: 'mcq',
                      options:
                        !q.options || q.options.length < 2
                          ? ['', '']
                          : q.options,
                    })
                  }
                >
                  MCQ
                </Button>
              </div>

              {/* MCQ options */}
              {isMcq && (
                <div className="mt-3 space-y-1.5">
                  {(q.options ?? ['', '']).map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-1.5">
                      <div className="h-3 w-3 shrink-0 rounded-full border-2 border-slate-6" />
                      <Input
                        value={opt}
                        onChange={(e) =>
                          updateOption(q.id, oi, e.target.value)
                        }
                        placeholder={`Option ${oi + 1}`}
                        className="h-8 flex-1 text-sm"
                      />
                      {(q.options ?? []).length > MIN_OPTIONS && (
                        <button
                          type="button"
                          onClick={() => removeOption(q.id, oi)}
                          className="shrink-0 rounded p-0.5 text-slate-9 hover:text-destructive"
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
            </div>
          )
        })}
      </div>
    </section>
  )
}
