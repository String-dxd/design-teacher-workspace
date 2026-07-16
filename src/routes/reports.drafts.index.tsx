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
import { TIMETABLE } from '@/data/timetable'
import {
  findDraft,
  seedIfEmpty,
  tagsForStudent,
  tagsForStudentVisible,
} from '@/lib/hdp-store'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'

export const Route = createFileRoute('/reports/drafts/')({
  component: DraftsIndexPage,
})

function DraftsIndexPage() {
  const enabled = useFeatureFlag('reports-hdp')

  useSetBreadcrumbs([
    { label: 'Reports', href: '/reports' },
    { label: 'Draft Studio', href: '/reports/drafts' },
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

  // Form class first, as neighbouring classes — same order as /reports/students.
  const classIds = [
    CURRENT_TEACHER.formClassId,
    ...CURRENT_TEACHER.teachingClasses,
  ]

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Draft Studio</h1>
        <p className="text-muted-foreground text-sm">
          Turn tags into evidence-grounded report comments.
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
              <ClassWorklist classId={classId} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </main>
  )
}

/** The kind this teacher drafts for a given class: the overall remark for
 *  their own form class, a subject comment for classes they teach
 *  academically (the subject comes from the timetable). */
function draftKindForClass(classId: string): {
  kind: 'subject' | 'overall'
  subject?: string
} {
  if (classId === CURRENT_TEACHER.formClassId) return { kind: 'overall' }
  const subject = TIMETABLE.find(
    (t) => t.teacherId === CURRENT_TEACHER.id && t.classId === classId,
  )?.subject
  return { kind: 'subject', subject }
}

function statusLabel(status: 'none' | 'draft' | 'confirmed'): string {
  if (status === 'confirmed') return 'Confirmed'
  if (status === 'draft') return 'Draft'
  return 'None'
}

function ClassWorklist({ classId }: { classId: string }) {
  const students = mockStudents.filter((s) => s.class === classId)
  const { kind, subject } = draftKindForClass(classId)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">Evidence this cycle</TableHead>
          <TableHead>Draft status</TableHead>
          <TableHead className="sr-only">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => {
          const evidenceCount =
            kind === 'overall'
              ? tagsForStudentVisible(student.id, CURRENT_TEACHER.id, true)
                  .length
              : tagsForStudent(student.id).filter(
                  (t) =>
                    t.authorId === CURRENT_TEACHER.id &&
                    t.lifecycle === 'active',
                ).length
          const draft = findDraft(student.id, kind, subject)
          const status = draft ? draft.status : 'none'

          return (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.name}</TableCell>
              <TableCell className="text-right tabular-nums">
                {evidenceCount}
              </TableCell>
              <TableCell>{statusLabel(status)}</TableCell>
              <TableCell className="text-right">
                <Link
                  to="/reports/drafts/$studentId"
                  params={{ studentId: student.id }}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Draft
                </Link>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
