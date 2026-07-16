import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { mockStudents } from '@/data/mock-students'
import { CURRENT_TEACHER } from '@/data/hdp'
import {
  loadBroadcasts,
  seedIfEmpty,
  tagsForStudentVisible,
} from '@/lib/hdp-store'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'

export const Route = createFileRoute('/reports/students/')({
  component: StudentsIndexPage,
})

function StudentsIndexPage() {
  const enabled = useFeatureFlag('reports-hdp')
  const fullRiver = useFeatureFlag('reports-river-visibility')

  useSetBreadcrumbs([
    { label: 'Reports', href: '/reports' },
    { label: 'Students', href: '/reports/students' },
  ])

  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    seedIfEmpty()
    setMounted(true)
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

  // Form class first, as neighbouring classes.
  const classIds = [
    CURRENT_TEACHER.formClassId,
    ...CURRENT_TEACHER.teachingClasses,
  ]

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Students</h1>
        <p className="text-muted-foreground text-sm">
          Every student in your classes, with their river.
        </p>
      </div>

      {mounted && (
        <Tabs defaultValue={classIds[0]}>
          <TabsList>
            {classIds.map((classId) => (
              <TabsTrigger key={classId} value={classId}>
                {classId}
              </TabsTrigger>
            ))}
          </TabsList>
          {classIds.map((classId) => (
            <TabsContent key={classId} value={classId}>
              <ClassRoster classId={classId} fullRiver={fullRiver} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </main>
  )
}

function ClassRoster({
  classId,
  fullRiver,
}: {
  classId: string
  fullRiver: boolean
}) {
  const students = mockStudents.filter((s) => s.class === classId)
  const broadcasts = loadBroadcasts()

  return (
    <div className="border-border min-w-0 max-w-full overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Class</TableHead>
            <TableHead className="text-right">Tags this term</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            const visibleTags = tagsForStudentVisible(
              student.id,
              CURRENT_TEACHER.id,
              fullRiver,
            )
            const hasNil = broadcasts.some((b) =>
              b.responses.some(
                (r) =>
                  r.studentId === student.id &&
                  r.result.kind === 'nothing-stood-out',
              ),
            )
            const nilOnly = visibleTags.length === 0 && hasNil
            return (
              <TableRow key={student.id}>
                <TableCell>
                  <Link
                    to="/reports/students/$studentId"
                    params={{ studentId: student.id }}
                    className="font-medium hover:underline"
                  >
                    {student.name}
                  </Link>
                  {nilOnly && (
                    <p className="text-muted-foreground text-xs">
                      Reviewed — nothing noted
                    </p>
                  )}
                </TableCell>
                <TableCell>{student.class}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {visibleTags.length}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
