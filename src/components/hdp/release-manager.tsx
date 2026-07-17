import * as React from 'react'
import { BookOpen, PenLine } from 'lucide-react'
import { toast } from 'sonner'
import type { HdpReportBook, HdpTag } from '@/types/hdp'
import { DispositionChip } from '@/components/hdp/disposition-chip'
import { ReportBook } from '@/components/hdp/report-book'
import { ReportStory } from '@/components/hdp/report-story'
import { ToolCard } from '@/components/hdp/tool-card'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getStudentById, mockStudents } from '@/data/mock-students'
import { MOCK_STAFF } from '@/data/mock-staff'
import { CURRENT_TEACHER } from '@/data/hdp'
import {
  coverReflection,
  findDraft,
  loadMarks,
  loadPatterns,
  loadReportBooks,
  loadTags,
  previewReportBook,
  reflectionGatesShare,
  releaseToStudent,
  seedIfEmpty,
  shareReportBook,
} from '@/lib/hdp-store'
import { trendsForEntries } from '@/lib/hdp-trends'
import { useFeatureFlag } from '@/hooks/use-feature-flag'

function staffName(id: string): string {
  return MOCK_STAFF.find((s) => s.id === id)?.name ?? 'Unknown teacher'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function draftStatusLabel(studentId: string): string {
  const draft = findDraft(studentId, 'overall')
  if (!draft) return 'No draft'
  return draft.status === 'confirmed' ? 'Confirmed' : 'Drafting'
}

// The "Send to parents" tab of /reports — extracted from the former
// /reports/release page (the route now redirects here). Same store calls
// and share/release flow; the preview target moved from a search param to
// local state now that this renders inside a tab rather than owning a URL.
export function ReleaseManager() {
  const showFuture = useFeatureFlag('reports-hdp-future')

  const [mounted, setMounted] = React.useState(false)
  const [books, setBooks] = React.useState<Array<HdpReportBook>>([])
  const [shareTarget, setShareTarget] = React.useState<string | null>(null)
  const [releaseTarget, setReleaseTarget] = React.useState<string | null>(null)
  const [preview, setPreview] = React.useState<string | null>(null)
  const [register, setRegister] = React.useState<'book' | 'story'>('book')
  const [viewport, setViewport] = React.useState<'desktop' | 'mobile'>(
    'desktop',
  )

  const refresh = React.useCallback(() => {
    seedIfEmpty()
    setBooks(loadReportBooks())
  }, [])

  React.useEffect(() => {
    setMounted(true)
    refresh()
  }, [refresh])

  const resolveTag = React.useCallback((tagId: string) => {
    const tag = loadTags().find((t: HdpTag) => t.id === tagId)
    return tag ? { tag, authorName: staffName(tag.authorId) } : undefined
  }, [])

  const students = mockStudents.filter(
    (s) => s.class === CURRENT_TEACHER.formClassId,
  )
  const shareTargetStudent = shareTarget ? getStudentById(shareTarget) : null
  const releaseTargetStudent = releaseTarget
    ? getStudentById(releaseTarget)
    : null
  // previewReportBook assembles the same confirmed-drafts snapshot
  // shareReportBook would freeze into the book — without persisting it — so
  // an unshared book's Preview never omits sections (e.g. "Personal
  // qualities") that the real parent link would show once shared.
  const previewBook = preview ? previewReportBook(preview) : undefined
  const previewStudent = preview ? getStudentById(preview) : undefined

  function bookFor(studentId: string): HdpReportBook | undefined {
    return books.find((b) => b.studentId === studentId)
  }

  function linkFor(studentId: string): string {
    return `${window.location.origin}/hdp-report/hdp-${studentId}`
  }

  function studentLinkFor(studentId: string): string {
    return `${window.location.origin}/hdp-student/hdp-student-${studentId}`
  }

  function copyLink(studentId: string, studentName: string) {
    const book = bookFor(studentId)
    if (!book?.sharedAt) return
    navigator.clipboard
      .writeText(linkFor(studentId))
      .then(() => toast.success(`Link copied for ${studentName}`))
      .catch(() => toast.error('Could not copy the link'))
  }

  function copyStudentLink(studentId: string, studentName: string) {
    const book = bookFor(studentId)
    if (!book?.studentReleasedAt) return
    navigator.clipboard
      .writeText(studentLinkFor(studentId))
      .then(() => toast.success(`Student link copied for ${studentName}`))
      .catch(() => toast.error('Could not copy the link'))
  }

  function handleShareConfirm() {
    if (!shareTarget) return
    shareReportBook(shareTarget)
    setShareTarget(null)
    refresh()
    const name = getStudentById(shareTarget)?.name ?? 'This student'
    toast.success(`${name}'s report book is now shared`)
  }

  function handleReleaseConfirm() {
    if (!releaseTarget) return
    releaseToStudent(releaseTarget)
    setReleaseTarget(null)
    refresh()
    const name = getStudentById(releaseTarget)?.name ?? 'This student'
    toast.success(`${name}'s report is released to them`)
  }

  return (
    <div className="flex flex-col gap-8">
      {mounted && (
        <ul className="flex flex-col gap-3">
          {students.map((student) => {
            const book = bookFor(student.id)
            const draftStatus = draftStatusLabel(student.id)
            const hasConfirmedOverallDraft =
              findDraft(student.id, 'overall')?.status === 'confirmed'
            // Flag off: "Share with parents" is gated only by a confirmed
            // overall draft. Flag on: the student must be released first AND
            // their cover reflection must clear the >=3-sentence gate (plan
            // 041) — the UI gate lives here, not in shareReportBook.
            const reflectionReady = showFuture
              ? reflectionGatesShare(student.id)
              : true
            const canShareWithParents = showFuture
              ? hasConfirmedOverallDraft &&
                Boolean(book?.studentReleasedAt) &&
                reflectionReady
              : hasConfirmedOverallDraft
            const shareDisabledTitle = !hasConfirmedOverallDraft
              ? 'Confirm a draft first'
              : !book?.studentReleasedAt
                ? 'Release to the student first'
                : `Waiting for ${student.name}'s reflection (at least three sentences)`

            const metaParts: Array<string> = [
              draftStatus === 'Confirmed'
                ? 'Draft confirmed'
                : draftStatus === 'Drafting'
                  ? 'Draft in progress'
                  : 'No draft yet',
            ]
            if (showFuture && book?.studentReleasedAt) {
              metaParts.push(
                book.studentReactedAt && reflectionGatesShare(student.id)
                  ? `Reflected ${formatDate(book.studentReactedAt)}`
                  : `Released to student ${formatDate(book.studentReleasedAt)}`,
              )
            }
            if (book?.sharedAt) {
              metaParts.push(`Shared ${formatDate(book.sharedAt)}`)
            }

            return (
              <li
                key={student.id}
                className="border-border flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{student.name}</span>
                    {book?.acknowledgement ? (
                      <Badge className="bg-lime-3 text-lime-11 hover:bg-lime-3">
                        Acknowledged
                      </Badge>
                    ) : book?.sharedAt ? (
                      <Badge className="bg-twblue-3 text-twblue-11 hover:bg-twblue-3">
                        Shared — awaiting
                      </Badge>
                    ) : hasConfirmedOverallDraft ? (
                      <Badge className="bg-muted text-muted-foreground hover:bg-muted">
                        Ready
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {metaParts.join(' · ')}
                    {book?.acknowledgement &&
                      ` · Acknowledged ${formatDate(book.acknowledgement.at)}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-nowrap items-center gap-1.5 whitespace-nowrap">
                  {book ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreview(student.id)}
                    >
                      Preview
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled
                      title="No report book yet"
                    >
                      Preview
                    </Button>
                  )}
                  {showFuture &&
                    (book?.studentReleasedAt ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyStudentLink(student.id, student.name)
                        }
                      >
                        Copy student link
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!hasConfirmedOverallDraft}
                        title={
                          hasConfirmedOverallDraft
                            ? undefined
                            : 'Confirm a draft first'
                        }
                        onClick={() => setReleaseTarget(student.id)}
                      >
                        Release to student
                      </Button>
                    ))}
                  {book?.sharedAt ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLink(student.id, student.name)}
                    >
                      Copy link
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canShareWithParents}
                      title={
                        canShareWithParents ? undefined : shareDisabledTitle
                      }
                      onClick={() => setShareTarget(student.id)}
                    >
                      Share with parents
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* The preview opens as a dialog (maintainer feedback 2026-07-17):
          register toggle (flag on) plus a desktop/mobile viewport toggle so
          the teacher can see the report the way a parent's phone will. */}
      <Dialog
        open={Boolean(mounted && previewBook && previewStudent)}
        onOpenChange={(open) => {
          if (!open) setPreview(null)
        }}
      >
        <DialogContent className="flex max-h-[90vh] w-full flex-col overflow-y-auto sm:w-[880px] sm:max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>
              Preview — {previewStudent?.name ?? 'Report'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {showFuture ? (
              <div className="flex items-center gap-1.5">
                <DispositionChip
                  label="Report book"
                  selected={register === 'book'}
                  onClick={() => setRegister('book')}
                />
                <DispositionChip
                  label="Story"
                  selected={register === 'story'}
                  onClick={() => setRegister('story')}
                />
              </div>
            ) : (
              <span aria-hidden />
            )}
            <div className="flex items-center gap-1.5">
              <DispositionChip
                label="Desktop"
                selected={viewport === 'desktop'}
                onClick={() => setViewport('desktop')}
              />
              <DispositionChip
                label="Mobile"
                selected={viewport === 'mobile'}
                onClick={() => setViewport('mobile')}
              />
            </div>
          </div>
          {previewBook && previewStudent && (
            <div
              className={
                viewport === 'mobile'
                  ? 'border-border mx-auto w-[375px] max-w-full overflow-y-auto rounded-2xl border p-4 shadow-sm'
                  : 'min-w-0'
              }
            >
              {showFuture && register === 'story' ? (
                <ReportStory
                  book={previewBook}
                  studentName={previewStudent.name}
                  className={previewStudent.class}
                  viewer="teacher-preview"
                  reflection={coverReflection(previewBook.studentId)}
                  patterns={loadPatterns().filter(
                    (p) => p.studentId === previewBook.studentId,
                  )}
                  showFuture={showFuture}
                  trends={trendsForEntries(loadMarks(previewBook.studentId))}
                />
              ) : (
                <ReportBook
                  book={previewBook}
                  studentName={previewStudent.name}
                  className={previewStudent.class}
                  viewer="teacher-preview"
                  resolveTag={resolveTag}
                  showFuture={showFuture}
                  trends={
                    showFuture
                      ? trendsForEntries(loadMarks(previewBook.studentId))
                      : []
                  }
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {!showFuture && (
        <section className="border-border flex flex-col gap-3 border-t pt-6">
          <h2 className="text-sm font-medium">
            Coming later: student-first release
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <ToolCard
              icon={PenLine}
              name="Three-act release (student reacts and reflects first)"
              description="Students see their report first and add a reflection before it goes to parents."
              state="Planned — Prototype B / Phase 3"
              locked
            />
            <ToolCard
              icon={BookOpen}
              name="Story & full-report renderings"
              description="Wrapped-style and full chaptered report renderings."
              state="Planned — Prototype B / Phase 3"
              locked
            />
          </div>
        </section>
      )}

      <AlertDialog
        open={shareTarget !== null}
        onOpenChange={(open) => !open && setShareTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share this report book?</AlertDialogTitle>
            <AlertDialogDescription>
              This makes {shareTargetStudent?.name ?? 'this student'}'s report
              available at a parent link. In the pilot, links go out via Parents
              Gateway. The report leads with{' '}
              {shareTargetStudent?.name ?? 'this student'}'s story and
              conversation starters; results follow as an appendix.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleShareConfirm}>
              Share
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={releaseTarget !== null}
        onOpenChange={(open) => !open && setReleaseTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Release this report to the student?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {releaseTargetStudent?.name ?? 'This student'} sees their report
              first and can add a reflection. Parents come after.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReleaseConfirm}>
              Release to student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
