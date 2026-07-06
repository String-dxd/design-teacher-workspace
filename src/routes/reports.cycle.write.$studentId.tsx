import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Term } from '@/types/report'
import {
  CURRENT_ACADEMIC_YEAR,
  generateReportFromStudent,
} from '@/data/mock-reports'
import { getStudentById, mockStudents } from '@/data/mock-students'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { Button, buttonVariants } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ReportPreview } from '@/components/reports/report-preview'
import { loadCycle, patchStudent } from '@/lib/hdp-cycle-store'
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
  const term: Term = search.term ?? 'Term 2'

  const cycle = useMemo(() => loadCycle(classId, term), [classId, term])

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
  const [comments, setComments] = useState(
    () => draft?.comments ?? report?.teacherComments ?? '',
  )
  const [parentMessage, setParentMessage] = useState(
    () => draft?.parentMessage ?? '',
  )
  const [markState, setMarkState] = useState<'idle' | 'loading' | 'error'>(
    'idle',
  )
  const errorRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

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

  // Debounced write-through to localStorage.
  useEffect(() => {
    if (!cycle) return
    const handle = window.setTimeout(() => {
      patchStudent(classId, term, studentId, { comments, parentMessage })
    }, 500)
    return () => window.clearTimeout(handle)
  }, [comments, parentMessage, cycle, classId, term, studentId])

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
        parentMessage,
        ready: true,
      })
      if (updatedCycle) {
        commitCycleReport(currentStudent, term, updatedCycle)
      }
      setMarkState('idle')
      toast.success(`${currentStudent.name}’s report marked ready`)
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
            </p>
          </div>
          <div className="flex items-center gap-2">
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
            <Button
              onClick={handleMarkReady}
              disabled={markState === 'loading'}
            >
              {markState === 'loading' && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {markState === 'loading' ? 'Marking ready…' : 'Mark ready'}
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
        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <ReportPreview
            report={report}
            blocks={cycle.layout.blocks}
            editable
            comments={comments}
            onCommentsChange={setComments}
          />
        </div>

        <div className="mt-6 space-y-1.5">
          <Label htmlFor="parent-message">Note to parents (optional)</Label>
          <Textarea
            id="parent-message"
            placeholder="Add a short note for the parent…"
            value={parentMessage}
            onChange={(e) => setParentMessage(e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}
