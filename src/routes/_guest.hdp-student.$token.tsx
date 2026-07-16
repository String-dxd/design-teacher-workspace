import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import type { HdpReportBook, StudentReflection } from '@/types/hdp'
import type { PatternReaction } from '@/components/hdp/report-story'
import { ReportStory } from '@/components/hdp/report-story'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getStudentById } from '@/data/mock-students'
import {
  bookByStudentToken,
  coverReflection,
  loadMarks,
  loadPatterns,
  reactToPattern,
  restorePattern,
  retirePatternFromFamily,
  seedIfEmpty,
  submitStudentReflection,
} from '@/lib/hdp-store'
import { trendsForEntries } from '@/lib/hdp-trends'
import { useFeatureFlag } from '@/hooks/use-feature-flag'

export const Route = createFileRoute('/_guest/hdp-student/$token')({
  component: GuestHdpStudentPage,
})

const REFLECTION_MAX_LENGTH = 600

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function GuestHdpStudentPage() {
  const { token } = Route.useParams()
  const showFuture = useFeatureFlag('reports-hdp-future')

  const [mounted, setMounted] = React.useState(false)
  const [book, setBook] = React.useState<HdpReportBook | null | undefined>(
    undefined,
  )
  const [reflection, setReflection] = React.useState<
    StudentReflection | undefined
  >(undefined)
  const [editing, setEditing] = React.useState(false)
  const [draftText, setDraftText] = React.useState('')
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const refresh = React.useCallback(() => {
    seedIfEmpty()
    const nextBook = bookByStudentToken(token) ?? null
    setBook(nextBook)
    setReflection(nextBook ? coverReflection(nextBook.studentId) : undefined)
  }, [token])

  React.useEffect(() => {
    setMounted(true)
    refresh()
  }, [refresh])

  const student = book ? getStudentById(book.studentId) : undefined

  React.useEffect(() => {
    document.title =
      book && student
        ? `${student.name} — Semester ${book.semester} report`
        : 'Report link — Teacher Workspace'
  }, [book, student])

  React.useEffect(() => {
    if (!editing) return
    setDraftText(reflection?.text ?? '')
  }, [editing, reflection])

  if (!mounted || book === undefined) {
    return <div aria-hidden className="h-24" />
  }

  if (book === null || !student) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">This report link isn't valid</h1>
        <p className="text-muted-foreground text-sm">
          Check with your teacher.
        </p>
      </main>
    )
  }

  const locked = Boolean(book.sharedAt)
  const showForm = !reflection || (editing && !locked)

  function handleSaveClick() {
    if (draftText.trim().length === 0) return
    setConfirmOpen(true)
  }

  function handleConfirmSave() {
    submitStudentReflection(token, draftText.trim())
    setConfirmOpen(false)
    setEditing(false)
    refresh()
  }

  const sentenceCount = draftText
    .split(/[.?!]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0).length

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-10 sm:px-6">
      <ReportStory
        book={book}
        studentName={student.name}
        className={student.class}
        viewer={showFuture ? 'student' : 'parent'}
        reflection={reflection}
        patterns={loadPatterns().filter((p) => p.studentId === book.studentId)}
        showFuture={showFuture}
        trends={trendsForEntries(loadMarks(book.studentId))}
        locked={locked}
        onReact={
          showFuture
            ? (patternId: string, reaction: PatternReaction, note?: string) => {
                reactToPattern(patternId, reaction, note)
                refresh()
              }
            : undefined
        }
        onRetire={
          showFuture
            ? (patternId: string) => {
                retirePatternFromFamily(patternId)
                refresh()
              }
            : undefined
        }
        onRestore={
          showFuture
            ? (patternId: string) => {
                restorePattern(patternId)
                refresh()
              }
            : undefined
        }
      />

      <section className="border-border flex flex-col gap-4 border-t pt-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Add your reflection</h2>
          <p className="text-muted-foreground text-sm">
            A few honest sentences about this semester. It appears on your
            report exactly as you write it — nobody edits it.
          </p>
          {showFuture && (
            <p className="text-muted-foreground text-xs">
              At least three sentences — this becomes the cover of your report.
            </p>
          )}
        </div>

        {showForm ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="student-reflection">Your reflection</Label>
            <Textarea
              id="student-reflection"
              aria-describedby="student-reflection-counter"
              value={draftText}
              onChange={(e) =>
                setDraftText(e.target.value.slice(0, REFLECTION_MAX_LENGTH))
              }
              rows={6}
            />
            <div className="flex items-center justify-between gap-3">
              <p
                id="student-reflection-counter"
                className="text-muted-foreground text-xs tabular-nums"
              >
                {draftText.length}/{REFLECTION_MAX_LENGTH}
                {showFuture &&
                  ` · ${sentenceCount} sentence${sentenceCount === 1 ? '' : 's'}`}
              </p>
              <div className="flex gap-2">
                {editing && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="button"
                  disabled={draftText.trim().length === 0}
                  title={
                    draftText.trim().length === 0
                      ? 'Write a reflection first'
                      : undefined
                  }
                  onClick={handleSaveClick}
                >
                  Add to my report
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <p className="text-sm leading-relaxed">
                &ldquo;{reflection.text}&rdquo;
              </p>
              <p className="text-muted-foreground text-xs">
                Written {formatDate(reflection.writtenAt)}
              </p>
            </div>
            {locked ? (
              <p className="text-muted-foreground text-xs">
                Sent with your report.
              </p>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>
        )}
      </section>

      <p className="text-muted-foreground text-center text-xs">
        Prototype — sample data
      </p>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add this to your report?</AlertDialogTitle>
            <AlertDialogDescription>
              This goes on your report, in your words. You can rewrite it until
              it's sent to your parents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>
              Add to my report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
