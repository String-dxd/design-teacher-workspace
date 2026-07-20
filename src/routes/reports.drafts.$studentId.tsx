import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { DraftStudio } from '@/components/hdp/draft-studio'
import { MarksGrid } from '@/components/hdp/marks-grid'
import { StudentSwitcher } from '@/components/hdp/student-switcher'
import { getStudentById } from '@/data/mock-students'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { Button } from '@/components/ui/button'
import { HdpFlagGate, HdpStudentNotFound } from '@/components/hdp/hdp-shell'

export const Route = createFileRoute('/reports/drafts/$studentId')({
  component: DraftStudioPage,
})

// The drafting workspace — reached by clicking a student on the Drafting
// tab. Two columns in the Posts-detail pattern (maintainer feedback
// 2026-07-17): the draft (NotebookLM-style summary with inline source
// chips) leads on the left; marks, trends, and the academic-results sync
// sit in the right rail. A compact select in the header switches students.
function DraftStudioPage() {
  const { studentId } = Route.useParams()
  const student = getStudentById(studentId)

  useSetBreadcrumbs([
    { label: 'Reports', href: '/reports' },
    { label: 'Drafting', href: '/reports/drafts' },
    {
      label: student?.name ?? 'Student',
      href: `/reports/drafts/${studentId}`,
    },
  ])

  // One column, one task (the old draft-left / marks-rail-right split left a
  // tall floating card and dead space): the draft leads, evidence sits under
  // its disclosure, and marks follow as a reference section — all on the
  // same readable measure.
  return (
    <HdpFlagGate>
      {!student ? (
        <HdpStudentNotFound />
      ) : (
        <main className="flex flex-col gap-6 px-6 py-6">
          <div className="flex max-w-3xl flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Back to Drafting"
                className="mt-0.5"
                render={<Link to="/reports" search={{ tab: 'drafting' }} />}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold">{student.name}</h1>
                <p className="text-muted-foreground text-sm">
                  {student.class} · Draft an evidence-grounded comment.
                </p>
              </div>
            </div>
            <StudentSwitcher currentStudentId={studentId} />
          </div>

          <div className="flex max-w-3xl flex-col gap-6">
            <DraftStudio studentId={studentId} />

            <section className="border-border border-t pt-4">
              {/* Keyed remount on studentId: the grid's per-cell <Input
                  defaultValue> is intentionally uncontrolled (autosave-on-blur,
                  no per-keystroke re-render) — without a key, switching students
                  would leave stale DOM input values from the previous student. */}
              <MarksGrid
                key={studentId}
                studentId={studentId}
                studentName={student.name}
              />
            </section>
          </div>
        </main>
      )}
    </HdpFlagGate>
  )
}
