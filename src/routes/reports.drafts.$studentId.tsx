import { Link, createFileRoute } from '@tanstack/react-router'
import { DraftStudio } from '@/components/hdp/draft-studio'
import { getStudentById } from '@/data/mock-students'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/reports/drafts/$studentId')({
  component: DraftStudioPage,
})

function DraftStudioPage() {
  const { studentId } = Route.useParams()
  const enabled = useFeatureFlag('reports-hdp')
  const student = getStudentById(studentId)

  useSetBreadcrumbs([
    { label: 'Reports', href: '/reports' },
    { label: 'Draft Studio', href: '/reports/drafts' },
    {
      label: student?.name ?? 'Student',
      href: `/reports/drafts/${studentId}`,
    },
  ])

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

  if (!student) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Student not found</h1>
        <Link to="/reports" className={cn(buttonVariants())}>
          Back to Reports
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{student.name}</h1>
        <p className="text-muted-foreground text-sm">
          Draft Studio — turn tags into an evidence-grounded comment.
        </p>
      </div>
      <DraftStudio studentId={studentId} />
    </main>
  )
}
