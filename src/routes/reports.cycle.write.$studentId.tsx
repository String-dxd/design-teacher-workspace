import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Link,
  createFileRoute,
  useBlocker,
  useNavigate,
} from '@tanstack/react-router'
import { format } from 'date-fns'
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  Smartphone,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Term } from '@/types/report'
import {
  CURRENT_ACADEMIC_YEAR,
  CURRENT_TERM,
  generateReportFromStudent,
} from '@/data/mock-reports'
import { getStudentById, mockStudents } from '@/data/mock-students'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ReportPreview } from '@/components/reports/report-preview'
import { PgReportPreviewDialog } from '@/components/reports/pg-report-preview-dialog'
import { hasAnyResults } from '@/data/mock-cockpit-submissions'
import { ensureCycle, loadCycle, patchStudent } from '@/lib/hdp-cycle-store'
import { commitCycleReport } from '@/lib/hdp-report-commit'
import { cn } from '@/lib/utils'

interface WriteSearch {
  classId?: string
  term?: Term
  /** Demo-only hook to force the error state for evidence. */
  fail?: boolean
}

export const Route = createFileRoute('/reports/cycle/write/$studentId')({
  component: CycleWritePage,
  validateSearch: (search: Record<string, unknown>): WriteSearch => ({
    classId: search.classId as string | undefined,
    term: search.term as Term | undefined,
    fail: search.fail === '1' || search.fail === 1 || search.fail === true,
  }),
})

function CycleWritePage() {
  const { studentId } = Route.useParams()
  // key forces a full remount when the active student changes, so per-student
  // editable state (comments/note) and the Tiptap editor content re-initialize
  // cleanly and loadCycle re-reads — otherwise the previous student's text
  // carries over (same-route param change re-renders, it does not remount).
  return <CycleWriteBody key={studentId} studentId={studentId} />
}

