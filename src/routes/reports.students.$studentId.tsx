import { Link, createFileRoute } from '@tanstack/react-router'
import { StudentRiver } from '@/components/hdp/student-river'
import { getStudentById } from '@/data/mock-students'
import { CURRENT_TEACHER } from '@/data/hdp'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/reports/students/$studentId')({
  component: StudentRiverPage,
})

function StudentRiverPage() {
  const { studentId } = Route.useParams()
  const enabled = useFeatureFlag('reports-hdp')
  const fullRiver = useFeatureFlag('reports-river-visibility')
  const student = getStudentById(studentId)

  useSetBreadcrumbs([
    { label: 'Reports', href: '/reports' },
    { label: 'Students', href: '/reports/students' },
    {
      label: student?.name ?? 'Student',
      href: `/reports/students/${studentId}`,
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
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <StudentRiver
        studentId={studentId}
        viewerId={CURRENT_TEACHER.id}
        fullRiver={fullRiver}
      />
    </main>
  )
}
