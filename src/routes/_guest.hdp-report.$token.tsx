import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { HdpReportBook, HdpTag } from '@/types/hdp'
import { ReportBook } from '@/components/hdp/report-book'
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
import { MOCK_STAFF } from '@/data/mock-staff'
import {
  acknowledgeReport,
  bookByToken,
  coverReflection,
  loadMarks,
  loadPatterns,
  loadTags,
  seedIfEmpty,
} from '@/lib/hdp-store'
import { trendsForEntries } from '@/lib/hdp-trends'
import { formatDate } from '@/lib/format'
import { useFeatureFlag } from '@/hooks/use-feature-flag'

export const Route = createFileRoute('/_guest/hdp-report/$token')({
  component: GuestHdpReportPage,
})

const NOTE_MAX_LENGTH = 500
const ACKNOWLEDGE_LATENCY_MS = 400

function staffName(id: string): string {
  return MOCK_STAFF.find((s) => s.id === id)?.name ?? 'Unknown teacher'
}

function GuestHdpReportPage() {
  const { token } = Route.useParams()
  const showFuture = useFeatureFlag('reports-hdp-future')

  const [mounted, setMounted] = React.useState(false)
  const [book, setBook] = React.useState<HdpReportBook | null | undefined>(
    undefined,
  )
  const [note, setNote] = React.useState('')
  const [confirmSendOpen, setConfirmSendOpen] = React.useState(false)
  const [acknowledging, setAcknowledging] = React.useState(false)

  const refresh = React.useCallback(() => {
    seedIfEmpty()
    setBook(bookByToken(token) ?? null)
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

  // Plain lookup — no live subscription needed; tags never change from this
  // read-only guest surface, only the attribution count is computed from
  // them (matches report-book.tsx's ResolveTag contract).
  const resolveTag = React.useCallback((tagId: string) => {
    const tag = loadTags().find((t: HdpTag) => t.id === tagId)
    return tag ? { tag, authorName: staffName(tag.authorId) } : undefined
  }, [])

  if (!mounted || book === undefined) {
    return <div aria-hidden className="h-24" />
  }

  if (book === null || !student) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">This report link isn't valid</h1>
        <p className="text-muted-foreground text-sm">
          Check with your child's school.
        </p>
      </main>
    )
  }

  const firstName = student.name.split(' ')[0] ?? student.name

  function handleAcknowledge() {
    setAcknowledging(true)
    setTimeout(() => {
      acknowledgeReport(token)
      setAcknowledging(false)
      refresh()
    }, ACKNOWLEDGE_LATENCY_MS)
  }

  function handleSendNote() {
    acknowledgeReport(token, note)
    setConfirmSendOpen(false)
    refresh()
    toast.success('Note sent')
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-10 sm:px-6">
      {showFuture ? (
        <ReportStory
          book={book}
          studentName={student.name}
          className={student.class}
          viewer="parent"
          reflection={coverReflection(book.studentId)}
          patterns={loadPatterns().filter(
            (p) => p.studentId === book.studentId,
          )}
          showFuture={showFuture}
          trends={trendsForEntries(loadMarks(book.studentId))}
        />
      ) : (
        <ReportBook
          book={book}
          studentName={student.name}
          className={student.class}
          viewer="parent"
          resolveTag={resolveTag}
          showFuture={showFuture}
          trends={[]}
        />
      )}

      <section className="border-border flex flex-col gap-4 border-t pt-6">
        <h2 className="text-lg font-semibold">Acknowledge this report</h2>
        <p className="text-muted-foreground text-sm">
          This replaces the printed signature slip.
        </p>

        <div role="status" aria-live="polite">
          {book.acknowledgement ? (
            <p className="text-sm font-medium">
              Acknowledged on {formatDate(book.acknowledgement.at)}
            </p>
          ) : (
            <Button
              type="button"
              onClick={handleAcknowledge}
              disabled={acknowledging}
              className="w-fit"
            >
              {acknowledging ? 'Acknowledging…' : 'Acknowledge'}
            </Button>
          )}
        </div>

        {book.acknowledgement &&
          (book.acknowledgement.note ? (
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium">A note to {firstName}</p>
              <p className="text-muted-foreground text-sm">
                {book.acknowledgement.note}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="parent-note">
                A note to {firstName} (optional)
              </Label>
              <p
                className="text-muted-foreground text-xs"
                id="parent-note-helper"
              >
                One note, addressed to your child — they'll see it with their
                report.
              </p>
              <Textarea
                id="parent-note"
                aria-describedby="parent-note-helper"
                value={note}
                onChange={(e) =>
                  setNote(e.target.value.slice(0, NOTE_MAX_LENGTH))
                }
                rows={4}
              />
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                disabled={note.trim().length === 0}
                title={
                  note.trim().length === 0 ? 'Write a note first' : undefined
                }
                onClick={() => setConfirmSendOpen(true)}
              >
                Send note
              </Button>
            </div>
          ))}
      </section>

      <p className="text-muted-foreground text-center text-xs">
        Prototype — sample data
      </p>

      <AlertDialog open={confirmSendOpen} onOpenChange={setConfirmSendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send this note?</AlertDialogTitle>
            <AlertDialogDescription>
              Your note goes to {firstName} with their report. You can send one
              note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendNote}>
              Send note
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