function CycleWriteBody({ studentId }: { studentId: string }) {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const builderEnabled = useFeatureFlag('hdp-reports')

  const student = getStudentById(studentId)
  const classId = search.classId ?? student?.class ?? ''
  const term: Term = search.term ?? CURRENT_TERM
  // P1-A pilots the pipeline: School Cockpit results gate writing, and the
  // report goes to school leaders for review instead of self-marked ready.
  const pipeline = classId === 'P1-A'

  // Bumped after writes that change pipeline state (autosave demotions, the
  // correction unlock) so `cycle`/`draft` re-read what the store now holds.
  const [cycleRefresh, setCycleRefresh] = useState(0)

  // The form-class flow never requires a conscious "set up layout" step —
  // layout editing is Level-scoped only — so provision the standard default
  // transparently if nothing exists yet. The hub already does this on
  // mount; this is defense-in-depth for a direct link that skips it.
  // ensureCycle is idempotent (reads back the existing cycle on any call
  // after the first), so calling it here during render is safe and avoids
  // a flash of the "No layout set up yet" block below.
  const cycle = useMemo(
    () =>
      pipeline
        ? ensureCycle(classId, term, CURRENT_ACADEMIC_YEAR)
        : loadCycle(classId, term),
    [classId, term, pipeline, cycleRefresh],
  )

  const classmates = useMemo(
    () =>
      mockStudents
        .filter((s) => s.class === classId)
        .sort((a, b) => a.indexNumber - b.indexNumber),
    [classId],
  )
  const currentIndex = classmates.findIndex((s) => s.id === studentId)
  const prevStudent = currentIndex > 0 ? classmates[currentIndex - 1] : null
  const nextStudent =
    currentIndex >= 0 && currentIndex < classmates.length - 1
      ? classmates[currentIndex + 1]
      : null

  const report = useMemo(() => {
    if (!student) return null
    return generateReportFromStudent(student, term, CURRENT_ACADEMIC_YEAR)
  }, [student, term])

  const draft = cycle?.perStudent[studentId]
  // Captured once on mount (the per-student key={studentId} remount at
  // CycleWritePage means this never goes stale) — the baseline "Send for
  // review" compares against, so a no-op open-then-close of an
  // already-approved/sent report doesn't re-arm the button.
  const [initialComments] = useState(() =>
    // Only what the teacher actually saved — never the report's sample
    // teacherComments, which would present filler as the teacher's own words
    // on a pupil whose comment is still pending. Strip tags so drafts saved
    // by the old rich-text editor load clean.
    (draft?.comments ?? '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  )
  const [comments, setComments] = useState(initialComments)
  const [markState, setMarkState] = useState<'idle' | 'loading' | 'error'>(
    'idle',
  )
  const [parentPreviewOpen, setParentPreviewOpen] = useState(false)
  const [correctionOpen, setCorrectionOpen] = useState(false)
  const resultsIn = !pipeline || !student || hasAnyResults(student.id)
  // Once a report is with parents it's view-only — the pipeline can only be
  // reopened through the explicit "Make a correction" flow below.
  const sentToParents = pipeline && draft?.sentAt !== undefined
  // Already been through review (approved, or sent — which implies approved)
  // — resubmitting is a no-op unless the teacher actually changed something,
  // so "Submit for review" stays disabled until they do.
  const alreadyReviewed =
    pipeline &&
    (draft?.reviewStatus === 'approved' || draft?.sentAt !== undefined)
  const hasChanges = comments !== initialComments
  // An empty report can't go for review — there's nothing to approve.
  const hasComment = comments.trim() !== ''
  const canSendForReview = hasComment && (!alreadyReviewed || hasChanges)
  const errorRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Save-status feedback for the debounced autosave below.
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>(
    'idle',
  )
  const lastSavedRef = useRef(initialComments)

  // Comment text sitting unsaved in the field's edit mode (before "Save
  // changes") is the one state that navigation genuinely destroys — block
  // route changes and tab closes while it exists.
  const commentDirtyRef = useRef(false)
  useBlocker({
    shouldBlockFn: () => {
      if (!commentDirtyRef.current) return false
      return !window.confirm(
        'You have unsaved comment edits — leave and discard them?',
      )
    },
    enableBeforeUnload: () => commentDirtyRef.current,
  })

  // How far through the class the teacher is — shown in the header so the
  // pager doesn't require bouncing back to the hub to re-orient.
  const draftedCount = useMemo(
    () =>
      classmates.filter((s) => {
        const d = cycle?.perStudent[s.id]
        return (
          !!d &&
          (d.comments.trim() !== '' ||
            d.reviewStatus !== undefined ||
            d.sentAt !== undefined)
        )
      }).length,
    [classmates, cycle],
  )

  useSetBreadcrumbs([
    { label: 'Reports', href: '/reports' },
    {
      label: student ? `Write · ${student.name}` : 'Write',
      href: `/reports/cycle/write/${studentId}`,
    },
  ])

  useEffect(() => {
    document.title = student
      ? `Write · ${student.name} · Reports`
      : 'Write · Reports'
  }, [student])

  // On arriving at a pupil (initial load or pager step), land focus on the
  // student heading so the teacher sees which pupil they're on, rather than
  // being dropped into the comments editor (A11Y-11 focus-on-step-change). The
  // Tiptap editor calls its focus command on mount, which defers a view.focus()
  // by one animation frame; we focus the heading a frame later so it wins that
  // one-time grab. The per-student remount (key={studentId}) runs this once per
  // pupil. focus() also scrolls the heading's container to the top.
  useEffect(() => {
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        headingRef.current?.focus()
      })
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [])

  // Focus must move after the error banner renders (established focus-move pattern).
  useEffect(() => {
    if (markState === 'error') errorRef.current?.focus()
  }, [markState])

  // Debounced write-through to localStorage, with visible save status. Sent
  // reports never autosave — they're view-only until explicitly corrected.
  useEffect(() => {
    if (!cycle || sentToParents) return
    if (comments === lastSavedRef.current) return
    setSaveState('saving')
    const handle = window.setTimeout(() => {
      const before = loadCycle(classId, term)?.perStudent[studentId]
      patchStudent(classId, term, studentId, { comments })
      lastSavedRef.current = comments
      setSaveState('saved')
      // patchStudent demotes an approved draft on a comment change — tell the
      // teacher the approval (and any pending scheduled send) was reset
      // rather than letting it change silently.
      if (before?.reviewStatus === 'approved' && !before.sentAt) {
        toast.info(
          before.scheduledSendAt
            ? 'Scheduled send cancelled — the edited report needs approval again before it can go to parents'
            : 'Approval reset — submit this report for review again before it can go to parents',
        )
        setCycleRefresh((k) => k + 1)
      }
    }, 500)
    return () => window.clearTimeout(handle)
  }, [comments, cycle, sentToParents, classId, term, studentId])

  if (!builderEnabled) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Report Builder is off</h1>
        <p className="text-muted-foreground text-sm">
          Turn on “HDP Report Builder” to use this page.
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

  if (!student || !report) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Student not found</h1>
        <Link to="/reports" className={cn(buttonVariants())}>
          Back to Reports
        </Link>
      </main>
    )
  }

  if (!cycle) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">No layout set up yet</h1>
        <p className="text-muted-foreground text-sm">
          Set up a report layout for {classId} · {term} before writing reports.
        </p>
        <Link
          to="/reports/cycle/layout"
          search={{ classId, term }}
          className={cn(buttonVariants())}
        >
          Set up layout
        </Link>
      </main>
    )
  }

  function goToStudent(id: string) {
    navigate({
      to: '/reports/cycle/write/$studentId',
      params: { studentId: id },
      search: { classId, term },
    })
  }

  // Reopens a sent report for correction: the pipeline restarts from Draft,
  // so the corrected version must be approved and re-sent. Parents keep the
  // version they already received until then.
  function handleUnlockCorrection() {
    if (!student) return
    patchStudent(classId, term, studentId, {
      sentAt: undefined,
      ackAt: undefined,
      scheduledSendAt: undefined,
      reviewStatus: undefined,
      ready: false,
      submittedAt: undefined,
    })
    setCorrectionOpen(false)
    setCycleRefresh((k) => k + 1)
    toast.info(
      `${student.name}’s report is unlocked for correction — it needs approval and re-sending`,
    )
  }

  function handleMarkReady() {
    if (!student || !cycle) return
    const currentStudent = student
    setMarkState('loading')
    window.setTimeout(() => {
      if (search.fail) {
        setMarkState('error')
        return
      }
      const updatedCycle = patchStudent(classId, term, studentId, {
        comments,
        ready: true,
        ...(pipeline
          ? {
              reviewStatus: 'in_review' as const,
              submittedAt: new Date().toISOString(),
            }
          : {}),
      })
      if (updatedCycle) {
        commitCycleReport(currentStudent, term, updatedCycle)
      }
      setMarkState('idle')
      toast.success(
        pipeline
          ? `${currentStudent.name}’s report sent to school leaders for review`
          : `${currentStudent.name}’s report marked ready`,
      )
      navigate({ to: '/reports', search: { classId, term } as never })
    }, 600)
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <header className="shrink-0 border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            to="/reports"
            aria-label="Back to Reports"
            className={buttonVariants({ variant: 'ghost', size: 'icon' })}
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex-1">
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-lg font-semibold outline-none"
            >
              {student.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              {student.class} · {term}
              {currentIndex >= 0 && (
                <>
                  {' '}
                  · Pupil {currentIndex + 1} of {classmates.length} ·{' '}
                  {draftedCount} of {classmates.length} drafted
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              aria-live="polite"
              className="text-muted-foreground mr-1 text-xs"
            >
              {saveState === 'saving'
                ? 'Saving…'
                : saveState === 'saved'
                  ? 'All changes saved'
                  : ''}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label={`Previous student${prevStudent ? `: ${prevStudent.name}` : ''}`}
              disabled={!prevStudent}
              onClick={() => prevStudent && goToStudent(prevStudent.id)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={`Next student${nextStudent ? `: ${nextStudent.name}` : ''}`}
              disabled={!nextStudent}
              onClick={() => nextStudent && goToStudent(nextStudent.id)}
            >
              <ChevronRight className="size-4" />
            </Button>
            {resultsIn && (
              <Button
                variant="outline"
                onClick={() => setParentPreviewOpen(true)}
              >
                <Smartphone className="mr-2 size-4" />
                Preview as parent
              </Button>
            )}
            <Button
              onClick={handleMarkReady}
              disabled={
                markState === 'loading' || !resultsIn || !canSendForReview
              }
              title={
                !resultsIn
                  ? 'Waiting on results from School Cockpit'
                  : !hasComment
                    ? `Write a comment on ${student.name}’s term first`
                    : !canSendForReview
                      ? sentToParents
                        ? 'Sent to parents — make a correction to reopen this report'
                        : 'Already approved — edit the comments to resubmit for review'
                      : undefined
              }
            >
              {markState === 'loading' && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {markState === 'loading'
                ? pipeline
                  ? 'Submitting…'
                  : 'Marking ready…'
                : pipeline
                  ? 'Submit for review'
                  : 'Mark ready'}
            </Button>
          </div>
        </div>
        {markState === 'error' && (
          <div
            ref={errorRef}
            tabIndex={-1}
            className="border-destructive/40 bg-destructive/5 text-destructive focus-visible:ring-destructive/50 mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>
              Couldn’t mark {student.name}’s report ready. Check the student’s
              data and try again.
            </span>
          </div>
        )}
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 p-6">
        {!resultsIn ? (
          <div className="bg-card flex flex-col items-center gap-2 rounded-xl border p-10 text-center shadow-sm">
            <AlertCircle className="text-muted-foreground size-8" />
            <p className="text-sm font-medium">Results not in yet</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              School Cockpit hasn’t received all subject results for{' '}
              {student.name}. You can write this report once the results are in.
            </p>
          </div>
        ) : (
          <>
            {sentToParents && draft.sentAt && (
              <div className="bg-twblue-3 text-twblue-12 mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg px-4 py-3 text-sm">
                <Info className="text-twblue-11 size-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  Sent to parents on{' '}
                  {format(new Date(draft.sentAt), 'd MMM yyyy')} — this report
                  is now view-only.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-background"
                  onClick={() => setCorrectionOpen(true)}
                >
                  Make a correction
                </Button>
              </div>
            )}
            <div className="bg-card rounded-xl border p-6 shadow-sm">
              <ReportPreview
                report={report}
                blocks={cycle.layout.blocks}
                editable={!sentToParents}
                comments={comments}
                onCommentsChange={sentToParents ? undefined : setComments}
                onCommentDirtyChange={(dirty) => {
                  commentDirtyRef.current = dirty
                }}
                showMissingData
              />
            </div>
          </>
        )}
      </div>

      {/* Correcting a sent report restarts the pipeline — make the cost
          explicit before unlocking anything. */}
      <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Make a correction?</DialogTitle>
            <DialogDescription>
              Parents keep the report they already received until your
              corrected version is approved and re-sent. {student.name}’s
              report goes back to Draft and needs school-leader approval
              again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUnlockCorrection}>
              Unlock for correction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* How the report reads on a parent's phone in Parents Gateway. */}
      <PgReportPreviewDialog
        report={report}
        blocks={cycle.layout.blocks}
        comments={comments}
        ackDeadline={draft?.ackDeadline}
        open={parentPreviewOpen}
        onOpenChange={setParentPreviewOpen}
      />
    </div>
  )
}
