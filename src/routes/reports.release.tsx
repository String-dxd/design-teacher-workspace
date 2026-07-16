import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
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
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
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
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'

interface ReleaseSearch {
  preview?: string
}

export const Route = createFileRoute('/reports/release')({
  component: ReleasePage,
  validateSearch: (search: Record<string, unknown>): ReleaseSearch => ({
    preview: typeof search.preview === 'string' ? search.preview : undefined,
  }),
})

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

function ReleasePage() {
  const enabled = useFeatureFlag('reports-hdp')
  const showFuture = useFeatureFlag('reports-hdp-future')
  const { preview } = Route.useSearch()
  const navigate = Route.useNavigate()

  useSetBreadcrumbs([
    { label: 'Reports', href: '/reports' },
    { label: 'Release', href: '/reports/release' },
  ])

  const [mounted, setMounted] = React.useState(false)
  const [books, setBooks] = React.useState<Array<HdpReportBook>>([])
  const [shareTarget, setShareTarget] = React.useState<string | null>(null)
  const [releaseTarget, setReleaseTarget] = React.useState<string | null>(null)
  const [register, setRegister] = React.useState<'book' | 'story'>('book')
  const previewHeadingRef = React.useRef<HTMLHeadingElement>(null)

  const refresh = React.useCallback(() => {
    seedIfEmpty()
    setBooks(loadReportBooks())
  }, [])

  React.useEffect(() => {
    setMounted(true)
    refresh()
  }, [refresh])

  // The preview region can open ~1100px below the click point with no other
  // feedback — scroll it into view and move focus to its heading (context
  // replacement, matching the broadcast composer's success-panel pattern),
  // so opening a preview is never a silent, easy-to-miss jump.
  React.useEffect(() => {
    if (!preview) return
    previewHeadingRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
    previewHeadingRef.current?.focus()
  }, [preview])

  const resolveTag = React.useCallback((tagId: string) => {
    const tag = loadTags().find((t: HdpTag) => t.id === tagId)
    return tag ? { tag, authorName: staffName(tag.authorId) } : undefined
  }, [])

  if (!enabled) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Reports is off</h1>
        <p className="text-muted-foreground text-sm">
          Turn on “HDP Reports module” to use this page.
        </p>
        <Link
          to="/flags"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Open feature flags
        </Link>
      </main>
    )
  }

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

  function openPreview(studentId: string) {
    navigate({ search: (prev) => ({ ...prev, preview: studentId }) })
  }

  function closePreview() {
    navigate({ search: (prev) => ({ ...prev, preview: undefined }) })
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Release</h1>
        <p className="text-muted-foreground text-sm">
          Share finished report books with parents.
        </p>
      </div>

      {mounted && (
        <div className="min-w-0 max-w-full overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Draft</TableHead>
                <TableHead>Book</TableHead>
                {showFuture && <TableHead>Student</TableHead>}
                <TableHead>Shared</TableHead>
                <TableHead>Acknowledged</TableHead>
                <TableHead className="sr-only">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const book = bookFor(student.id)
                const draftStatus = draftStatusLabel(student.id)
                const hasConfirmedOverallDraft =
                  findDraft(student.id, 'overall')?.status === 'confirmed'
                // Flag off: "Share with parents" is gated only by a
                // confirmed overall draft, exactly as before this plan.
                // Flag on: the student must be released first AND their
                // cover reflection must clear the ≥3-sentence gate (plan
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
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.name}
                    </TableCell>
                    <TableCell>{draftStatus}</TableCell>
                    <TableCell>{book ? 'Yes' : '—'}</TableCell>
                    {showFuture && (
                      <TableCell className="tabular-nums">
                        {book?.studentReactedAt &&
                        reflectionGatesShare(student.id)
                          ? `Reflected ${formatDate(book.studentReactedAt)}`
                          : book?.studentReleasedAt
                            ? `Released to student ${formatDate(book.studentReleasedAt)}`
                            : '—'}
                      </TableCell>
                    )}
                    <TableCell className="tabular-nums">
                      {book?.sharedAt
                        ? `Shared ${formatDate(book.sharedAt)}`
                        : '—'}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {book?.acknowledgement
                        ? `Acknowledged ${formatDate(book.acknowledgement.at)}`
                        : book?.sharedAt
                          ? 'Awaiting'
                          : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex flex-wrap justify-end gap-2">
                          {book ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openPreview(student.id)}
                            >
                              Preview
                            </Button>
                          ) : (
                            <span
                              className="text-muted-foreground text-xs"
                              title="No report book yet"
                            >
                              Preview
                            </span>
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
                          ) : canShareWithParents ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShareTarget(student.id)}
                            >
                              Share with parents
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled
                              title={shareDisabledTitle}
                            >
                              Share with parents
                            </Button>
                          )}
                        </div>
                        {book?.studentReleasedAt && !book.sharedAt && (
                          <Input
                            type="text"
                            readOnly
                            value={studentLinkFor(student.id)}
                            aria-label={`Student report link for ${student.name}`}
                            onFocus={(e) => e.currentTarget.select()}
                            className="h-7 w-56 text-xs"
                          />
                        )}
                        {book?.sharedAt && (
                          <Input
                            type="text"
                            readOnly
                            value={linkFor(student.id)}
                            aria-label={`Report link for ${student.name}`}
                            onFocus={(e) => e.currentTarget.select()}
                            className="h-7 w-56 text-xs"
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {mounted && previewBook && previewStudent && (
        <section className="border-border flex flex-col gap-4 rounded-lg border p-6">
          <div className="flex items-center justify-between gap-3">
            <h2
              ref={previewHeadingRef}
              tabIndex={-1}
              className="text-sm font-medium outline-none"
            >
              Preview — {previewStudent.name}
            </h2>
            <div className="flex items-center gap-3">
              {showFuture && (
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
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={closePreview}
              >
                Close preview
              </Button>
            </div>
          </div>
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
        </section>
      )}

      {!showFuture && (
        <section className="flex flex-col gap-3 border-t border-border pt-6">
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
    </main>
  )
}
