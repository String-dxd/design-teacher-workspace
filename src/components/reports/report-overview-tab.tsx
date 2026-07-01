import { ChevronRight } from 'lucide-react'
import { StudentInfoCard } from './student-info-card'
import { AttendanceConductCard } from './attendance-conduct-card'
import { RadarChart } from './radar-chart'
import { TeacherCommentsCard } from './teacher-comments-card'
import type { HolisticReport } from '@/types/report'

interface ReportOverviewTabProps {
  report: HolisticReport
  onViewHolistic?: () => void
}

function getFirstName(name: string): string {
  return name.split(' ').filter((part) => part.length > 0)[0] ?? name
}

export function ReportOverviewTab({
  report,
  onViewHolistic,
}: ReportOverviewTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <StudentInfoCard
        name={report.studentName}
        studentClass={report.studentClass}
        nric={report.nric}
        indexNumber={report.indexNumber}
        formTeacher={report.formTeacher}
        coFormTeacher={report.coFormTeacher}
        promotionStatus={report.promotionStatus}
        schoolName={report.schoolName}
      />
      <AttendanceConductCard
        attendance={report.attendance}
        conduct={report.character.conduct}
      />
      <TeacherCommentsCard comments={report.teacherComments} />

      <div className="flex flex-col items-center gap-4 rounded-lg border p-6">
        <span className="inline-block rounded-full bg-orange-3 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-11">
          Core Values Journey
        </span>
        <h3 className="text-xl font-bold">Character Development</h3>
        <p className="text-muted-foreground text-center text-sm">
          Celebrating {getFirstName(report.studentName)}&apos;s personal growth
          journey
        </p>
        <RadarChart values={report.holistic.coreValues} colorScheme="pink" />
        {onViewHolistic && (
          <button
            type="button"
            onClick={onViewHolistic}
            className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium text-orange-11 transition-colors hover:bg-orange-3"
          >
            View Detailed Character Development
            <ChevronRight className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}
