import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { StudentRiver } from '@/components/hdp/student-river'
import { getStudentById } from '@/data/mock-students'
import { CURRENT_TEACHER } from '@/data/hdp'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { HdpFlagGate, HdpStudentNotFound } from '@/components/hdp/hdp-shell'

export const Route = createFileRoute('/reports/students/$studentId')({
  component: StudentRiverPage,
})

function StudentRiverPage() {
  const { studentId } = Route.useParams()
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

  return (
    <HdpFlagGate>
      {!student ? (
        <HdpStudentNotFound />
      ) : (
        <main className="flex flex-col gap-3 px-6 py-6">
          <div className="-ml-2.5">
            <Link
              to="/reports"
              search={{ tab: 'students' }}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'text-muted-foreground hover:text-foreground',
              )}
            >
              <ArrowLeft aria-hidden />
              My students
            </Link>
          </div>
          <div className="max-w-3xl">
            <StudentRiver
              studentId={studentId}
              viewerId={CURRENT_TEACHER.id}
              fullRiver={fullRiver}
            />
          </div>
        </main>
      )}
    </HdpFlagGate>
  )
}
