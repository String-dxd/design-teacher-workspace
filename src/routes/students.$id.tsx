import { useEffect } from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ArrowLeft, ChevronLeft, ChevronRight, Tag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { StudentProfile } from '@/components/students/student-profile'
import { InsightBuddy } from '@/components/insight-buddy'
import { useTagQueue } from '@/components/hdp/tag-queue-context'
import { getStudentById, mockStudents } from '@/data/mock-students'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { useFeatureFlag } from '@/hooks/use-feature-flag'

const PROFILE_PROMPTS = [
  "Summarise this student's wellbeing",
  'What are the key risk factors for this student?',
]

export const Route = createFileRoute('/students/$id')({
  component: StudentProfilePage,
  loader: ({ params }) => {
    const student = getStudentById(params.id)
    if (!student) {
      throw notFound()
    }

    const currentIndex = mockStudents.findIndex((s) => s.id === params.id)
    const prevStudent = currentIndex > 0 ? mockStudents[currentIndex - 1] : null
    const nextStudent =
      currentIndex < mockStudents.length - 1
        ? mockStudents[currentIndex + 1]
        : null

    return {
      student,
      prevStudentId: prevStudent?.id ?? null,
      nextStudentId: nextStudent?.id ?? null,
      currentIndex: currentIndex + 1,
      totalStudents: mockStudents.length,
    }
  },
})

function StudentProfilePage() {
  const { student, prevStudentId, nextStudentId } = Route.useLoaderData()
  const studentAnalyticsEnabled = useFeatureFlag('student-analytics')
  const hdpModuleEnabled = useFeatureFlag('reports-hdp')
  const { openTagQueue } = useTagQueue()

  useEffect(() => {
    document.querySelector('[data-scroll-container]')?.scrollTo({ top: 0 })
  }, [student.id])

  useSetBreadcrumbs([
    { label: 'Home', href: '/' },
    { label: 'Profile', href: '/students' },
    { label: student.name, href: `/students/${student.id}` },
  ])

  const headerControls = (
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        render={<Link to="/students" />}
      >
        <ArrowLeft className="mr-1 size-4" />
        {studentAnalyticsEnabled ? 'Profiles' : 'Student Insights'}
      </Button>

      <div className="flex items-center gap-2">
        {hdpModuleEnabled && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              openTagQueue({ studentId: student.id, entryPoint: 'row' })
            }
          >
            <Tag className="mr-1 size-4" />
            Tag this student
          </Button>
        )}
        {/* Prev/Next navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={!prevStudentId}
            render={
              prevStudentId ? (
                <Link to="/students/$id" params={{ id: prevStudentId }} />
              ) : undefined
            }
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={!nextStudentId}
            render={
              nextStudentId ? (
                <Link to="/students/$id" params={{ id: nextStudentId }} />
              ) : undefined
            }
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <main className="mx-auto max-w-5xl p-6">
      {/* Main profile content */}
      <StudentProfile student={student} headerControls={headerControls} />

      {/* Insight Buddy floating — gated behind student-analytics flag */}
      {studentAnalyticsEnabled && (
        <InsightBuddy
          examplePrompts={PROFILE_PROMPTS}
          student={student}
          floating
        />
      )}
    </main>
  )
}
